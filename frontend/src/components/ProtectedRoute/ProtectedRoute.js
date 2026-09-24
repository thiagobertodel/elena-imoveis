'use client';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (allowedRoles.length > 0 && !allowedRoles.includes(user.role || user.tipo_usuario)) {
        router.push('/');
      }
    }
  }, [user, loading, allowedRoles, router]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        color: 'var(--accent-gold)'
      }}>
        <div className="spinner" /> Carregando...
      </div>
    );
  }

  if (!user) return null;
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role || user.tipo_usuario)) return null;

  return <>{children}</>;
}
