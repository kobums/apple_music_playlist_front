import React from 'react';
import './assets/css/ResultPage.css';
import { useNavigate } from 'react-router-dom';

interface ResultPageProps {
  results: Array<{ song: string; status: boolean }>;
  onReset: () => void; // 리셋 함수 prop 추가
}

const ResultPage: React.FC<ResultPageProps> = ({ results, onReset }) => {
  const navigate = useNavigate();

  const handleConfirm = () => {
    onReset(); // 상태 리셋
    navigate('/login');
  };

  return (
    <div className="result-container">
      <h1>Playlist Results</h1>
      <ul className="result-list">
        {results.map((result, index) => (
          <li
            key={index}
            className={`result-item ${result.status ? 'success' : 'failure'}`}
          >
            {result.song}
          </li>
        ))}
      </ul>
      <button onClick={handleConfirm} className="confirm-button">확인</button>
    </div>
  );
};

export default ResultPage;