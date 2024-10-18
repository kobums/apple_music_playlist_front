import React from 'react';
import '../assets/css/Celebration.css'; // 별도 CSS 파일을 연결

interface CelebrationProps {
  message: string;
  show: boolean; // 이모티콘 표시 여부
}

const Celebration: React.FC<CelebrationProps> = ({ message, show }) => {
  if (!show) return null; // If 'show' is false, don't render anything

  return (
    <div className="celebration-overlay"> {/* White overlay that covers the entire screen */}
      <div className="celebration-message">
        🎉
        <br />
        {message}
      </div>
    </div>
  );
};


export default Celebration;
