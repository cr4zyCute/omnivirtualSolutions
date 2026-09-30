import React from 'react';
import { Link } from 'react-router-dom';
import { useCms } from '../context/CmsContext';

export default function ServicesSection() {
  const { t } = useCms();

  return (
    <section id="services" className="services section services-redesign">
      <div className="container" data-aos="fade-up">
        <div className="services-header text-center">
          <div className="services-pill-badge">
            <span data-block-key="home.services.badge">
              {t('home.services.badge', '✦ WHAT WE OFFER')}
            </span>
          </div>
          <h2 className="services-section-heading" data-block-key="home.services.heading">
            {t('home.services.heading', 'Our Services')}
          </h2>
          <div className="services-heading-divider"></div>
        </div>
      </div>

      <div className="container">
        <div className="row gy-4 justify-content-center">
          {/* Service Item 1: Marketing Services */}
          <div className="col-lg-6 col-md-6" data-aos="fade-up" data-aos-delay="100">
            <div className="service-card-luxury position-relative">
              <div className="service-card-top">
                <div className="service-icon-box">
                  <i className="bi bi-megaphone-fill"></i>
                </div>
                <div className="service-card-tag">Specialized Strategy</div>
              </div>

              <Link to="/services?open=marketing-dropdown" className="stretched-link text-decoration-none">
                <h3 className="service-card-title">Marketing Services</h3>
              </Link>

              <p className="service-card-desc">
                One of the key features that makes an Omni book distinct from other self-published books is our professional editorial evaluation.
              </p>

              <div className="service-feature-pills">
                <span className="service-pill">
                  <i className="bi bi-check2"></i> Editorial Evaluation
                </span>
                <span className="service-pill">
                  <i className="bi bi-check2"></i> Strategic Visibility
                </span>
                <span className="service-pill">
                  <i className="bi bi-check2"></i> Target Reach
                </span>
              </div>

              <div className="service-card-footer">
                <span className="service-link-text">Learn More</span>
                <i className="bi bi-arrow-right service-link-arrow"></i>
              </div>
            </div>
          </div>

          {/* Service Item 2: Publishing Packages */}
          <div className="col-lg-6 col-md-6" data-aos="fade-up" data-aos-delay="200">
            <div className="service-card-luxury position-relative">
              <div className="service-card-top">
                <div className="service-icon-box">
                  <i className="bi bi-book-half"></i>
                </div>
                <div className="service-card-tag">End-to-End Support</div>
              </div>

              <Link to="/services?open=eval-services" className="stretched-link text-decoration-none">
                <h3 className="service-card-title">Publishing Packages</h3>
              </Link>

              <p className="service-card-desc">
                Our packages are designed to offer authors the support and tools they need to maximize their book's potential. Each package guarantees one-on-one author support for every step of the self-publishing journey.
              </p>

              <div className="service-feature-pills">
                <span className="service-pill">
                  <i className="bi bi-check2"></i> 1-on-1 Author Guidance
                </span>
                <span className="service-pill">
                  <i className="bi bi-check2"></i> Complete Tool Suite
                </span>
                <span className="service-pill">
                  <i className="bi bi-check2"></i> Maximize Potential
                </span>
              </div>

              <div className="service-card-footer">
                <span className="service-link-text">Learn More</span>
                <i className="bi bi-arrow-right service-link-arrow"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
