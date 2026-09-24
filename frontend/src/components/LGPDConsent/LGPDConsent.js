'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaShieldAlt, FaCheck, FaTimes } from 'react-icons/fa';
import styles from './LGPDConsent.module.css';

export default function LGPDConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('elena_lgpd_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('elena_lgpd_consent', 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('elena_lgpd_consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.iconWrapper}>
            <FaShieldAlt className={styles.icon} />
          </div>
          <div className={styles.text}>
            <h4>Sua privacidade é nossa prioridade (LGPD)</h4>
            <p>
              Utilizamos cookies e tecnologias semelhantes para aprimorar sua experiência de navegação e personalizar conteúdos. Ao continuar, você concorda com a nossa{' '}
              <Link href="/privacidade" className={styles.link}>Política de Privacidade</Link> de acordo com a Lei nº 13.709/2018.
            </p>
          </div>
        </div>
        <div className={styles.actions}>
          <button onClick={handleDecline} className={styles.declineBtn}>
            Recusar Não-Essenciais
          </button>
          <button onClick={handleAccept} className={styles.acceptBtn}>
            <FaCheck /> Aceitar Todos
          </button>
        </div>
      </div>
    </div>
  );
}
