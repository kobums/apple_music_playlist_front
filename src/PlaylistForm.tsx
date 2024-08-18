import './assets/css/PlaylistForm.css'; // 별도의 CSS 파일을 사용할 경우 추가
import React, { useState, useEffect } from 'react';
import { useQueryClient } from 'react-query';
import axios from 'axios';
import ResultPage from './ResultPage';

const PlaylistForm: React.FC = () => {
  const [title, setTitle] = useState<string>('');
  const [playlistContent, setPlaylistContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false); 
  const [results, setResults] = useState<Array<{ song: string; status: boolean }> | null>(null);

  const queryClient = useQueryClient();

  // react-query에서 musicUserToken 가져오기
  const userToken = queryClient.getQueryData<string>('musicUserToken');
  const developerToken = queryClient.getQueryData<string>('developerToken');

  const handleSubmit = async (e: React.FormEvent) => {
    if (title == '') {
      return
    }
    if (playlistContent == '') {
      return
    }

    e.preventDefault();
    setIsLoading(true);

    const payload = {
      title: title,
      list: playlistContent,
      userToken: userToken || '',
      developerToken: developerToken || '',
    };

    try {
      const response = await axios.post('http://localhost:3001/api/playlist', payload, {
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
      setIsLoading(false); // 로딩 종료
    }
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
        <ResultPage results={results} onReset={handleReset} /> // 결과 페이지 표시
      ) : (
        <form onSubmit={handleSubmit} className="playlist-form">
          <div className="form-group">
            <label htmlFor="playlistTitle">Playlist Title:</label>
            <input
              id="playlistTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="playlist-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="playlistContent">Playlist Content:</label>
            <textarea
              id="playlistContent"
              value={playlistContent}
              onChange={(e) => setPlaylistContent(e.target.value)}
              className="playlist-textarea"
            />
          </div>
          <button type="submit" className="submit-button">Save Playlist</button>
        </form>
      )}
    </div>
  );
};

export default PlaylistForm;