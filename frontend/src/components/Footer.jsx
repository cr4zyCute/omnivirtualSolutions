import React from 'react';
import { Link } from 'react-router-dom';
import { useCms } from '../context/CmsContext';
import './Footer.css';

export default function Footer() {
  const { t } = useCms();

  return (
    <footer id="footer" className="footer-v2">
      <div className="footer-v2-glow" aria-hidden="true" />

      <div className="container footer-v2-inner">
        <div className="row gy-4 gx-lg-5 align-items-center">
          
          {/* ════ Corporate Building Image Column (3 cols) ════ */}
          <div className="col-lg-3 col-md-4 footer-img-col" data-aos="fade-up" data-aos-delay="100">
            <div className="footer-img-frame">
              <img
                src={t('footer.hq.image', '/assets/img/footer-image.jpg')}
                alt="Omni Virtual Solutions Corporate Facility"
                className="footer-building-img"
                data-block-key="footer.hq.image"
              />
              <div className="footer-img-overlay" />
            </div>
          </div>

          {/* ════ Company Info & Brand Column (5 cols) ════ */}
          <div className="col-lg-5 col-md-8 footer-brand-wrap" data-aos="fade-up" data-aos-delay="150">
            <Link to="/" className="footer-brand-header">
              <img
                src="/assets/img/OmniLogo2.png"
                alt="Omni Virtual Solutions Logo"
                className="footer-brand-logo"
              />
              <span className="footer-brand-title">Omni Virtual Solutions</span>
            </Link>
            
            <p className="footer-brand-tagline">
              Empowering businesses and authors worldwide with world-class virtual specialists, comprehensive publishing workflows, and dedicated operational oversight.
            </p>

            <div className="footer-trust-chips">
              <span className="footer-trust-chip">
                <i className="bi bi-clock-history"></i> 24/7 Operations
              </span>
              <span className="footer-trust-chip">
                <i className="bi bi-shield-fill-check"></i> Enterprise Verified
              </span>
            </div>

            <div className="footer-contact-inline">
              <a href="tel:+13159154799" className="footer-inline-contact">
                <i className="bi bi-telephone-fill"></i>
                <span data-block-key="footer.phone">{t('footer.phone', '+1 315-915-4799')}</span>
              </a>
              <a href="mailto:admin@omnivirtualsolution.com" className="footer-inline-contact">
                <i className="bi bi-envelope-fill"></i>
                <span data-block-key="footer.email">{t('footer.email', 'admin@omnivirtualsolution.com')}</span>
              </a>
            </div>
          </div>

          {/* ════ Services Column (4 cols) ════ */}
          <div className="col-lg-4 col-md-12 footer-services-col" data-aos="fade-up" data-aos-delay="200">
            <h4 className="footer-col-title">Our Services</h4>
            <ul className="footer-nav-list">
              <li>
                <Link to="/services?open=eval-services" className="footer-nav-link">
                  <i className="bi bi-chevron-right"></i>
                  <span>Publishing Packages</span>
                </Link>
              </li>
              <li>
                <Link to="/services?open=editorial-services" className="footer-nav-link">
                  <i className="bi bi-chevron-right"></i>
                  <span>Editorial Evaluation</span>
                </Link>
              </li>
              <li>
                <Link to="/services?open=marketing-dropdown" className="footer-nav-link">
                  <i className="bi bi-chevron-right"></i>
                  <span>Marketing Services</span>
                </Link>
              </li>
              <li>
                <Link to="/services?open=format-services" className="footer-nav-link">
                  <i className="bi bi-chevron-right"></i>
                  <span>Formats &amp; Distribution</span>
                </Link>
              </li>
              <li>
                <Link to="/services" className="footer-nav-link">
                  <i className="bi bi-chevron-right"></i>
                  <span>Virtual Staffing Solutions</span>
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* ════ Bottom Bar: Copyright ════ */}
        <div className="footer-v2-bottom">
          <p className="footer-copyright-text">
            © {new Date().getFullYear()} <strong>Omni Virtual Solutions</strong>. All Rights Reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
