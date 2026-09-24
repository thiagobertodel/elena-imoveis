'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import StatsCard from '../../components/StatsCard/StatsCard';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FaUserShield, FaBuilding, FaCheck, FaTimes, FaUsers, FaClock, FaExternalLinkAlt } from 'react-icons/fa';
import styles from './admin.module.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total_imoveis: 0, aprovados: 0, pendentes: 0, total_usuarios: 0 });
  const [pendingProperties, setPendingProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/properties', { params: { status: 'pendente' } }),
      ]);
      const adminStats = statsRes.data.stats || statsRes.data;
      setStats({
        total_imoveis: adminStats.total_properties || 0,
        aprovados: adminStats.active_properties || 0,
        pendentes: adminStats.pending_properties || 0,
        total_usuarios: adminStats.total_users || 0,
      });
      setPendingProperties(pendingRes.data.properties || []);
    } catch (err) {
      toast.error('Erro ao carregar dados do painel administrativo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/properties/${id}/approve`);
      toast.success('Imóvel APROVADO com sucesso!');
      fetchAdminData();
    } catch (err) {
      toast.error('Erro ao aprovar imóvel');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/admin/properties/${id}/reject`);
      toast.success('Imóvel REJEITADO!');
      fetchAdminData();
    } catch (err) {
      toast.error('Erro ao rejeitar imóvel');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <span className={styles.tag}>PAINEL ADMINISTRATIVO</span>
            <h1 className={styles.title}>
              <FaUserShield className={styles.adminIcon} /> Controle Geral Elena Imóveis
            </h1>
          </div>
        </div>

        {/* Global Platform Metrics */}
        <div className={styles.statsGrid}>
          <StatsCard
            icon={FaBuilding}
            title="Total de Imóveis"
            value={stats.total_imoveis}
            subtitle="Plataforma inteira"
            color="gold"
          />
          <StatsCard
            icon={FaClock}
            title="Pendentes de Aprovação"
            value={stats.pendentes}
            subtitle="Aguardando moderação"
            color="blue"
          />
          <StatsCard
            icon={FaCheck}
            title="Imóveis Aprovados"
            value={stats.aprovados}
            subtitle="Visíveis ao público"
            color="green"
          />
          <StatsCard
            icon={FaUsers}
            title="Usuários Registrados"
            value={stats.total_usuarios}
            subtitle="Clientes e Anunciantes"
            color="purple"
          />
        </div>

        {/* Pending Approvals Table */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h3>Aprovação de Novos Anúncios ({pendingProperties.length})</h3>
            <span className={styles.badgePendingCount}>
              {pendingProperties.length} aguardando
            </span>
          </div>

          {loading ? (
            <div className={styles.loading}>Carregando pendências...</div>
          ) : pendingProperties.length > 0 ? (
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Imóvel</th>
                    <th>Responsável</th>
                    <th>Valor</th>
                    <th>Localização</th>
                    <th>Ações de Moderação</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingProperties.map((item) => {
                    const mainImg = item.imagens && item.imagens.length > 0
                      ? item.imagens[0]
                      : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=300&q=80';

                    const formattedPrice = new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      maximumFractionDigits: 0
                    }).format(item.preco);

                    const saleTypeLabel = item.tipo === 'venda' ? 'Venda' : 'Aluguel';

                    return (
                      <tr key={item.id}>
                        <td>
                          <div className={styles.propertyInfo}>
                            <div className={styles.thumbWrapper}>
                              <Image src={mainImg} alt={item.titulo} fill className={styles.thumb} />
                            </div>
                            <div>
                              <strong>{item.titulo}</strong>
                              <span className={styles.capitalize}>{saleTypeLabel}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.advertiserInfo}>
                            <strong>{item.anunciante_nome}</strong>
                            <span>{item.anunciante_email}</span>
                          </div>
                        </td>
                        <td className={styles.goldText}>{formattedPrice}</td>
                        <td>{item.bairro}, {item.cidade} - RS</td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button
                              onClick={() => handleApprove(item.id)}
                              className={styles.approveBtn}
                              title="Aprovar Anúncio"
                            >
                              <FaCheck /> Aprovar
                            </button>
                            <button
                              onClick={() => handleReject(item.id)}
                              className={styles.rejectBtn}
                              title="Rejeitar Anúncio"
                            >
                              <FaTimes /> Rejeitar
                            </button>
                            <Link href={`/imovel/${item.id}`} target="_blank" className={styles.viewBtn}>
                              <FaExternalLinkAlt />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.empty}>
              <FaCheck className={styles.checkDoneIcon} />
              <p>Tudo limpo! Não há nenhum imóvel pendente de moderação no momento.</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
