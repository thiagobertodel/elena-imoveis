import styles from './MapView.module.css';
import { FaMapMarkerAlt } from 'react-icons/fa';

export default function MapView({ latitude, longitude, endereco, bairro, cidade, estado }) {
  const addressQuery = encodeURIComponent(`${endereco || ''}, ${bairro || ''}, ${cidade || ''} - ${estado || ''}`);
  
  // If latitude and longitude exist, use coords map iframe, else query by address
  const mapSrc = latitude && longitude
    ? `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`
    : `https://maps.google.com/maps?q=${addressQuery}&z=14&output=embed`;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <FaMapMarkerAlt className={styles.icon} /> Localização no Mapa
        </h3>
        <p className={styles.address}>
          {endereco ? `${endereco}, ` : ''}{bairro} - {cidade}/{estado}
        </p>
      </div>
      <div className={styles.mapWrapper}>
        <iframe
          title="Mapa do imóvel"
          src={mapSrc}
          width="100%"
          height="350"
          style={{ border: 0, borderRadius: 'var(--radius-md)' }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
