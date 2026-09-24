'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import FilterSidebar from '../../components/FilterSidebar/FilterSidebar';
import PropertyCard from '../../components/PropertyCard/PropertyCard';
import api from '../../services/api';
import { FaHome, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from './imoveis.module.css';

function ImoveisContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState({
    finalidade: searchParams.get('finalidade') || '',
    tipo: searchParams.get('tipo') || '',
    busca: searchParams.get('busca') || '',
    precoMin: searchParams.get('precoMin') || '',
    precoMax: searchParams.get('precoMax') || '',
    quartos: searchParams.get('quartos') || '',
    banheiros: searchParams.get('banheiros') || '',
    vagas: searchParams.get('vagas') || '',
    ordenacao: searchParams.get('ordenacao') || 'recente',
  });

  const [properties, setProperties] = useState([]);
  const [paginacao, setPaginacao] = useState({ pagina: 1, totalPaginas: 1, totalImoveis: 0 });
  const [loading, setLoading] = useState(true);

  const fetchProperties = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 9,
        tipo: filters.finalidade || undefined,
        categoria: filters.tipo || undefined,
        cidade: filters.busca || undefined,
        preco_min: filters.precoMin || undefined,
        preco_max: filters.precoMax || undefined,
        quartos_min: filters.quartos || undefined,
        order: filters.ordenacao === 'menor_preco' ? 'preco_asc' : filters.ordenacao === 'maior_preco' ? 'preco_desc' : 'recente',
      };

      const res = await api.get('/properties', { params });
      setProperties(res.data.properties || res.data.imoveis || []);
      const pg = res.data.pagination || {};
      setPaginacao({
        pagina: pg.page || 1,
        totalPaginas: pg.totalPages || 1,
        totalImoveis: pg.total || (res.data.properties || []).length
      });
    } catch (err) {
      console.error('Erro ao buscar imóveis:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProperties(1);
  }, [fetchProperties]);

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.set(key, val);
    });
    router.push(`/imoveis?${params.toString()}`);
    fetchProperties(1);
  };

  const handleResetFilters = () => {
    const emptyFilters = {
      finalidade: '',
      tipo: '',
      busca: '',
      precoMin: '',
      precoMax: '',
      quartos: '',
      banheiros: '',
      vagas: '',
      ordenacao: 'recente',
    };
    setFilters(emptyFilters);
    router.push('/imoveis');
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= paginacao.totalPaginas) {
      fetchProperties(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <span className={styles.breadcrumb}>
            <FaHome /> Início / Busca de Imóveis
          </span>
          <h1 className={styles.title}>Catálogo de Imóveis Exclusivos</h1>
          <p className={styles.subtitle}>
            {paginacao.totalImoveis} imóvel(is) encontrado(s) de acordo com suas preferências.
          </p>
        </div>
      </header>

      <div className={styles.mainLayout}>
        <aside className={styles.sidebarWrapper}>
          <FilterSidebar
            filters={filters}
            setFilters={setFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        </aside>

        <main className={styles.contentWrapper}>
          {loading ? (
            <div className={styles.grid}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={styles.skeletonCard} />
              ))}
            </div>
          ) : properties.length > 0 ? (
            <>
              <div className={styles.grid}>
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>

              {paginacao.totalPaginas > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => handlePageChange(paginacao.pagina - 1)}
                    disabled={paginacao.pagina === 1}
                    className={styles.pageBtn}
                  >
                    <FaChevronLeft /> Anterior
                  </button>

                  <span className={styles.pageInfo}>
                    Página {paginacao.pagina} de {paginacao.totalPaginas}
                  </span>

                  <button
                    onClick={() => handlePageChange(paginacao.pagina + 1)}
                    disabled={paginacao.pagina === paginacao.totalPaginas}
                    className={styles.pageBtn}
                  >
                    Próxima <FaChevronRight />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <FaSearch className={styles.emptyIcon} />
              <h3>Nenhum imóvel encontrado</h3>
              <p>Tente ajustar os seus filtros de busca ou remover restrições.</p>
              <button onClick={handleResetFilters} className={styles.resetSearchBtn}>
                Limpar Filtros
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ImoveisPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '5rem', color: 'var(--accent-gold)' }}>Carregando catálogo...</div>}>
      <ImoveisContent />
    </Suspense>
  );
}
