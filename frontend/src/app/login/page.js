'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { FaEnvelope, FaLock, FaBuilding } from 'react-icons/fa';
import toast from 'react-hot-toast';
import styles from './login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !senha) {
      toast.error('Preencha email e senha!');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, senha);
      toast.success(`Bem-vindo(a) de volta, ${user.nome}!`);

      if ((user.role || user.tipo_usuario) === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.mensagem || 'Erro ao realizar login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link href="/" className={styles.logo}>
            <FaBuilding className={styles.logoIcon} />
            <span>ELENA <span className={styles.goldText}>IMÓVEIS</span></span>
          </Link>
          <h2>Acesso administrativo</h2>
          <p>Área exclusiva do adm para gerenciar os imóveis</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>E-mail</label>
            <div className={styles.inputWrapper}>
              <FaEnvelope className={styles.icon} />
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Senha</label>
            <div className={styles.inputWrapper}>
              <FaLock className={styles.icon} />
              <input
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar na Conta'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>Clientes e anunciantes consultam os imóveis sem criar conta.</p>
        </div>
      </div>
    </div>
  );
}
