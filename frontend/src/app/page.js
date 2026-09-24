'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SearchBar from '../components/SearchBar/SearchBar';
import PropertyCard from '../components/PropertyCard/PropertyCard';
import api from '../services/api';
import { FaShieldAlt, FaKey, FaHandshake, FaGem, FaArrowRight } from 'react-icons/fa';
import styles from './page.module.css';

export default function Home() {
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProperties() {
      try {
        const res = await api.get('/properties', { params: { limit: 3 } });
        setFeaturedProperties(res.data.properties || res.data.imoveis || []);
      } catch (err) {
        console.error('Erro ao carregar imóveis:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProperties();
  }, []);

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroCopy}>
            <h1 className={styles.visuallyHidden}>Elena Imóveis</h1>
            <span className={styles.heroEyebrow}>ELENA IMÓVEIS · PORTO ALEGRE</span>
            <p className={styles.heroSubtitle}>Encontre oportunidades em Porto Alegre com atendimento próximo e orientação em cada etapa.</p>
            <div className={styles.heroActions}>
              <Link href="/imoveis" className={styles.heroPrimary}>Explorar imóveis <FaArrowRight /></Link>
            </div>
          </div>

          <div className={styles.caixaHighlight}>
            <div>
              <div className={styles.caixaLogoSlot}>
                <img src="/logo-caixa.png" alt="CAIXA" />
              </div>
              <span className={styles.caixaLabel}>CORRESPONDENTE CAIXA</span>
              <h2>Financiamento sem complicação</h2>
              <p>Agilizamos os trâmites do seu financiamento, além de apoiar em compra, venda e regularização de imóveis.</p>
            </div>
          </div>

          <div className={styles.searchWrapper}>
            <SearchBar />
          </div>

        </div>
      </section>

      {/* Featured Properties Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionTag}>SELEÇÃO EXCLUSIVA</span>
            <h2 className={styles.sectionTitle}>Imóveis em Destaque</h2>
          </div>
          <Link href="/imoveis" className={styles.viewAllBtn}>
            Ver Todos os Imóveis <FaArrowRight />
          </Link>
        </div>

        {loading ? (
          <div className={styles.loadingGrid}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonCard} />
            ))}
          </div>
        ) : featuredProperties.length > 0 ? (
          <div className={styles.grid}>
            {featuredProperties.map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>Nenhum imóvel em destaque no momento.</p>
          </div>
        )}
      </section>

      {/* Categories Grid */}
      <section className={`${styles.section} ${styles.bgDarker}`}>
        <div className={styles.sectionHeaderCenter}>
          <span className={styles.sectionTag}>NAVEGUE POR CATEGORIA</span>
          <h2 className={styles.sectionTitle}>Encontre o Imóvel Ideal</h2>
        </div>

        <div className={styles.categoriesGrid}>
          <Link href="/imoveis?tipo=casa" className={styles.categoryCard}>
            <div className={styles.catOverlay} />
            <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80" alt="Casas" />
            <div className={styles.catInfo}>
              <h3>Casas</h3>
              <span>Casas para comprar ou alugar</span>
            </div>
          </Link>

          <Link href="/imoveis?tipo=apartamento" className={styles.categoryCard}>
            <div className={styles.catOverlay} />
            <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80" alt="Apartamentos" />
            <div className={styles.catInfo}>
              <h3>Apartamentos</h3>
              <span>Opções em Porto Alegre e região</span>
            </div>
          </Link>

          <Link href="/imoveis?tipo=comercial" className={styles.categoryCard}>
            <div className={styles.catOverlay} />
            <img src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=600&q=80" alt="Imóveis comerciais" />
            <div className={styles.catInfo}>
              <h3>Imóveis comerciais</h3>
              <span>Salas, lojas e espaços comerciais</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className={styles.section}>
        <div className={styles.sectionHeaderCenter}>
          <span className={styles.sectionTag}>NOSSO COMPROMISSO</span>
          <h2 className={styles.sectionTitle}>Por que a Elena Imóveis?</h2>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><FaGem /></div>
            <h3>Curadoria Exclusiva</h3>
            <p>Apenas imóveis de alto padrão e selecionados criteriosa e rigorosamente por nossos especialistas.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><FaShieldAlt /></div>
            <h3>Serviços Completos</h3>
            <p>Financiamento, locações, compra, venda e regularização. Correspondentes Caixa para agilizar seu processo.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><FaKey /></div>
            <h3>Atendimento Personalisado</h3>
            <p>Corretores especializados prontos para entender seus requisitos e acompanhar cada etapa.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><FaHandshake /></div>
            <h3>Negociação Facilitada</h3>
            <p>Transações ágeis e diretas com os proprietários e incorporadoras de prestígio.</p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className={`${styles.section} ${styles.bgDarker}`}>
        <div className={styles.sectionHeaderCenter}>
          <h2 className={styles.sectionTitle}>Serviços</h2>
        </div>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', lineHeight: '1.8', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: '1rem' }}>
            Seguindo o padrão de qualidade Elena Imóveis, oferecemos uma solução completa em serviços imobiliários para melhor atender aos nossos clientes e proporcionar uma satisfação completa nas suas transações imobiliárias.
          </p>
          <p>
            Trabalhamos com financiamento, locações, compra, venda e regularização de imóveis. Além disso, somos também, correspondentes da Caixa Econômica Federal facilitando todos os trâmites no financiamento para a compra do seu imóvel.
          </p>
        </div>
      </section>
    </div>
  );
}
