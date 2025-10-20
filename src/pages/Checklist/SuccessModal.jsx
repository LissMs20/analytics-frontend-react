import React from 'react';
import Lottie from 'lottie-react';
import successAnimation from '../../assets/lottie/success-check.json';
import styles from './SuccessModal.module.css';

const SuccessModal = ({ show, onClose, documentId }) => {
  if (!show) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.animation}>
          <Lottie animationData={successAnimation} loop={false} />
        </div>
        <h2>Checklist salvo com sucesso!</h2>
        <p>
          Número do documento: <strong>{documentId}</strong>
        </p>
        <button className={styles.okButton} onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
