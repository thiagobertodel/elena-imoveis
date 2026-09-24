'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute/ProtectedRoute';
import ImageUploader from '../../../components/ImageUploader/ImageUploader';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { FaBuilding, FaMapMarkerAlt, FaClipboardList, FaImages, FaCheckCircle, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import styles from './novoImovel.module.css';

const COMMON_FEATURES = [
  'Piscina', 'Churrasqueira', 'Espaço Gourmet', 'Academia', 'Sauna',
  'Portaria 24h', 'Elevador Privativo', 'Ar Condicionado', 'Mobiliado',
  'Quadra de Tênis', 'Varanda Gourmet', 'Gerador de Energia', 'Vista Panorâmica'
];

export default function NovoImovelPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState('apartamento');
  const [finalidade, setFinalidade] = useState('venda');
  const [preco, setPreco] = useState('');
  const [condominio, setCondominio] = useState('');
  const [iptu, setIptu] = useState('');

  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('Porto Alegre');
  const [estado, setEstado] = useState('RS');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const [areaM2, setAreaM2] = useState('');
  const [quartos, setQuartos] = useState('1');
  const [banheiros, setBanheiros] = useState('1');
  const [vagas, setVagas] = useState('1');
  const [caracteristicas, setCaracteristicas] = useState([]);

  const [imagens, setImagens] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);

  const toggleFeature = (feat) => {
    setCaracteristicas((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (step === 1 && (!titulo || !preco)) {
      toast.error('Preencha título e preço do imóvel.');
      return;
    }
    if (step === 2 && (!bairro || !cidade)) {
      toast.error('Preencha pelo menos o bairro e a cidade.');
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (imagens.length === 0) {
      toast.error('Adicione pelo menos 1 foto ao anúncio!');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        titulo,
        descricao,
        tipo: finalidade,
        categoria: tipo,
        preco: Number(preco),
        endereco,
        bairro,
        cidade,
        cep: '',
        ...(latitude ? { latitude: Number(latitude) } : {}),
        ...(longitude ? { longitude: Number(longitude) } : {}),
        ...(areaM2 ? { area: Number(areaM2) } : {}),
        quartos: Number(quartos),
        banheiros: Number(banheiros),
        garagem: Number(vagas),
      };

      const propertyResponse = await api.post('/properties', payload);
      const propertyId = propertyResponse.data.property.id;
      const formData = new FormData();
      imageFiles.forEach((file) => formData.append('images', file));
      try {
        await api.post(`/upload/${propertyId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch (uploadError) {
        await api.delete(`/properties/${propertyId}`);
        throw uploadError;
      }
      toast.success('Imóvel cadastrado e publicado com sucesso!');
      router.push('/painel');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.mensagem || 'Erro ao cadastrar imóvel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <span className={styles.tag}>NOVO ANÚNCIO</span>
            <h1 className={styles.title}>Cadastrar Imóvel</h1>
            <p className={styles.subtitle}>Preencha as informações detalhadas para publicação</p>
          </div>

          {/* Stepper Header */}
          <div className={styles.stepper}>
            <div className={`${styles.stepItem} ${step >= 1 ? styles.stepActive : ''}`}>
              <div className={styles.stepNum}>1</div>
              <span>Informações Básicas</span>
            </div>
            <div className={styles.stepLine} />
            <div className={`${styles.stepItem} ${step >= 2 ? styles.stepActive : ''}`}>
              <div className={styles.stepNum}>2</div>
              <span>Endereço & Mapa</span>
            </div>
            <div className={styles.stepLine} />
            <div className={`${styles.stepItem} ${step >= 3 ? styles.stepActive : ''}`}>
              <div className={styles.stepNum}>3</div>
              <span>Ficha Técnica</span>
            </div>
            <div className={styles.stepLine} />
            <div className={`${styles.stepItem} ${step >= 4 ? styles.stepActive : ''}`}>
              <div className={styles.stepNum}>4</div>
              <span>Galeria de Fotos</span>
            </div>
          </div>

          {/* Step 1 Form */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className={styles.form}>
              <h3 className={styles.stepTitle}><FaBuilding /> Etapa 1: Dados Principais</h3>
              <div className={styles.field}>
                <label>Título do Anúncio *</label>
                <input
                  type="text"
                  placeholder="Ex: Cobertura Duplex em Moema com Vista Definitiva"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Tipo de Imóvel</label>
                  <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                    <option value="apartamento">Apartamento</option>
                    <option value="casa">Casa</option>
                    <option value="cobertura">Cobertura</option>
                    <option value="terreno">Terreno</option>
                    <option value="comercial">Comercial</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label>Finalidade</label>
                  <select value={finalidade} onChange={(e) => setFinalidade(e.target.value)}>
                    <option value="venda">Venda</option>
                    <option value="aluguel">Aluguel</option>
                  </select>
                </div>
              </div>

              <div className={styles.row3}>
                <div className={styles.field}>
                  <label>Preço (R$) *</label>
                  <input
                    type="number"
                    placeholder="Ex: 2500000"
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label>Condomínio (R$)</label>
                  <input
                    type="number"
                    placeholder="Ex: 1800"
                    value={condominio}
                    onChange={(e) => setCondominio(e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label>IPTU Anual (R$)</label>
                  <input
                    type="number"
                    placeholder="Ex: 5400"
                    value={iptu}
                    onChange={(e) => setIptu(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label>Descrição Completa do Imóvel</label>
                <textarea
                  rows={5}
                  placeholder="Descreva a arquitetura, acabamentos, insolação, segurança e diferenciais..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>

              <div className={styles.btnRowRight}>
                <button type="submit" className={styles.nextBtn}>
                  Próxima Etapa <FaArrowRight />
                </button>
              </div>
            </form>
          )}

          {/* Step 2 Form */}
          {step === 2 && (
            <form onSubmit={handleNextStep} className={styles.form}>
              <h3 className={styles.stepTitle}><FaMapMarkerAlt /> Etapa 2: Localização</h3>

              <div className={styles.field}>
                <label>Endereço / Logradouro</label>
                <input
                  type="text"
                  placeholder="Ex: Av. República do Líbano, 1000"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                />
              </div>

              <div className={styles.row3}>
                <div className={styles.field}>
                  <label>Bairro *</label>
                  <input
                    type="text"
                    placeholder="Ex: Moema"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label>Cidade *</label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label>Estado (UF)</label>
                  <input
                    type="text"
                    placeholder="SP"
                    maxLength={2}
                    value={estado}
                    onChange={(e) => setEstado(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Latitude (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: -23.5614"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label>Longitude (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: -46.6558"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.btnRow}>
                <button type="button" onClick={() => setStep(1)} className={styles.prevBtn}>
                  <FaArrowLeft /> Voltar
                </button>
                <button type="submit" className={styles.nextBtn}>
                  Próxima Etapa <FaArrowRight />
                </button>
              </div>
            </form>
          )}

          {/* Step 3 Form */}
          {step === 3 && (
            <form onSubmit={handleNextStep} className={styles.form}>
              <h3 className={styles.stepTitle}><FaClipboardList /> Etapa 3: Especificações</h3>

              <div className={styles.row4}>
                <div className={styles.field}>
                  <label>Área Útil (m²)</label>
                  <input
                    type="number"
                    placeholder="Ex: 240"
                    value={areaM2}
                    onChange={(e) => setAreaM2(e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label>Quartos</label>
                  <select value={quartos} onChange={(e) => setQuartos(e.target.value)}>
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>{num} {num === 1 ? 'quarto' : 'quartos'}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label>Banheiros</label>
                  <select value={banheiros} onChange={(e) => setBanheiros(e.target.value)}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <option key={num} value={num}>{num} {num === 1 ? 'banheiro' : 'banheiros'}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label>Vagas de Garagem</label>
                  <select value={vagas} onChange={(e) => setVagas(e.target.value)}>
                    {[0, 1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>{num} {num === 1 ? 'vaga' : 'vagas'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.featuresWrapper}>
                <label className={styles.featureLabel}>Diferenciais e Infraestrutura</label>
                <div className={styles.featuresGrid}>
                  {COMMON_FEATURES.map((feat) => {
                    const selected = caracteristicas.includes(feat);
                    return (
                      <button
                        key={feat}
                        type="button"
                        className={`${styles.featureChip} ${selected ? styles.featureChipActive : ''}`}
                        onClick={() => toggleFeature(feat)}
                      >
                        {selected && <FaCheckCircle />} {feat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.btnRow}>
                <button type="button" onClick={() => setStep(2)} className={styles.prevBtn}>
                  <FaArrowLeft /> Voltar
                </button>
                <button type="submit" className={styles.nextBtn}>
                  Próxima Etapa <FaArrowRight />
                </button>
              </div>
            </form>
          )}

          {/* Step 4 Form */}
          {step === 4 && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <h3 className={styles.stepTitle}><FaImages /> Etapa 4: Fotos do Imóvel</h3>
              <p className={styles.stepSubtitle}>
                Faça o upload de fotos de alta resolução para encantar os futuros compradores. A primeira foto será a capa do anúncio.
              </p>

              <ImageUploader
                images={imagens}
                setImages={setImagens}
                files={imageFiles}
                setFiles={setImageFiles}
              />

              <div className={styles.btnRow}>
                <button type="button" onClick={() => setStep(3)} className={styles.prevBtn}>
                  <FaArrowLeft /> Voltar
                </button>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Publicando...' : 'Finalizar e Cadastrar Imóvel'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
