'use client';
import styles from './FilterSidebar.module.css';
import { FaFilter, FaRedo } from 'react-icons/fa';

export default function FilterSidebar({ filters, setFilters, onApply, onReset }) {
  const handleChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <FaFilter className={styles.icon} /> Filtros Avançados
        </h3>
        <button type="button" onClick={onReset} className={styles.resetBtn} title="Limpar Filtros">
          <FaRedo /> Limpar
        </button>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Finalidade</label>
        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${filters.finalidade === '' ? styles.active : ''}`}
            onClick={() => handleChange('finalidade', '')}
          >
            Todos
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${filters.finalidade === 'venda' ? styles.active : ''}`}
            onClick={() => handleChange('finalidade', 'venda')}
          >
            Comprar
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${filters.finalidade === 'aluguel' ? styles.active : ''}`}
            onClick={() => handleChange('finalidade', 'aluguel')}
          >
            Alugar
          </button>
        </div>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Tipo de Imóvel</label>
        <select
          value={filters.tipo || ''}
          onChange={(e) => handleChange('tipo', e.target.value)}
          className={styles.select}
        >
          <option value="">Todos os tipos</option>
          <option value="apartamento">Apartamento</option>
          <option value="casa">Casa de Luxo</option>
          <option value="cobertura">Cobertura</option>
          <option value="terreno">Terreno</option>
          <option value="comercial">Comercial</option>
        </select>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Faixa de Preço (R$)</label>
        <div className={styles.rangeInputs}>
          <input
            type="number"
            placeholder="Mínimo"
            value={filters.precoMin || ''}
            onChange={(e) => handleChange('precoMin', e.target.value)}
            className={styles.input}
          />
          <span>até</span>
          <input
            type="number"
            placeholder="Máximo"
            value={filters.precoMax || ''}
            onChange={(e) => handleChange('precoMax', e.target.value)}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Quartos</label>
        <div className={styles.optionsGrid}>
          {['', '1', '2', '3', '4+'].map((val) => (
            <button
              key={val || 'any'}
              type="button"
              className={`${styles.optBtn} ${filters.quartos === val ? styles.activeOpt : ''}`}
              onClick={() => handleChange('quartos', val)}
            >
              {val === '' ? 'Qualquer' : val === '4+' ? '4+' : `${val}`}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Banheiros</label>
        <div className={styles.optionsGrid}>
          {['', '1', '2', '3', '4+'].map((val) => (
            <button
              key={val || 'any'}
              type="button"
              className={`${styles.optBtn} ${filters.banheiros === val ? styles.activeOpt : ''}`}
              onClick={() => handleChange('banheiros', val)}
            >
              {val === '' ? 'Qualquer' : val === '4+' ? '4+' : `${val}`}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Vagas de Garagem</label>
        <div className={styles.optionsGrid}>
          {['', '1', '2', '3', '4+'].map((val) => (
            <button
              key={val || 'any'}
              type="button"
              className={`${styles.optBtn} ${filters.vagas === val ? styles.activeOpt : ''}`}
              onClick={() => handleChange('vagas', val)}
            >
              {val === '' ? 'Qualquer' : val === '4+' ? '4+' : `${val}`}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Ordenação</label>
        <select
          value={filters.ordenacao || 'recente'}
          onChange={(e) => handleChange('ordenacao', e.target.value)}
          className={styles.select}
        >
          <option value="recente">Mais Recentes</option>
          <option value="menor_preco">Menor Preço</option>
          <option value="maior_preco">Maior Preço</option>
          <option value="maior_area">Maior Área</option>
        </select>
      </div>

      <button type="button" onClick={onApply} className={styles.applyBtn}>
        Aplicar Filtros
      </button>
    </aside>
  );
}
