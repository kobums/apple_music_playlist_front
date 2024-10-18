import './assets/css/PlaylistForm.css'; // 별도의 CSS 파일을 사용할 경우 추가
import React, { useState } from 'react';
import { FiInfo } from 'react-icons/fi';
import { useQueryClient } from 'react-query';
import axios from 'axios';
import ResultPage from './ResultPage';
import Tooltip from './Tooltip';
import Modal from './components/Modal';
import Celebration from './components/Celebration';

const PlaylistForm: React.FC = () => {
  const [title, setTitle] = useState<string>('');
  const [playlistContent, setPlaylistContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<Array<{ song: string; status: boolean }> | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [showCelebration, setShowCelebration] = useState<boolean>(false); // 축하 표시 여부

  // 버튼이 활성화되는지 확인하는 함수
  const isButtonDisabled = title === '' || playlistContent === '';

  const queryClient = useQueryClient();

  // react-query에서 musicUserToken 가져오기
  const userToken = queryClient.getQueryData<string>('musicUserToken');
  const developerToken = queryClient.getQueryData<string>('developerToken');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (title === '') {
      setModalMessage('플레이리스트 제목을 입력해주세요.');
      setShowModal(true);
      return;
    }
    if (playlistContent === '') {
      setModalMessage('플레이리스트 내용을 입력해주세요.');
      setShowModal(true);
      return;
    }

    setIsLoading(true);

    const payload = {
      title: title,
      list: playlistContent,
      userToken: userToken || '',
      developerToken: developerToken || '',
    };

    try {
      const response = await axios.post('http://localhost:8002/api/playlist', payload, {
        // const response = await axios.post('http://140.82.12.99:8002/api/playlist', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        console.log('Response from server:', response.data);
        setResults(response.data.result); // 결과 데이터 설정
      } else {
        console.error('Failed to process playlist');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setTimeout(() => {
        setShowCelebration(true);

        // 3초 후에 축하 이모티콘 사라지기
        setTimeout(() => {
          setShowCelebration(false);
          setIsLoading(false); // 로딩 종료
        }, 3000);
      }, 1000);
    }
  };

  const handleModalClose = () => {
    setShowModal(false); // Close the modal
  };

  const handleReset = () => {
    setTitle('');
    setPlaylistContent('');
    setResults(null);
  };

  return (
    <div className="form-container">
      {isLoading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : results ? (
        <>
          <ResultPage results={results} onReset={handleReset} />
        </>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="playlist-form">
            <div className="form-title-group">
              <label htmlFor="playlistTitle">Playlist Title:
                <Tooltip message="기존의 Title를 적으면 추가가 됩니다.">
                  <FiInfo className="tooltip-icon" /> {/* Use React Icon here */}
                </Tooltip></label>
              <input
                id="playlistTitle"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="playlist-input"
              />
            </div>
            <div className="form-content-group">
              <label htmlFor="playlistContent">Playlist Content:
                <Tooltip message="ex) 붉은노을 - 빅뱅 같은 구조여야 합니다.">
                  <FiInfo className="tooltip-icon" /> {/* Use React Icon here */}
                </Tooltip></label>
              <textarea
                id="playlistContent"
                value={playlistContent}
                onChange={(e) => setPlaylistContent(e.target.value)}
                className="playlist-textarea"
                placeholder="ex) 붉은노을 - 빅뱅 &#13;&#10;띄어쓰기와 하이픈 띄어쓰기 구조여야 합니다."
              />
            </div>
            <button
              type="submit"
              className={`submit-button ${isButtonDisabled ? 'disabled' : ''}`}
            // disabled={isButtonDisabled} /* 버튼을 비활성화 */
            >
              Save Playlist
            </button>
          </form>
        </>
      )}
      <Celebration message="Playlist Complete!" show={showCelebration} />
      {showModal && (
        <Modal message={modalMessage} onClose={handleModalClose} />
      )}
    </div>
  );
};

export default PlaylistForm;