import React, { useState } from 'react';
import './assets/css/Tooltip.css';

interface TooltipProps {
  message: string; // The tooltip message to display
  children: React.ReactNode; // The element that triggers the tooltip
}

const Tooltip: React.FC<TooltipProps> = ({ message, children }) => {
  const [visible, setVisible] = useState<boolean>(false);

  const showTooltip = () => {
    setVisible(true);
  };

  const hideTooltip = () => {
    setVisible(false);
  };

  return (
    <div className="tooltip-wrapper" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
      {children}
      {visible && (
        <div className="tooltip-box">
          {message}
        </div>
      )}
    </div>
  );
};

export default Tooltip;