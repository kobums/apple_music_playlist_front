import React from 'react';
import '../assets/css/Modal.css';

interface ModalProps {
  message: string;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ message, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p>{message}</p>
        <button onClick={onClose} className="modal-close-button">확인</button>
      </div>
    </div>
  );
};

export default Modal;