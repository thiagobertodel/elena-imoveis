import styles from './StatsCard.module.css';

export default function StatsCard({ icon: Icon, title, value, subtitle, color = 'gold' }) {
  return (
    <div className={`${styles.card} ${styles[color]}`}>
      <div className={styles.iconWrapper}>
        {Icon && <Icon className={styles.icon} />}
      </div>
      <div className={styles.info}>
        <span className={styles.title}>{title}</span>
        <h3 className={styles.value}>{value}</h3>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
    </div>
  );
}
