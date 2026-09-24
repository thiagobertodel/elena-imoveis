import Link from 'next/link';
import { FaShieldAlt, FaLock, FaUserCheck, FaFileContract } from 'react-icons/fa';
import styles from './privacidade.module.css';

export default function PrivacidadePage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <FaShieldAlt className={styles.shieldIcon} />
          <h1 className={styles.title}>Política de Privacidade e Proteção de Dados (LGPD)</h1>
          <p className={styles.subtitle}>
            Em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018)
          </p>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>1. Apresentação e Compromisso</h2>
            <p>
              A <strong>Elena Imóveis</strong> compromete-se a proteger a privacidade e a confidencialidade dos dados pessoais de nossos usuários, clientes e anunciantes. Esta política descreve como coletamos, usamos, armazenamos e protegemos suas informações ao utilizar nossa plataforma.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Dados Coletados</h2>
            <p>Coletamos informações estritamente necessárias para a prestação dos nossos serviços imobiliários:</p>
            <ul>
              <li><strong>Dados administrativos:</strong> Nome, e-mail, telefone e senha criptografada do responsável pelo sistema.</li>
              <li><strong>Dados de Imóveis (Anunciantes):</strong> Endereço, fotos, valores e especificações técnicas.</li>
              <li><strong>Dados de Navegação:</strong> Endereço IP e tipo de navegador, quando aplicável.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>3. Finalidade do Tratamento</h2>
            <p>Os seus dados pessoais são utilizados para as seguintes finalidades legítimas:</p>
            <ul>
              <li>Conectar interessados e anunciantes de imóveis de alto padrão.</li>
              <li>Autenticar o acesso à conta de usuário e manter a segurança.</li>
              <li>Permitir a operação e administração do catálogo de imóveis.</li>
              <li>Cumprir obrigações legais e regulatórias do setor imobiliário.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>4. Direitos do Titular dos Dados (Art. 18 da LGPD)</h2>
            <p>Como titular dos dados, você tem o direito de solicitar a qualquer momento:</p>
            <ul>
              <li>Confirmação da existência de tratamento dos seus dados.</li>
              <li>Acesso aos seus dados pessoais armazenados.</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
              <li>Eliminação ou portabilidade dos dados pessoais da nossa base.</li>
            </ul>
            <div className={styles.contactNotice}>
              Para exercer seus direitos de titular ou tirar dúvidas sobre a LGPD, entre em contato com nosso Encarregado de Dados (DPO) através do e-mail: <strong>dpo@elenaimoveis.com.br</strong>
            </div>
          </section>

          <section className={styles.section}>
            <h2>5. Segurança das Informações</h2>
            <p>
              Utilizamos criptografia padrão de mercado (SSL/TLS), senhas com hash seguro (bcrypt) e controle estrito de acesso ao banco de dados para proteger suas informações contra acessos não autorizados.
            </p>
          </section>
        </div>

        <div className={styles.footer}>
          <Link href="/" className={styles.backLink}>
            ← Voltar para a Página Inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
