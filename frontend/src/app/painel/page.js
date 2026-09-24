'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import StatsCard from '../../components/StatsCard/StatsCard';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FaPlus, FaBuilding, FaCheckCircle, FaClock, FaEye, FaTrash, FaPen, FaExternalLinkAlt } from 'react-icons/fa';
import styles from './painel.module.css';

export default function PainelAdmin() {
  const [imoveis, setImoveis] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMeusImoveis = async () => {
    setLoading(true);
    try {
      const res = await api.get('/properties/user/my');
      setImoveis(res.data.properties || res.data || []);
    } catch (err) {
      toast.error('Erro ao carregar seus imóveis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeusImoveis();
  }, []);

  const handleDelete = async (id, titulo) => {
    if (!window.confirm(`Tem certeza que deseja excluir o imóvel "${titulo}"?`)) return;

    try {
      await api.delete(`/properties/${id}`);
      toast.success('Imóvel excluído com sucesso!');
      setImoveis((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      toast.error('Erro ao excluir imóvel');
    }
  };

  const totalImoveis = imoveis.length;
  const aprovados = imoveis.filter((i) => i.status === 'ativo').length;
  const pendentes = imoveis.filter((i) => i.status === 'pendente').length;
  const totalVisualizacoes = imoveis.reduce((sum, i) => sum + (i.visualizacoes || 0), 0);

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <span className={styles.tag}>PAINEL DO ADM</span>
            <h1 className={styles.title}>Gerenciar Meus Anúncios</h1>
          </div>
          <Link href="/painel/novo-imovel" className={styles.newBtn}>
            <FaPlus /> Cadastrar Novo Imóvel
          </Link>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <StatsCard
            icon={FaBuilding}
            title="Total de Imóveis"
            value={totalImoveis}
            subtitle="Cadastrados na conta"
            color="gold"
          />
          <StatsCard
            icon={FaCheckCircle}
            title="Anúncios Ativos"
            value={aprovados}
            subtitle="Publicados no catálogo"
            color="green"
          />
          <StatsCard
            icon={FaClock}
            title="Em Análise"
            value={pendentes}
            subtitle="Aguardando aprovação"
            color="blue"
          />
          <StatsCard
            icon={FaEye}
            title="Visualizações"
            value={totalVisualizacoes}
            subtitle="Total de acessos acumulados"
            color="purple"
          />
        </div>

        {/* Properties Table / Grid */}
        <div className={styles.tableCard}>
          <h3 className={styles.tableTitle}>Meus Imóveis Cadastrados</h3>

          {loading ? (
            <div className={styles.loading}>Carregando anúncios...</div>
          ) : imoveis.length > 0 ? (
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Imóvel</th>
                    <th>Tipo</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Visitas</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {imoveis.map((item) => {
                    const mainImg = item.imagens && item.imagens.length > 0
                      ? item.imagens[0]
                      : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=300&q=80';

                    const formattedPrice = new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      maximumFractionDigits: 0
                    }).format(item.preco);

                    const statusLabel = item.status === 'ativo' ? 'Ativo' : item.status === 'pendente' ? 'Pendente' : 'Inativo';
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
                              <span>{item.bairro}, {item.cidade}</span>
                            </div>
                          </div>
                        </td>
                        <td className={styles.capitalize}>{saleTypeLabel}</td>
                        <td className={styles.goldText}>{formattedPrice}</td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              item.status === 'ativo' ? styles.statusApproved : styles.statusPending
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td>{item.visualizacoes || 0}</td>
                        <td>
                          <div className={styles.actions}>
                            <Link href={`/imovel/${item.id}`} className={styles.actionIcon} title="Ver no site">
                              <FaExternalLinkAlt />
                            </Link>
                            <button
                              onClick={() => handleDelete(item.id, item.titulo)}
                              className={`${styles.actionIcon} ${styles.deleteIcon}`}
                              title="Excluir Imóvel"
                            >
                              <FaTrash />
                            </button>
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
              <p>Você ainda não cadastrou nenhum imóvel.</p>
              <Link href="/painel/novo-imovel" className={styles.newBtnInline}>
                Cadastrar Primeiro Imóvel
              </Link>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
