import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCms } from '../context/CmsContext';
import './Navbar.css';

export default function Navbar() {
  const { t } = useCms();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // Lock scroll when mobile nav is open
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileNavOpen) {
        setMobileNavOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileNavOpen]);

  const toggleMobileNav = () => {
    setMobileNavOpen((prev) => !prev);
  };

  const closeMobileNav = () => {
    setMobileNavOpen(false);
  };

  const scrollToHash = (hash) => {
    closeMobileNav();
    if (location.pathname === '/') {
      const el = document.querySelector(hash);
      if (el) {
        const header = document.querySelector('#header');
        const offset = header ? header.offsetHeight : 70;
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <header
        id="header"
        className={`header d-flex align-items-center sticky-top ${isScrolled ? 'scrolled' : ''}`}
      >
        <div className="container-fluid container-xl position-relative d-flex align-items-center justify-content-between px-3 px-sm-4">
          {/* Logo */}
          <Link to="/" className="logo me-auto" onClick={closeMobileNav}>
            <img src="/assets/img/OmniLogo2.png" alt="Omni Virtual Solutions Logo" />
            <span className="sitename">Omni Virtual Solutions</span>
          </Link>

          {/* Desktop Navigation (Screens >= 1200px) */}
          <nav className="desktop-navmenu d-none d-xl-flex">
            <ul>
              <li>
                {location.pathname === '/' ? (
                  <a
                    href="#hero"
                    className="active"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToHash('#hero');
                    }}
                  >
                    Home
                  </a>
                ) : (
                  <Link to="/#hero">Home</Link>
                )}
              </li>
              <li>
                {location.pathname === '/' ? (
                  <a
                    href="#about"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToHash('#about');
                    }}
                  >
                    About
                  </a>
                ) : (
                  <Link to="/#about">About</Link>
                )}
              </li>
              <li>
                <Link to="/services" className={location.pathname === '/services' ? 'active' : ''}>
                  Services
                </Link>
              </li>
              <li>
                {location.pathname === '/' ? (
                  <a
                    href="#contact"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToHash('#contact');
                    }}
                  >
                    Contact
                  </a>
                ) : (
                  <Link to="/#contact">Contact</Link>
                )}
              </li>
            </ul>
          </nav>

          {/* Header Right Actions */}
          <div className="header-right-actions">
            {/* Get Started Button */}
            <a
              className="header-btn-getstarted"
              href={location.pathname === '/' ? '#services' : '/services'}
              data-block-key="home.hero.cta_label"
              onClick={(e) => {
                if (location.pathname === '/') {
                  e.preventDefault();
                  scrollToHash('#services');
                }
              }}
            >
              {t('home.hero.cta_label', 'Get Started')}
            </a>

            {/* Accessible Animated Hamburger Button (Screens < 1200px) */}
            <button
              type="button"
              className={`navbar-hamburger-btn ${mobileNavOpen ? 'is-active' : ''}`}
              onClick={toggleMobileNav}
              aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileNavOpen}
            >
              <span className="hamburger-icon-lines" aria-hidden="true">
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop overlay for mobile menu */}
      <div
        className={`mobile-nav-backdrop ${mobileNavOpen ? 'open' : ''}`}
        onClick={closeMobileNav}
        aria-hidden="true"
      />

      {/* Slide-Down Mobile Drawer Menu */}
      <div
        className={`mobile-nav-drawer ${mobileNavOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        <ul className="mobile-nav-list">
          <li>
            {location.pathname === '/' ? (
              <a
                href="#hero"
                className="mobile-nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToHash('#hero');
                }}
              >
                <span>
                  <i className="bi bi-house-door me-2" style={{ color: '#c29a6b' }}></i>
                  Home
                </span>
                <i className="bi bi-chevron-right text-muted small"></i>
              </a>
            ) : (
              <Link to="/#hero" className="mobile-nav-link" onClick={closeMobileNav}>
                <span>
                  <i className="bi bi-house-door me-2" style={{ color: '#c29a6b' }}></i>
                  Home
                </span>
                <i className="bi bi-chevron-right text-muted small"></i>
              </Link>
            )}
          </li>

          <li>
            {location.pathname === '/' ? (
              <a
                href="#about"
                className="mobile-nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToHash('#about');
                }}
              >
                <span>
                  <i className="bi bi-info-circle me-2" style={{ color: '#c29a6b' }}></i>
                  About
                </span>
                <i className="bi bi-chevron-right text-muted small"></i>
              </a>
            ) : (
              <Link to="/#about" className="mobile-nav-link" onClick={closeMobileNav}>
                <span>
                  <i className="bi bi-info-circle me-2" style={{ color: '#c29a6b' }}></i>
                  About
                </span>
                <i className="bi bi-chevron-right text-muted small"></i>
              </Link>
            )}
          </li>

          <li>
            <Link
              to="/services"
              className={`mobile-nav-link ${location.pathname === '/services' ? 'active' : ''}`}
              onClick={closeMobileNav}
            >
              <span>
                <i className="bi bi-grid-fill me-2" style={{ color: '#c29a6b' }}></i>
                Services Catalog
              </span>
              <i className="bi bi-chevron-right text-muted small"></i>
            </Link>
          </li>

          <li>
            {location.pathname === '/' ? (
              <a
                href="#contact"
                className="mobile-nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToHash('#contact');
                }}
              >
                <span>
                  <i className="bi bi-envelope me-2" style={{ color: '#c29a6b' }}></i>
                  Contact
                </span>
                <i className="bi bi-chevron-right text-muted small"></i>
              </a>
            ) : (
              <Link to="/#contact" className="mobile-nav-link" onClick={closeMobileNav}>
                <span>
                  <i className="bi bi-envelope me-2" style={{ color: '#c29a6b' }}></i>
                  Contact
                </span>
                <i className="bi bi-chevron-right text-muted small"></i>
              </Link>
            )}
          </li>
        </ul>

        {/* Mobile Drawer Bottom Actions */}
        <div className="mobile-drawer-bottom">
          <a
            className="mobile-drawer-cta"
            href={location.pathname === '/' ? '#services' : '/services'}
            data-block-key="home.hero.cta_label"
            onClick={(e) => {
              if (location.pathname === '/') {
                e.preventDefault();
                scrollToHash('#services');
              } else {
                closeMobileNav();
              }
            }}
          >
            <span>{t('home.hero.cta_label', 'Get Started')}</span>
            <i className="bi bi-arrow-right"></i>
          </a>

          <div className="mobile-drawer-contact-info">
            <a href="tel:+13159154799">
              <i className="bi bi-telephone-fill"></i>
              <span>+1 315-915-4799</span>
            </a>
            <a href="mailto:admin@omnivirtualsolution.com">
              <i className="bi bi-envelope-fill"></i>
              <span>Email Support</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
