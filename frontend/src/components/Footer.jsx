import React from 'react';
import { Link } from 'react-router-dom';
import { useCms } from '../context/CmsContext';

export default function Footer() {
  const { t } = useCms();

  return (
    <footer id="footer" className="footer footer-luxury">
      <div id="footer-contact" className="container footer-top">
        <div className="row gy-4 align-items-start">
          {/* Corporate Visual Column */}
          <div className="col-lg-3 col-md-4 footer-image-col" data-aos="fade-up" data-aos-delay="100">
            <div className="footer-img-wrapper">
              <img
                src={t('footer.hq.image', '/assets/img/footer-image.jpg')}
                alt="Omni Virtual Solutions Headquarters"
                className="img-fluid footer-building-img"
                data-block-key="footer.hq.image"
              />
              <div className="footer-img-caption">
                <span data-block-key="footer.hq.caption">
                  {t('footer.hq.caption', 'New York, NY')}
                </span>
              </div>
            </div>
          </div>

          {/* Corporate Info Column */}
          <div className="col-lg-4 col-md-8 footer-about" data-aos="fade-up" data-aos-delay="150">
            <Link to="/" className="d-flex align-items-center text-decoration-none">
              <span className="sitename">Omni Virtual Solutions</span>
            </Link>
            <div className="footer-contact pt-3">
              <p className="footer-address" data-block-key="footer.address">
                {t('footer.address', '1350 Ave of the Americas,\nFl 2 -1100 New York, NY\n10019')}
              </p>
              <div className="footer-meta-item">
                <strong>Email:</strong>{' '}
                <span data-block-key="footer.email">
                  {t('footer.email', 'admin@omnivirtualsolution.com')}
                </span>
              </div>
              <div className="footer-meta-item">
                <strong>Phone:</strong>{' '}
                <span data-block-key="footer.phone">
                  {t('footer.phone', '+1 315-915-4799')}
                </span>
              </div>
            </div>
          </div>

          {/* Useful Links Column */}
          <div className="col-lg-2 col-md-6 col-6 footer-links" data-aos="fade-up" data-aos-delay="200">
            <h4>Useful Links</h4>
            <ul>
              <li>
                <i className="bi bi-chevron-right"></i> <Link to="/#hero">Home</Link>
              </li>
              <li>
                <i className="bi bi-chevron-right"></i> <Link to="/#about">About us</Link>
              </li>
              <li>
                <i className="bi bi-chevron-right"></i> <Link to="/services">Services</Link>
              </li>
              <li>
                <i className="bi bi-chevron-right"></i> <Link to="/#contact">Contact</Link>
              </li>
              <li>
                <i className="bi bi-chevron-right"></i> <a href="/admin/">Admin CMS</a>
              </li>
            </ul>
          </div>

          {/* Our Services Column */}
          <div className="col-lg-3 col-md-6 col-6 footer-links" data-aos="fade-up" data-aos-delay="250">
            <h4>Our Services</h4>
            <ul>
              <li>
                <i className="bi bi-chevron-right"></i>{' '}
                <Link to="/services?open=editorial-services">Evaluation Services</Link>
              </li>
              <li>
                <i className="bi bi-chevron-right"></i>{' '}
                <Link to="/services?open=eval-services">Publishing Packages</Link>
              </li>
              <li>
                <i className="bi bi-chevron-right"></i>{' '}
                <Link to="/services?open=marketing-dropdown">Marketing Services</Link>
              </li>
              <li>
                <i className="bi bi-chevron-right"></i>{' '}
                <Link to="/services?open=format-services">Formats</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container copyright text-center mt-5">
        <div className="copyright-inner">
          <p>
            © <span>Copyright</span> <strong className="px-1 sitename">Omni Virtual Solutions</strong>{' '}
            <span>All Rights Reserved</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
