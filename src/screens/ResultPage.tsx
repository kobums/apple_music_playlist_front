import { useMemo } from 'react';
import type { TrackResult } from '../lib/api';
import Lozenge from '../components/Lozenge';
import SectionMessage from '../components/SectionMessage';
import '../styles/ResultPage.css';

interface ResultPageProps {
  results: TrackResult[];
  onReset: () => void;
}

export default function ResultPage({ results, onReset }: ResultPageProps) {
  const addedCount = useMemo(() => results.filter((result) => result.status).length, [results]);
  const failedCount = results.length - addedCount;

  return (
    <main className="result">
      <div className="result__header">
        <h1 className="result__heading">플레이리스트 결과</h1>
        <p className="result__summary">
          {results.length}곡 중 {addedCount}곡을 추가했습니다.
          {failedCount > 0 ? ` ${failedCount}곡은 찾지 못했습니다.` : ''}
        </p>
      </div>

      {results.length === 0 ? (
        <SectionMessage appearance="information" title="추가된 곡이 없습니다">
          입력한 목록에서 곡을 하나도 찾지 못했습니다. 아티스트와 곡 제목을 하이픈으로 구분해 다시
          입력해 주세요.
        </SectionMessage>
      ) : (
        <ul className="result__list">
          {results.map((result, index) => (
            <li key={`${index}-${result.song}`} className="result__item">
              <span className="result__song">{result.song}</span>
              {/*
                Status is a Lozenge with an icon and a text label, so it never
                depends on colour alone — the previous version coloured the whole
                row green or red with no other cue.
              */}
              <Lozenge appearance={result.status ? 'success' : 'danger'}>
                {result.status ? '추가됨' : '못 찾음'}
              </Lozenge>
            </li>
          ))}
        </ul>
      )}

      <div className="result__actions">
        <button type="button" className="btn btn--primary" onClick={onReset}>
          새 플레이리스트 만들기
        </button>
      </div>
    </main>
  );
}
