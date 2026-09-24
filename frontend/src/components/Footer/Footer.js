import Link from 'next/link';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaInstagram } from 'react-icons/fa';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Brand Info */}
          <div className={styles.brandCol}>
            <Link href="/" className={styles.brand}>
              <img src="/logo-elena.png" alt="Elena Imóveis" className={styles.brandImage} />
            </Link>
            <p className={styles.description}>
              Sua plataforma de imóveis de alto padrão. Encontre casas, apartamentos e terrenos exclusivos com total praticidade e transparência.
            </p>
            <div className={styles.socials}>
              <a href="https://www.instagram.com/imobiliaria_elenaimoveis/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>Navegação</h4>
            <ul>
              <li><Link href="/">Início</Link></li>
              <li><Link href="/imoveis">Buscar Imóveis</Link></li>
              <li><Link href="/imoveis?finalidade=venda">Comprar</Link></li>
              <li><Link href="/imoveis?finalidade=aluguel">Alugar</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div className={styles.linksCol}>
            <h4 className={styles.colTitle}>Tipos de Imóveis</h4>
            <ul>
              <li><Link href="/imoveis?tipo=apartamento">Apartamentos</Link></li>
              <li><Link href="/imoveis?tipo=casa">Casas de Luxo</Link></li>
              <li><Link href="/imoveis?tipo=cobertura">Coberturas</Link></li>
              <li><Link href="/imoveis?tipo=terreno">Terrenos & Condomínios</Link></li>
              <li><Link href="/imoveis?tipo=comercial">Comercial</Link></li>
            </ul>
          </div>

          <div className={styles.contactCol}>
            <h4 className={styles.colTitle}>Contato & Suporte</h4>
            <div className={styles.contactItem} style={{ alignItems: 'flex-start' }}>
              <FaMapMarkerAlt style={{ marginTop: '5px' }} />
              <span>Travessa Américo Silveira, 165-E, Bairro Cristo Redentor<br />Porto Alegre - RS | CEP 91370-010</span>
            </div>
            <div className={styles.contactItem}>
              <FaPhoneAlt />
              <span>51 3347-4228 / 51 99961-2190</span>
            </div>
            <div className={styles.contactItem}>
              <FaEnvelope />
              <span>elenaimoveis@elenaimoveis.com.br</span>
            </div>
            <div className={styles.lgpdBadge}>
              🛡️ Em conformidade com a LGPD (Lei nº 13.709/2018)
            </div>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <p>© {new Date().getFullYear()} Elena Imóveis. Todos os direitos reservados.</p>
          <div className={styles.legalLinks}>
            <Link href="/privacidade">Política de Privacidade</Link>
            <span>•</span>
            <Link href="/termos">Termos de Uso</Link>
            <span>•</span>
            <Link href="/lgpd">Direitos LGPD</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
