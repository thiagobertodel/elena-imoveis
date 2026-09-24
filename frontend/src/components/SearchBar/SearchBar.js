'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch, FaMapMarkerAlt, FaHome, FaDollarSign, FaBed } from 'react-icons/fa';
import styles from './SearchBar.module.css';

export default function SearchBar({ initialValues = {} }) {
  const router = Router();
  const [finalidade, setFinalidade] = useState(initialValues.finalidade || 'venda');
  const [tipo, setTipo] = useState(initialValues.tipo || '');
  const [busca, setBusca] = useState(initialValues.busca || 'Porto Alegre');
  const [precoMax, setPrecoMax] = useState(initialValues.precoMax || '');
  const [quartos, setQuartos] = useState(initialValues.quartos || '');

  function Router() {
    return useRouter();
  }

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const buscaFinal = busca.trim() || 'Porto Alegre';

    if (finalidade) params.set('finalidade', finalidade);
    if (tipo) params.set('tipo', tipo);
    params.set('busca', buscaFinal);
    if (precoMax) params.set('precoMax', precoMax);
    if (quartos) params.set('quartos', quartos);

    router.push(`/imoveis?${params.toString()}`);
  };

  return (
    <div className={styles.container}>
      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${finalidade === 'venda' ? styles.tabActive : ''}`}
          onClick={() => setFinalidade('venda')}
        >
          Comprar
        </button>
        <button
          type="button"
          className={`${styles.tab} ${finalidade === 'aluguel' ? styles.tabActive : ''}`}
          onClick={() => setFinalidade('aluguel')}
        >
          Alugar
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSearch} className={styles.form}>
        <div className={styles.grid}>
          {/* Location / Keyword */}
          <div className={styles.field}>
            <label className={styles.label}>
              <FaMapMarkerAlt /> Cidade ou Bairro
            </label>
            <input
              type="text"
              placeholder="Ex: Porto Alegre, Bom Fim"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={styles.input}
            />
          </div>

          {/* Property Type */}
          <div className={styles.field}>
            <label className={styles.label}>
              <FaHome /> Tipo de Imóvel
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className={styles.select}
            >
              <option value="">Todos os tipos</option>
              <option value="apartamento">Apartamento</option>
              <option value="casa">Casa</option>
              <option value="cobertura">Cobertura</option>
              <option value="terreno">Terreno</option>
              <option value="comercial">Comercial</option>
            </select>
          </div>

          {/* Max Price */}
          <div className={styles.field}>
            <label className={styles.label}>
              <FaDollarSign /> Preço Máximo
            </label>
            <select
              value={precoMax}
              onChange={(e) => setPrecoMax(e.target.value)}
              className={styles.select}
            >
              <option value="">Qualquer valor</option>
              <option value="500000">Até R$ 500.000</option>
              <option value="1000000">Até R$ 1.000.000</option>
              <option value="2000000">Até R$ 2.000.000</option>
              <option value="5000000">Até R$ 5.000.000</option>
              <option value="10000000">Até R$ 10.000.000</option>
            </select>
          </div>

          {/* Bedrooms */}
          <div className={styles.field}>
            <label className={styles.label}>
              <FaBed /> Mín. Quartos
            </label>
            <select
              value={quartos}
              onChange={(e) => setQuartos(e.target.value)}
              className={styles.select}
            >
              <option value="">Qualquer</option>
              <option value="1">1+ quarto</option>
              <option value="2">2+ quartos</option>
              <option value="3">3+ quartos</option>
              <option value="4">4+ quartos</option>
            </select>
          </div>

          {/* Submit Button */}
          <div className={styles.btnWrapper}>
            <button type="submit" className={styles.searchBtn}>
              <FaSearch /> Buscar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
