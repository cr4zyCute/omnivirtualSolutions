import React from 'react';
import { Link } from 'react-router-dom';
import { useCms } from '../context/CmsContext';

export default function CallToAction() {
  const { t } = useCms();

  return (
    <section id="call-to-action" className="call-to-action section cta-luxury-section">
      <div className="cta-glow-backdrop"></div>
      <div className="container position-relative" data-aos="fade-up" data-aos-delay="100">
        <div className="row justify-content-center">
          <div className="col-xl-9 col-lg-10 text-center">
            <div className="cta-pill-badge">
              <span data-block-key="home.cta.badge">
                {t('home.cta.badge', '✦ ELEVATE YOUR WORKFORCE')}
              </span>
            </div>
            <h2 className="cta-luxury-heading" data-block-key="home.cta.heading">
              {t('home.cta.heading', 'Unlock Seamless Virtual Solutions')}
            </h2>
            <p
              className="cta-luxury-desc"
              style={{ color: '#f7f3ee' }}
              data-block-key="home.cta.desc"
            >
              {t(
                'home.cta.desc',
                'Experience top-tier virtual specialists who enhance efficiency while maintaining autonomy and oversight. Let’s scale your business together.'
              )}
            </p>
            <div className="cta-btn-wrapper">
              <Link className="cta-btn-luxury" to="/services">
                <span className="cta-btn-text" data-block-key="home.cta.btn_label">
                  {t('home.cta.btn_label', 'Services')}
                </span>
                <span className="cta-btn-icon">
                  <i className="bi bi-arrow-right"></i>
                </span>
              </Link>
            </div>
            <div className="cta-trust-tags-wrapper">
              <div className="cta-trust-tags" id="ctaTrustTagsContainer">
                <span className="trust-item" data-block-key="home.cta.trust_tag_1">
                  <i className="bi bi-book-half"></i> {t('home.cta.trust_tag_1', 'Publishing Packages')}
                </span>
                <span className="trust-item" data-block-key="home.cta.trust_tag_2">
                  <i className="bi bi-journal-check"></i> {t('home.cta.trust_tag_2', 'Editorial Evaluation')}
                </span>
                <span className="trust-item" data-block-key="home.cta.trust_tag_3">
                  <i className="bi bi-megaphone"></i> {t('home.cta.trust_tag_3', 'Book Marketing')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
