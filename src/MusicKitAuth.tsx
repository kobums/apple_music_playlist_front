import './assets/css/MusicKitAuth.css'
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from 'react-query';
import axios from 'axios';

const MusicKitAuth = () => {
  const [isMusicKitLoaded, setIsMusicKitLoaded] = useState<boolean>(false);
  const [musicInstance, setMusicInstance] = useState<MusicKit.MusicKitInstance | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchDeveloperToken = async () => {
      try {
        const response = await axios('http://localhost:3001/api/token');
        if (response) {
          queryClient.setQueryData('developerToken', response.data.developerToken);
          initializeMusicKit(response.data.developerToken);
        } else {
          console.error('Failed to fetch developer token');
        }
      } catch (error) {
        console.error('Error fetching developer token:', error);
      }
    };

    const initializeMusicKit = (developerToken: string) => {
      const script = document.createElement('script');
      script.src = 'https://js-cdn.music.apple.com/musickit/v1/musickit.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        document.addEventListener('musickitloaded', () => {
          console.log('Configuring MusicKit...');
          const instance = (window as any).MusicKit.configure({
            developerToken,
            app: {
              name: 'Your App Name',
              build: '1.0',
            },
          });
          console.log('MusicKit configured successfully');
          setIsMusicKitLoaded(true);
          setMusicInstance(instance);
        });
      };
    };

    fetchDeveloperToken();

    return () => {
      const script = document.querySelector('script[src="https://js-cdn.music.apple.com/musickit/v1/musickit.js"]');
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const authorizeAppleMusic = async () => {
    if (!musicInstance) {
      console.error('MusicKit is not loaded yet');
      return;
    }

    try {
      console.log('Starting authorization process...');
      const musicUserToken = await musicInstance.authorize();
      // console.log('Music User Token:', musicUserToken);

      // react-query로 musicUserToken 저장
      queryClient.setQueryData('musicUserToken', musicUserToken);

      // 로그인 성공 후 페이지 이동
      navigate('/playlist');
    } catch (error) {
      console.error('Authorization failed:', error);
    }
  };

  const renderTextWithAnimation = (text: string, delay: number = 0) => {
    return Array.from(text).map((char, index) => (
      <span key={index} className="welcome-char" style={{ animationDelay: `${index * 0.1 + delay}s` }}>
        {char === ' ' ? '\u00A0' : char} {/* 공백 문자도 유지 */}
      </span>
    ));
  };

  return (
    <div className="auth-container">
      <div className="welcome-message">
        {renderTextWithAnimation("환영합니다. 이규한님")}
        <br />
        {renderTextWithAnimation("당신의 애플 뮤직 플리를 만들어 보세요 ><", 1.5)} {/* 4초 후에 시작 */}
      </div>
      <button onClick={authorizeAppleMusic} disabled={!isMusicKitLoaded} className="auth-button">
        Authorize Apple Music
      </button>
    </div>
  );
};

export default MusicKitAuth;