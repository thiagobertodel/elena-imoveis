'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import ImageGallery from '../../../components/ImageGallery/ImageGallery';
import MapView from '../../../components/MapView/MapView';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { 
  FaBed, FaBath, FaCar, FaRulerCombined, 
  FaMapMarkerAlt, FaWhatsapp, FaPhoneAlt, FaEnvelope, FaCheckCircle, FaShareAlt 
} from 'react-icons/fa';
import styles from './imovel.module.css';

export default function ImovelDetalhes({ params }) {
  const { id } = use(params);

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [proposalMsg, setProposalMsg] = useState('');
  const [sendingProposal, setSendingProposal] = useState(false);

  useEffect(() => {
    async function loadProperty() {
      try {
        const res = await api.get(`/properties/${id}`);
        const p = res.data.property || res.data;
        // Transform images format if returned as property_images array
        if (p.images && (!p.imagens || p.imagens.length === 0)) {
          p.imagens = p.images.map((img) => img.image_url);
        }
        setProperty(p);
      } catch (err) {
        toast.error('Erro ao carregar detalhes do imóvel.');
      } finally {
        setLoading(false);
      }
    }
    loadProperty();
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.titulo,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const handleSendProposal = (e) => {
    e.preventDefault();
    if (!proposalMsg.trim()) return;

    setSendingProposal(true);
    setTimeout(() => {
      setSendingProposal(false);
      toast.success('Proposta enviada com sucesso ao anunciante!');
      setProposalMsg('');
    }, 1000);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className="spinner" /> Carregando imóvel...
      </div>
    );
  }

  if (!property) {
    return (
      <div className={styles.notFound}>
        <h2>Imóvel não encontrado</h2>
        <p>O imóvel solicitado não existe ou foi removido.</p>
        <Link href="/imoveis" className={styles.backBtn}>
          Voltar para a Busca
        </Link>
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(property.preco);

  const formattedCondo = property.condominio ? new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(property.condominio) : null;

  const formattedIptu = property.iptu ? new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(property.iptu) : null;

  const contactPhone = '51 99961-2190';
  const whatsappPhone = contactPhone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/55${whatsappPhone}?text=${encodeURIComponent(`Olá, tenho interesse no imóvel "${property.titulo}" (Cód: ${property.id}).`)}`;

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.topHeader}>
        <div className={styles.titleSection}>
          <div className={styles.badges}>
            <span className={`${styles.badge} ${property.finalidade === 'venda' ? styles.badgeSale : styles.badgeRent}`}>
              {property.finalidade === 'venda' ? 'Venda' : 'Aluguel'}
            </span>
            <span className={styles.badgeType}>{property.tipo}</span>
            {property.destaque && <span className={styles.badgeFeatured}>✨ Destaque</span>}
          </div>
          <h1 className={styles.title}>{property.titulo}</h1>
          <p className={styles.location}>
            <FaMapMarkerAlt /> {property.endereco ? `${property.endereco}, ` : ''}{property.bairro} - {property.cidade}/{property.estado}
          </p>
        </div>

        <div className={styles.actionsPrice}>
          <div className={styles.priceContainer}>
            <span className={styles.priceLabel}>Valor do Imóvel</span>
            <h2 className={styles.price}>
              {formattedPrice}
              {property.finalidade === 'aluguel' && <span className={styles.perMonth}>/mês</span>}
            </h2>
          </div>

          <div className={styles.headerBtns}>
            <button onClick={handleShare} className={styles.actionBtn} title="Compartilhar">
              <FaShareAlt />
            </button>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <ImageGallery images={property.imagens} title={property.titulo} />

      {/* Content Layout: Details Left, Advertiser Sidebar Right */}
      <div className={styles.contentLayout}>
        <div className={styles.mainDetails}>
          {/* Key Specs Bar */}
          <div className={styles.specsBar}>
            {property.area_m2 > 0 && (
              <div className={styles.specBox}>
                <FaRulerCombined className={styles.specIcon} />
                <div>
                  <span className={styles.specValue}>{property.area_m2} m²</span>
                  <span className={styles.specLabel}>Área Útil</span>
                </div>
              </div>
            )}
            {property.quartos > 0 && (
              <div className={styles.specBox}>
                <FaBed className={styles.specIcon} />
                <div>
                  <span className={styles.specValue}>{property.quartos}</span>
                  <span className={styles.specLabel}>Quartos</span>
                </div>
              </div>
            )}
            {property.banheiros > 0 && (
              <div className={styles.specBox}>
                <FaBath className={styles.specIcon} />
                <div>
                  <span className={styles.specValue}>{property.banheiros}</span>
                  <span className={styles.specLabel}>Banheiros</span>
                </div>
              </div>
            )}
            {property.vagas > 0 && (
              <div className={styles.specBox}>
                <FaCar className={styles.specIcon} />
                <div>
                  <span className={styles.specValue}>{property.vagas}</span>
                  <span className={styles.specLabel}>Vagas Garagem</span>
                </div>
              </div>
            )}
          </div>

          {/* Costs Breakdown */}
          {(formattedCondo || formattedIptu) && (
            <div className={styles.costsCard}>
              <h4 className={styles.sectionTitle}>Custos Adicionais</h4>
              <div className={styles.costsGrid}>
                {formattedCondo && (
                  <div className={styles.costItem}>
                    <span>Condomínio:</span>
                    <strong>{formattedCondo}/mês</strong>
                  </div>
                )}
                {formattedIptu && (
                  <div className={styles.costItem}>
                    <span>IPTU:</span>
                    <strong>{formattedIptu}/ano</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div className={styles.descriptionSection}>
            <h3 className={styles.sectionTitle}>Sobre o Imóvel</h3>
            <p className={styles.descriptionText}>{property.descricao}</p>
          </div>

          {/* Features / Amenities */}
          {property.caracteristicas && property.caracteristicas.length > 0 && (
            <div className={styles.featuresSection}>
              <h3 className={styles.sectionTitle}>Diferenciais & Comodidades</h3>
              <div className={styles.featuresGrid}>
                {property.caracteristicas.map((feat, idx) => (
                  <div key={idx} className={styles.featureItem}>
                    <FaCheckCircle className={styles.checkIcon} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location Map */}
          <MapView
            latitude={property.latitude}
            longitude={property.longitude}
            endereco={property.endereco}
            bairro={property.bairro}
            cidade={property.cidade}
            estado={property.estado}
          />
        </div>

        {/* Sidebar Advertiser & Contact */}
        <aside className={styles.sidebar}>
          <div className={styles.advertiserCard}>
            <div className={styles.advertiserHeader}>
              <div className={styles.avatar}>
                {property.anunciante_nome ? property.anunciante_nome[0].toUpperCase() : 'E'}
              </div>
              <div>
                <h4 className={styles.advertiserName}>
                  {property.anunciante_nome || 'Elena Corretora'} <FaCheckCircle className={styles.verifiedIcon} />
                </h4>
                <span className={styles.advertiserSub}>Anunciante Verificado</span>
              </div>
            </div>

            {whatsappPhone && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappBtn}
              >
                <FaWhatsapp /> Falar via WhatsApp
              </a>
            )}

            <a href={`tel:${whatsappPhone}`} className={styles.phoneBtn}>
              <FaPhoneAlt /> {contactPhone}
            </a>

            <hr className={styles.divider} />

            <h4 className={styles.formTitle}>Enviar Proposta ou Mensagem</h4>
            <form onSubmit={handleSendProposal} className={styles.proposalForm}>
              <textarea
                placeholder="Olá, gostaria de agendar uma visita para este imóvel..."
                rows={4}
                value={proposalMsg}
                onChange={(e) => setProposalMsg(e.target.value)}
                required
              />
              <button type="submit" className={styles.sendBtn} disabled={sendingProposal}>
                <FaEnvelope /> {sendingProposal ? 'Enviando...' : 'Enviar Mensagem'}
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
