'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../../components/ProtectedRoute/ProtectedRoute';
import { integrationsAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { 
  FaBuilding, FaCheckCircle, FaExclamationTriangle, 
  FaBan, FaCopy, FaCheck, FaSync, FaExternalLinkAlt, 
  FaClock, FaArrowLeft, FaRss, FaShieldAlt, FaInfoCircle, FaTimes
} from 'react-icons/fa';
import styles from './integracoes.module.css';

export default function IntegracoesPortaisPage() {
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'in_feed' | 'error' | 'disabled'
  const [copied, setCopied] = useState(false);
  const [selectedErrorProperty, setSelectedErrorProperty] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [dashRes, logsRes] = await Promise.all([
        integrationsAPI.getDashboard(),
        integrationsAPI.getLogs(),
      ]);
      setData(dashRes.data);
      setLogs(logsRes.data.logs || []);
    } catch (err) {
      toast.error('Erro ao carregar dados de integração');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCopyUrl = () => {
    if (!data?.integration?.full_feed_url) return;
    navigator.clipboard.writeText(data.integration.full_feed_url);
    setCopied(true);
    toast.success('URL do Feed XML copiada com sucesso!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    const toastId = toast.loading('Revalidando e sincronizando imóveis com o feed VRSync...');
    try {
      const res = await integrationsAPI.sync();
      toast.success(res.data.message || 'Sincronização concluída!', { id: toastId });
      await fetchDashboardData();
    } catch (err) {
      toast.error('Erro ao sincronizar integração', { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleProperty = async (propertyId, title) => {
    try {
      const res = await integrationsAPI.toggleProperty(propertyId);
      toast.success(res.data.message);
      await fetchDashboardData();
    } catch (err) {
      toast.error('Erro ao alterar status do imóvel');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <div className={styles.container}>
          <p className={styles.loading}>Carregando dados das integrações...</p>
        </div>
      </ProtectedRoute>
    );
  }

  const integration = data?.integration || {};
  const stats = data?.stats || { total_properties: 0, in_feed: 0, with_errors: 0, disabled: 0 };
  const allProperties = data?.properties || [];

  // Filtragem dos imóveis
  const filteredProperties = allProperties.filter((p) => {
    if (filter === 'in_feed') return p.publication_status === 'disponivel_no_feed';
    if (filter === 'error') return p.publication_status === 'erro';
    if (filter === 'disabled') return p.publication_status === 'desativado';
    return true;
  });

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className={styles.container}>
        {/* Navegação e Cabeçalho */}
        <Link href="/admin" className={styles.backLink}>
          <FaArrowLeft /> Voltar ao Painel Administrativo
        </Link>

        <div className={styles.header}>
          <div>
            <span className={styles.tag}>INTEGRAÇÕES & PARCEIROS</span>
            <h1 className={styles.title}>
              <FaRss className={styles.titleIcon} /> Integrações com Portais Imobiliários
            </h1>
            <p className={styles.subtitle}>
              Distribuição automática via Feed XML no padrão oficial <strong>VRSync</strong> para <strong>ZAP Imóveis</strong> e <strong>Viva Real</strong> (Grupo OLX).
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className={styles.syncBtn}
            >
              <FaSync className={syncing ? styles.spinner : ''} />
              {syncing ? 'Sincronizando...' : 'Sincronizar e Revalidar Agora'}
            </button>
          </div>
        </div>

        {/* 4 Cards de Métricas Principais */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIconBox} style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--accent-gold)' }}>
              <FaBuilding />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.total_properties}</span>
              <span className={styles.statLabel}>Total de Imóveis</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconBox} style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
              <FaCheckCircle />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.in_feed}</span>
              <span className={styles.statLabel}>Disponíveis no Feed</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconBox} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <FaExclamationTriangle />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.with_errors}</span>
              <span className={styles.statLabel}>Erros de Validação</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconBox} style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' }}>
              <FaBan />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.disabled}</span>
              <span className={styles.statLabel}>Pausados / Desativados</span>
            </div>
          </div>
        </div>

        {/* Card do Portal VRSync (Grupo OLX) com a URL do Feed */}
        <div className={styles.portalCard}>
          <div className={styles.portalCardHeader}>
            <div className={styles.portalBrand}>
              <div className={styles.portalBadges}>
                <span className={styles.badgeZap}>ZAP Imóveis</span>
                <span className={styles.badgeViva}>Viva Real</span>
              </div>
              <h3 className={styles.portalTitle}>Grupo OLX — Feed Oficial VRSync</h3>
            </div>

            <span className={styles.portalStatusActive}>
              <FaCheckCircle /> Integração Ativa & Homologada
            </span>
          </div>

          <div className={styles.feedUrlSection}>
            <label className={styles.feedUrlLabel}>
              <FaShieldAlt /> URL Segura do Feed XML (Padrão VRSync):
            </label>
            <div className={styles.feedInputRow}>
              <input
                type="text"
                readOnly
                value={integration.full_feed_url || ''}
                className={styles.feedInput}
              />
              <button
                type="button"
                onClick={handleCopyUrl}
                className={styles.copyBtn}
              >
                {copied ? <FaCheck style={{ color: '#22c55e' }} /> : <FaCopy />}
                {copied ? 'Copiado!' : 'Copiar URL'}
              </button>
              <a
                href={integration.full_feed_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.openFeedBtn}
              >
                <FaExternalLinkAlt /> Ver XML
              </a>
            </div>
            <p className={styles.feedHelp}>
              💡 Forneça esta URL ao suporte ou gerente de contas do ZAP Imóveis / Viva Real. O robô deles consumirá periodicamente este feed para sincronizar preços, fotos e descrições dos seus imóveis.
            </p>
          </div>
        </div>

        {/* Barra de Filtros da Tabela */}
        <div className={styles.tabsBar}>
          <div className={styles.filterBtns}>
            <button
              onClick={() => setFilter('all')}
              className={`${styles.filterBtn} ${filter === 'all' ? styles.filterBtnActive : ''}`}
            >
              Todos ({allProperties.length})
            </button>
            <button
              onClick={() => setFilter('in_feed')}
              className={`${styles.filterBtn} ${filter === 'in_feed' ? styles.filterBtnActive : ''}`}
            >
              No Feed ({stats.in_feed})
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`${styles.filterBtn} ${filter === 'error' ? styles.filterBtnActive : ''}`}
            >
              Com Pendências ({stats.with_errors})
            </button>
            <button
              onClick={() => setFilter('disabled')}
              className={`${styles.filterBtn} ${filter === 'disabled' ? styles.filterBtnActive : ''}`}
            >
              Desativados ({stats.disabled})
            </button>
          </div>

          <div className={styles.feedHelp}>
            <FaClock /> Última Sincronização: {integration.last_sync_at ? new Date(integration.last_sync_at).toLocaleString('pt-BR') : 'Ainda não executada'}
          </div>
        </div>

        {/* Tabela de Imóveis */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h3 className={styles.tableTitle}>Status de Publicação por Imóvel</h3>
          </div>

          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Imóvel</th>
                  <th>Preço</th>
                  <th>Localização</th>
                  <th>Mídias</th>
                  <th>Status no Feed</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      Nenhum imóvel encontrado nesta categoria de filtro.
                    </td>
                  </tr>
                ) : (
                  filteredProperties.map((prop) => {
                    const priceFormatted = new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      maximumFractionDigits: 0,
                    }).format(prop.preco);

                    return (
                      <tr key={prop.id}>
                        <td>
                          <div className={styles.propInfo}>
                            <img
                              src={prop.cover_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200'}
                              alt={prop.titulo}
                              className={styles.propThumb}
                            />
                            <div>
                              <div className={styles.propTitle} title={prop.titulo}>{prop.titulo}</div>
                              <span className={styles.propExternalId}>{prop.external_id || prop.id.substring(0, 8)}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <strong>{priceFormatted}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                            {prop.tipo} • {prop.categoria}
                          </div>
                        </td>

                        <td>
                          {prop.bairro || 'Centro'}, {prop.cidade}
                        </td>

                        <td>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            📸 {prop.total_images || 0} foto(s)
                          </span>
                        </td>

                        <td>
                          {prop.publication_status === 'disponivel_no_feed' && (
                            <span className={styles.badgeInFeed}>
                              <FaCheckCircle /> Disponível no Feed
                            </span>
                          )}

                          {prop.publication_status === 'erro' && (
                            <button
                              type="button"
                              onClick={() => setSelectedErrorProperty(prop)}
                              className={styles.badgeError}
                              title="Clique para ver os erros de validação"
                            >
                              <FaExclamationTriangle /> Erro de Validação 🔍
                            </button>
                          )}

                          {prop.publication_status === 'desativado' && (
                            <span className={styles.badgeDisabled}>
                              <FaBan /> Pausado / Desativado
                            </span>
                          )}

                          {(!prop.publication_status || prop.publication_status === 'aguardando_validacao') && (
                            <span className={styles.badgePending}>
                              <FaClock /> Aguardando Validação
                            </span>
                          )}
                        </td>

                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleProperty(prop.id, prop.titulo)}
                              className={`${styles.toggleBtn} ${prop.publication_status === 'desativado' ? '' : styles.toggleBtnActive}`}
                            >
                              {prop.publication_status === 'desativado' ? 'Ativar no Feed' : 'Pausar'}
                            </button>

                            <Link
                              href={`/imovel/${prop.id}`}
                              target="_blank"
                              className={styles.toggleBtn}
                              title="Ver anúncio no site"
                            >
                              <FaExternalLinkAlt />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Auditoria / Histórico de Requisições do Crawler */}
        <div className={styles.logsCard}>
          <h3 className={styles.tableTitle} style={{ marginBottom: '1rem' }}>
            <FaShieldAlt style={{ color: 'var(--accent-gold)', marginRight: '0.5rem' }} />
            Auditoria de Acessos ao Feed (Robôs do Grupo OLX)
          </h3>

          {logs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Nenhum acesso registrado até o momento.
            </p>
          ) : (
            <div>
              {logs.slice(0, 8).map((log) => (
                <div key={log.id} className={styles.logItem}>
                  <span className={styles.logEvent}>[{log.event_type}]</span>
                  <span className={styles.logMsg}>{log.message}</span>
                  <span className={styles.logTime}>{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Detalhes dos Erros de Validação */}
        {selectedErrorProperty && (
          <div className={styles.modalOverlay} onClick={() => setSelectedErrorProperty(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h4 className={styles.modalTitle}>
                  <FaExclamationTriangle style={{ color: '#ef4444' }} /> Pendências no Imóvel
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedErrorProperty(null)}
                  className={styles.modalCloseBtn}
                >
                  <FaTimes />
                </button>
              </div>

              <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9375rem' }}>
                {selectedErrorProperty.titulo}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                O padrão VRSync do Grupo OLX exige o preenchimento de regras específicas para liberar o imóvel no portal:
              </p>

              <div className={styles.errorList}>
                {Array.isArray(selectedErrorProperty.validation_errors) && selectedErrorProperty.validation_errors.length > 0 ? (
                  selectedErrorProperty.validation_errors.map((err, idx) => (
                    <div key={idx} className={styles.errorItem}>
                      <FaInfoCircle style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{err}</span>
                    </div>
                  ))
                ) : (
                  <div className={styles.errorItem}>
                    <span>{selectedErrorProperty.error_message || 'Informações obrigatórias pendentes de preenchimento.'}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedErrorProperty(null)}
                className={styles.syncBtn}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
