'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FaBed, FaBath, FaCar, FaRulerCombined, FaMapMarkerAlt, FaCheckCircle } from 'react-icons/fa';
import styles from './PropertyCard.module.css';

export default function PropertyCard({ property }) {
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(property.preco || 0);

  // Field mappings for flexibility
  const finalidade = property.tipo === 'aluguel' || property.finalidade === 'aluguel' ? 'aluguel' : 'venda';
  const categoria = property.categoria || property.tipo_imovel || 'Imóvel';
  const area = property.area || property.area_m2 || 0;
  const garagem = property.garagem !== undefined ? property.garagem : property.vagas;

  // Main image fallback
  const mainImage = property.cover_url || 
    (property.imagens && property.imagens.length > 0 ? property.imagens[0] : null) ||
    (property.images && property.images.length > 0 ? property.images[0].image_url : null) ||
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80';

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image
          src={mainImage}
          alt={property.titulo || 'Imóvel de Luxo'}
          fill
          className={styles.image}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className={styles.overlayGradient} />
        
        <div className={styles.badgesTop}>
          <span className={`${styles.badge} ${finalidade === 'venda' ? styles.badgeSale : styles.badgeRent}`}>
            {finalidade === 'venda' ? 'Venda' : 'Aluguel'}
          </span>
          {property.destaque && (
            <span className={`${styles.badge} ${styles.badgeFeatured}`}>
              ✨ Destaque
            </span>
          )}
        </div>

        <div className={styles.priceTag}>
          {formattedPrice}
          {finalidade === 'aluguel' && <span className={styles.perMonth}>/mês</span>}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.typeLocation}>
          <span className={styles.type}>{categoria}</span>
          <span className={styles.location}>
            <FaMapMarkerAlt /> {property.bairro}, {property.cidade}
          </span>
        </div>

        <h3 className={styles.title}>
          <Link href={`/imovel/${property.id}`}>{property.titulo}</Link>
        </h3>

        <div className={styles.specs}>
          {area > 0 && (
            <div className={styles.specItem} title="Área Útil">
              <FaRulerCombined />
              <span>{area} m²</span>
            </div>
          )}
          {property.quartos > 0 && (
            <div className={styles.specItem} title="Quartos">
              <FaBed />
              <span>{property.quartos} {property.quartos === 1 ? 'Quarto' : 'Quartos'}</span>
            </div>
          )}
          {property.banheiros > 0 && (
            <div className={styles.specItem} title="Banheiros">
              <FaBath />
              <span>{property.banheiros} {property.banheiros === 1 ? 'Banheiro' : 'Banheiros'}</span>
            </div>
          )}
          {garagem > 0 && (
            <div className={styles.specItem} title="Vagas de Garagem">
              <FaCar />
              <span>{garagem} {garagem === 1 ? 'Vaga' : 'Vagas'}</span>
            </div>
          )}
        </div>

        <div className={styles.cardFooter}>
          <span className={styles.advertiserName}>
            <FaCheckCircle className={styles.verifiedIcon} /> {property.anunciante_nome || 'Elena Corretora'}
          </span>
          <Link href={`/imovel/${property.id}`} className={styles.detailsBtn}>
            Ver Detalhes →
          </Link>
        </div>
      </div>
    </div>
  );
}
