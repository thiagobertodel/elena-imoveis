'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { HiOutlineMenu, HiOutlineX, HiOutlineLogout, HiOutlineCog, HiOutlinePlus } from 'react-icons/hi';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <img src="/logo-elena.png" alt="Elena Imóveis" className={styles.logoImage} />
        </Link>

        {/* Nav Links - Desktop */}
        <div className={styles.navLinks}>
          <Link href="/" className={`${styles.navLink} ${pathname === '/' ? styles.active : ''}`}>
            Início
          </Link>
          <Link href="/imoveis" className={`${styles.navLink} ${pathname.startsWith('/imoveis') ? styles.active : ''}`}>
            Imóveis
          </Link>
          {isAdmin && (
            <Link href="/painel" className={`${styles.navLink} ${pathname.startsWith('/painel') ? styles.active : ''}`}>
              Administração
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" className={`${styles.navLink} ${pathname.startsWith('/admin') ? styles.active : ''}`}>
              Admin
            </Link>
          )}
        </div>

        {/* Auth Buttons */}
        <div className={styles.authSection}>
          {isAuthenticated ? (
            <div className={styles.userMenu}>
              <button
                className={styles.userButton}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className={styles.userAvatar}>
                  {user?.nome?.charAt(0).toUpperCase()}
                </div>
                <span className={styles.userName}>{user?.nome?.split(' ')[0]}</span>
              </button>

              {dropdownOpen && (
                <>
                  <div className={styles.dropdownOverlay} onClick={() => setDropdownOpen(false)} />
                  <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                      <p className={styles.dropdownName}>{user?.nome}</p>
                      <p className={styles.dropdownEmail}>{user?.email}</p>
                    </div>
                    <div className={styles.dropdownDivider} />
                    <Link href="/painel/novo-imovel" className={styles.dropdownItem}>
                      <HiOutlinePlus /> Novo Imóvel
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className={styles.dropdownItem}>
                        <HiOutlineCog /> Administração
                      </Link>
                    )}
                    <div className={styles.dropdownDivider} />
                    <button onClick={logout} className={styles.dropdownItem}>
                      <HiOutlineLogout /> Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/login" className={styles.adminLink}>
              Área do Adm
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button className={styles.menuToggle} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <HiOutlineX /> : <HiOutlineMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <Link href="/" className={styles.mobileLink}>Início</Link>
          <Link href="/imoveis" className={styles.mobileLink}>Imóveis</Link>
          {isAuthenticated && (
            <>
              <Link href="/painel/novo-imovel" className={styles.mobileLink}>Novo Imóvel</Link>
              {isAdmin && <Link href="/admin" className={styles.mobileLink}>Administração</Link>}
              <button onClick={logout} className={styles.mobileLink}>Sair</button>
            </>
          )}
          {!isAuthenticated && <Link href="/login" className={styles.mobileLink}>Área do Adm</Link>}
        </div>
      )}
    </nav>
  );
}
