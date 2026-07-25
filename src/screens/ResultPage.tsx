import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { FiSearch } from 'react-icons/fi';
import { addTracks, searchTracks, type MatchStatus, type TrackResult } from '../lib/api';
import Lozenge from '../components/Lozenge';
import SectionMessage from '../components/SectionMessage';
import Spinner from '../components/Spinner';
import TrackOption from '../components/TrackOption';
import '../styles/ResultPage.css';

const SKIP = '';

interface ResultPageProps {
  playlistId: string;
  results: TrackResult[];
  userToken: string;
  onReset: () => void;
  onSessionExpired: (message: string) => void;
}

const STATUS_LABEL = {
  added: '추가됨',
  duplicate: '이미 있음',
  review: '확인 필요',
  missing: '못 찾음',
} as const;

const STATUS_APPEARANCE = {
  added: 'success',
  duplicate: 'default',
  review: 'default',
  missing: 'danger',
} as const;

/** Rows in these states are settled — nothing for the user to decide. */
const SETTLED: MatchStatus[] = ['added', 'duplicate'];

export default function ResultPage({
  playlistId,
  results,
  userToken,
  onReset,
  onSessionExpired,
}: ResultPageProps) {
  const [rows, setRows] = useState<TrackResult[]>(results);
  // Row index → chosen track id. Seeded with the best guess so confirming a
  // whole screen of suggestions is one click, not one click per row.
  const [selected, setSelected] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      results.flatMap((row, index) =>
        row.status === 'review' && row.track ? [[index, row.track.id]] : [],
      ),
    ),
  );
  const [queries, setQueries] = useState<Record<number, string>>({});
  const [searchingRow, setSearchingRow] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const groupId = useId();

  // One preview plays at a time, and it stops when leaving the screen.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const togglePreview = (url: string) => {
    if (playingUrl === url) {
      audioRef.current?.pause();
      setPlayingUrl(null);
      return;
    }

    audioRef.current?.pause();
    const audio = new Audio(url);
    audio.addEventListener('ended', () => setPlayingUrl(null), { once: true });
    audioRef.current = audio;
    setPlayingUrl(url);
    void audio.play().catch(() => setPlayingUrl(null));
  };

  const counts = useMemo(
    () => ({
      added: rows.filter((row) => row.status === 'added').length,
      duplicate: rows.filter((row) => row.status === 'duplicate').length,
      review: rows.filter((row) => row.status === 'review').length,
      missing: rows.filter((row) => row.status === 'missing').length,
    }),
    [rows],
  );

  const pending = useMemo(
    () =>
      rows.flatMap((row, index) =>
        !SETTLED.includes(row.status) && selected[index]
          ? [{ index, trackId: selected[index] }]
          : [],
      ),
    [rows, selected],
  );

  const candidatesFor = (row: TrackResult) => row.candidates ?? [];

  const handleSearch = async (event: FormEvent, index: number) => {
    event.preventDefault();
    const query = (queries[index] ?? '').trim();
    if (!query) {
      return;
    }

    setSearchingRow(index);
    setError(null);
    try {
      const found = await searchTracks(userToken, query);
      setRows((current) =>
        current.map((row, i) => (i === index ? { ...row, candidates: found } : row)),
      );
      if (found.length === 0) {
        setError(`"${query}" 검색 결과가 없습니다. 다른 표기로 시도해 보세요.`);
      }
    } catch (cause) {
      handleFailure(cause, '검색하지 못했습니다.');
    } finally {
      setSearchingRow(null);
    }
  };

  const handleAdd = async () => {
    if (pending.length === 0) {
      return;
    }

    setIsAdding(true);
    setError(null);
    try {
      const outcome = await addTracks(
        userToken,
        playlistId,
        pending.map((item) => item.trackId),
      );

      // The server skips anything already in the playlist, so a confirmed pick
      // can come back as "already there" rather than newly added.
      const chosenByRow = new Map(pending.map((item) => [item.index, item.trackId]));
      const wasAdded = new Set(outcome.added);
      const wasDuplicate = new Set(outcome.duplicate);

      setRows((current) =>
        current.map((row, index) => {
          const trackId = chosenByRow.get(index);
          if (!trackId) {
            return row;
          }

          const status: MatchStatus = wasDuplicate.has(trackId)
            ? 'duplicate'
            : wasAdded.has(trackId)
              ? 'added'
              : row.status;
          if (!SETTLED.includes(status)) {
            return row;
          }

          const chosen = candidatesFor(row).find((track) => track.id === trackId) ?? row.track;
          return { ...row, status, track: chosen, candidates: undefined };
        }),
      );
      setSelected({});
    } catch (cause) {
      handleFailure(cause, '곡을 추가하지 못했습니다.');
    } finally {
      setIsAdding(false);
    }
  };

  function handleFailure(cause: unknown, fallback: string) {
    const message = cause instanceof Error ? cause.message : fallback;
    if (cause instanceof Error && cause.name === 'SessionExpiredError') {
      onSessionExpired(message);
      return;
    }
    setError(message);
  }

  return (
    <main className="result">
      <div className="result__header">
        <h1 className="result__heading">플레이리스트 결과</h1>
        <p className="result__summary">
          {rows.length}곡 중 {counts.added}곡을 추가했습니다.
          {counts.duplicate > 0 ? ` ${counts.duplicate}곡은 이미 들어 있어 건너뛰었습니다.` : ''}
          {counts.review > 0 ? ` ${counts.review}곡은 확인이 필요합니다.` : ''}
          {counts.missing > 0 ? ` ${counts.missing}곡은 찾지 못했습니다.` : ''}
        </p>
      </div>

      {counts.review > 0 ? (
        <SectionMessage appearance="information" title="확인이 필요한 곡이 있습니다">
          같은 제목의 다른 아티스트나 라이브 버전일 수 있어 바로 넣지 않았습니다. 맞는 곡을 고른 뒤
          아래 버튼으로 추가해 주세요.
        </SectionMessage>
      ) : null}

      {error ? (
        <SectionMessage appearance="error" title="요청을 처리하지 못했습니다">
          {error}
        </SectionMessage>
      ) : null}

      {rows.length === 0 ? (
        <SectionMessage appearance="information" title="추가된 곡이 없습니다">
          입력한 목록에서 곡을 하나도 찾지 못했습니다. 아티스트와 곡 제목을 하이픈으로 구분해 다시
          입력해 주세요.
        </SectionMessage>
      ) : (
        <ul className="result__list">
          {rows.map((row, index) => {
            const candidates = candidatesFor(row);
            const needsAttention = !SETTLED.includes(row.status);

            return (
              <li key={`${index}-${row.song}`} className="result__item">
                <div className="result__row">
                  <span className="result__song">{row.song}</span>
                  <Lozenge appearance={STATUS_APPEARANCE[row.status]}>
                    {STATUS_LABEL[row.status]}
                  </Lozenge>
                </div>

                {SETTLED.includes(row.status) && row.track ? (
                  <p className="result__matched">
                    {row.track.artistName} - {row.track.name}
                  </p>
                ) : null}

                {needsAttention ? (
                  <div className="result__review">
                    {candidates.length > 0 ? (
                      <div className="result__candidates" role="radiogroup" aria-label={`${row.song} 후보`}>
                        {candidates.map((track) => (
                          <TrackOption
                            key={track.id}
                            track={track}
                            name={`${groupId}-${index}`}
                            selected={selected[index] === track.id}
                            onSelect={() =>
                              setSelected((current) => ({ ...current, [index]: track.id }))
                            }
                            isPlaying={playingUrl === track.previewUrl}
                            onTogglePreview={() =>
                              track.previewUrl && togglePreview(track.previewUrl)
                            }
                          />
                        ))}
                        <label className="result__skip">
                          <input
                            type="radio"
                            name={`${groupId}-${index}`}
                            checked={(selected[index] ?? SKIP) === SKIP}
                            onChange={() =>
                              setSelected((current) => {
                                const next = { ...current };
                                delete next[index];
                                return next;
                              })
                            }
                          />
                          이 곡은 건너뛰기
                        </label>
                      </div>
                    ) : null}

                    <form className="result__search" onSubmit={(event) => void handleSearch(event, index)}>
                      <input
                        type="search"
                        className="field__input"
                        placeholder="직접 검색: 아티스트 곡 제목"
                        aria-label={`${row.song} 직접 검색`}
                        value={queries[index] ?? ''}
                        onChange={(event) =>
                          setQueries((current) => ({ ...current, [index]: event.target.value }))
                        }
                      />
                      <button type="submit" className="btn" disabled={searchingRow === index}>
                        {searchingRow === index ? (
                          <Spinner size={16} />
                        ) : (
                          <FiSearch size={16} aria-hidden="true" />
                        )}
                        검색
                      </button>
                    </form>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <div className="result__actions">
        {pending.length > 0 ? (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void handleAdd()}
            disabled={isAdding}
          >
            {isAdding ? <Spinner size={16} /> : null}
            선택한 {pending.length}곡 추가
          </button>
        ) : null}
        <button type="button" className={pending.length > 0 ? 'btn' : 'btn btn--primary'} onClick={onReset}>
          새 플레이리스트 만들기
        </button>
      </div>
    </main>
  );
}
