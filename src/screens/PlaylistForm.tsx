import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { FiInfo } from 'react-icons/fi';
import { useAuth } from '../auth/AuthContext';
import {
  fetchPlaylists,
  savePlaylist,
  SessionExpiredError,
  type Playlist,
  type SavePlaylistResult,
} from '../lib/api';
import { unauthorizeMusicKit } from '../lib/musickit';
import Celebration from '../components/Celebration';
import ResultPage from './ResultPage';
import SectionMessage from '../components/SectionMessage';
import Spinner from '../components/Spinner';
import Tooltip from '../components/Tooltip';
import '../styles/PlaylistForm.css';

const CELEBRATION_MS = 2400;

/** Sentinel for the "make a new one" option in the target dropdown. */
const NEW_PLAYLIST = '';

interface FieldErrors {
  title?: string;
  content?: string;
}

export default function PlaylistForm() {
  const { developerToken, musicUserToken, clear } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistId, setPlaylistId] = useState<string>(NEW_PLAYLIST);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(true);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState<SavePlaylistResult | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const targetId = useId();
  const titleId = useId();
  const titleErrorId = useId();
  const contentId = useId();
  const contentErrorId = useId();
  const contentHelperId = useId();

  // Loaded once so the user picks a target instead of typing a name that has to
  // be matched. A failure here is not fatal: creating a new playlist by name
  // still works, so the form stays usable.
  useEffect(() => {
    if (!musicUserToken) {
      setIsLoadingPlaylists(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const found = await fetchPlaylists(musicUserToken);
        if (!cancelled) {
          setPlaylists(found);
        }
      } catch (cause) {
        if (!cancelled) {
          setPlaylistsError(
            cause instanceof Error
              ? `${cause.message} 새 플레이리스트 만들기는 그대로 쓸 수 있습니다.`
              : '플레이리스트 목록을 불러오지 못했습니다.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPlaylists(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [musicUserToken]);

  // The old code nested two `setTimeout`s inside `finally` and never cleared
  // them, so unmounting mid-celebration left timers running against dead state.
  useEffect(() => {
    if (!showCelebration) {
      return;
    }
    const timer = window.setTimeout(() => setShowCelebration(false), CELEBRATION_MS);
    return () => window.clearTimeout(timer);
  }, [showCelebration]);

  // Display name for the chosen playlist. The server uses the id to target it
  // and only echoes this back for the results screen.
  const selectedPlaylistName =
    playlists.find((playlist) => playlist.id === playlistId)?.name ?? '';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const nextErrors: FieldErrors = {};
    if (playlistId === NEW_PLAYLIST && !title.trim()) {
      nextErrors.title = '플레이리스트 제목을 입력해 주세요.';
    }
    if (!content.trim()) {
      nextErrors.content = '추가할 곡을 한 줄에 하나씩 입력해 주세요.';
    }
    setFieldErrors(nextErrors);

    if (nextErrors.title) {
      titleRef.current?.focus();
      return;
    }
    if (nextErrors.content) {
      contentRef.current?.focus();
      return;
    }

    setSubmitError(null);
    setIsSaving(true);

    try {
      const result = await savePlaylist({
        title: playlistId === NEW_PLAYLIST ? title.trim() : selectedPlaylistName,
        playlistId: playlistId === NEW_PLAYLIST ? undefined : playlistId,
        list: content,
        userToken: musicUserToken ?? '',
        developerToken: developerToken ?? '',
      });
      setSaved(result);
      // The celebration used to fire from `finally`, so a failed save still
      // congratulated the user. It is now tied to a successful response only,
      // and only when something actually went in — a screen full of "needs
      // checking" is not a completed job.
      if (result.results.some((row) => row.status === 'added')) {
        setShowCelebration(true);
      }
    } catch (cause) {
      if (cause instanceof SessionExpiredError) {
        // Retrying is pointless — the stored token is dead. Drop it everywhere
        // (ours and MusicKit's own storage) rather than showing a "try again"
        // error the user could tap forever. Clearing the tokens is enough to
        // move them: RequireAuth redirects to /login on the next render, and
        // the reason travels with the auth state so the sign-in screen can
        // explain itself.
        await unauthorizeMusicKit();
        clear(cause.message);
        return;
      }
      setSubmitError(
        cause instanceof Error ? cause.message : '플레이리스트를 저장하지 못했습니다.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setContent('');
    setPlaylistId(NEW_PLAYLIST);
    setSaved(null);
    setFieldErrors({});
    setSubmitError(null);
  };

  if (isSaving) {
    return (
      <main className="playlist playlist--centered">
        <div className="playlist__loading" role="status" aria-live="polite">
          <Spinner size={48} />
          <p>플레이리스트를 저장하는 중입니다. 곡 수에 따라 시간이 걸릴 수 있습니다.</p>
        </div>
      </main>
    );
  }

  if (saved) {
    return (
      <>
        <ResultPage
          playlistId={saved.playlistId}
          playlistName={saved.playlistName}
          existingCount={saved.existingCount}
          created={saved.created}
          results={saved.results}
          userToken={musicUserToken ?? ''}
          onReset={handleReset}
          onSessionExpired={(message) => {
            void unauthorizeMusicKit().then(() => clear(message));
          }}
        />
        <Celebration message="플레이리스트를 저장했습니다" show={showCelebration} />
      </>
    );
  }

  return (
    <main className="playlist">
      <div className="playlist__card">
        <h1 className="playlist__heading">플레이리스트 만들기</h1>

        {submitError ? (
          <SectionMessage appearance="error" title="플레이리스트를 저장하지 못했습니다">
            {submitError}
          </SectionMessage>
        ) : null}

        <form className="playlist__form" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <div className="field">
            {/* The tooltip trigger sits beside the label, not inside it — a
                button nested in a <label> steals the click and focuses the
                input instead of opening the tooltip. */}
            <div className="field__label-row">
              <label className="field__label" htmlFor={targetId}>
                어디에 추가할까요
              </label>
              <Tooltip
                label="플레이리스트 선택 도움말"
                message="기존 플레이리스트를 고르면 그 뒤에 곡이 추가됩니다."
              >
                <FiInfo size={16} aria-hidden="true" />
              </Tooltip>
            </div>
            <select
              id={targetId}
              className="field__input"
              value={playlistId}
              disabled={isLoadingPlaylists}
              onChange={(event) => setPlaylistId(event.target.value)}
            >
              <option value={NEW_PLAYLIST}>+ 새 플레이리스트 만들기</option>
              {playlists.map((playlist) => (
                <option key={playlist.id} value={playlist.id}>
                  {playlist.name}
                </option>
              ))}
            </select>
            {isLoadingPlaylists ? (
              <p className="field__helper">플레이리스트 목록을 불러오는 중입니다.</p>
            ) : null}
            {playlistsError ? <p className="field__error">{playlistsError}</p> : null}
          </div>

          {/* Only a new playlist needs a name; an existing one already has one. */}
          {playlistId === NEW_PLAYLIST ? (
            <div className="field">
              <label className="field__label" htmlFor={titleId}>
                새 플레이리스트 제목
              </label>
              <input
                id={titleId}
                ref={titleRef}
                className="field__input"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                aria-invalid={fieldErrors.title ? 'true' : undefined}
                aria-describedby={fieldErrors.title ? titleErrorId : undefined}
              />
              {fieldErrors.title ? (
                <p className="field__error" id={titleErrorId}>
                  {fieldErrors.title}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="field">
            <div className="field__label-row">
              <label className="field__label" htmlFor={contentId}>
                추가할 곡
              </label>
              <Tooltip
                label="곡 목록 도움말"
                message="한 줄에 한 곡씩, '아티스트 - 곡 제목' 형식으로 적어 주세요."
              >
                <FiInfo size={16} aria-hidden="true" />
              </Tooltip>
            </div>
            <textarea
              id={contentId}
              ref={contentRef}
              className="field__textarea"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={'빅뱅 - 붉은 노을\n아이유 - 밤편지'}
              aria-invalid={fieldErrors.content ? 'true' : undefined}
              aria-describedby={
                fieldErrors.content ? `${contentErrorId} ${contentHelperId}` : contentHelperId
              }
            />
            <p className="field__helper" id={contentHelperId}>
              한 줄에 한 곡씩 적습니다. 아티스트와 곡 제목 사이는 하이픈으로 구분합니다.
            </p>
            {fieldErrors.content ? (
              <p className="field__error" id={contentErrorId}>
                {fieldErrors.content}
              </p>
            ) : null}
          </div>

          <button type="submit" className="btn btn--primary btn--fit-container">
            플레이리스트 저장
          </button>
        </form>
      </div>
    </main>
  );
}
