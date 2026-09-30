import React from 'react';
import { useCms } from '../context/CmsContext';

export default function About() {
  const { t } = useCms();

  return (
    <section id="about" className="about section about-redesign">
      <div className="container" data-aos="fade-up" data-aos-delay="100">
        <div className="about-header text-center">
          <div className="about-pill-badge">
            <span data-block-key="home.about.badge">
              {t('home.about.badge', '✦ WHO WE ARE & WHAT WE BELIEVE')}
            </span>
          </div>
          <h2 className="about-section-heading" data-block-key="home.about.heading">
            {t('home.about.heading', 'About Us')}
          </h2>
          <div className="about-heading-divider"></div>
        </div>

        <div className="row gy-5 align-items-center mt-3">
          {/* Visual Column */}
          <div className="col-lg-6" data-aos="fade-right" data-aos-delay="150">
            <div className="about-visual-card">
              <div className="about-image-wrapper">
                <img
                  src={t('home.about.image', '/assets/img/about_team.jpg')}
                  alt="Omni Virtual Solutions Professional Team"
                  className="img-fluid about-primary-img"
                  data-block-key="home.about.image"
                />
              </div>

              {/* Floating badge 1: Autonomy & Oversight */}
              <div className="about-floating-stat">
                <div className="stat-icon-wrap">
                  <i className="bi bi-shield-check"></i>
                </div>
                <div className="stat-text-wrap">
                  <span className="stat-num" data-block-key="home.about.badge_stat">
                    {t('home.about.badge_stat', 'Balanced')}
                  </span>
                  <span className="stat-lbl" data-block-key="home.about.badge_lbl">
                    {t('home.about.badge_lbl', 'Autonomy & Oversight')}
                  </span>
                </div>
              </div>

              {/* Floating badge 2: 24/7 Coverage */}
              <div className="about-floating-chip">
                <i className="bi bi-clock-history"></i>
                <span>24/7 Operations</span>
              </div>
            </div>
          </div>

          {/* Content Column */}
          <div className="col-lg-6 content about-content-block" data-aos="fade-left" data-aos-delay="200">
            {/* Luxury Lead Narrative Card */}
            <div className="about-lead-card">
              <div className="lead-tag">
                <i className="bi bi-shield-check me-2" style={{ color: '#c29a6b' }}></i>
                Our Core Philosophy
              </div>
              <p className="about-lead-text" data-block-key="home.about.lead">
                {t(
                  'home.about.lead',
                  'We at Omni Virtual Solutions believe in employee autonomy as a pivotal component of corporate success. On the other hand, delicately balancing it w/ proper oversight w/o crossing over to the realm of micro management is something that every business needs to consider.'
                )}
              </p>
            </div>

            <div className="about-callout-card">
              <div className="callout-tag" data-block-key="home.about.callout_tag">
                {t('home.about.callout_tag', "That's where we come in.")}
              </div>
              <p className="callout-body" data-block-key="home.about.callout">
                {t(
                  'home.about.callout',
                  "We hire only the most qualified Virtual specialists to get the job done for you so you can focus on the essentials that contribute to your organization's sustainability and industry superiority."
                )}
              </p>
            </div>

            <div className="about-points-list">
              <div className="about-point-card">
                <div className="point-icon-box">
                  <i className="bi bi-person-check-fill"></i>
                </div>
                <div className="point-text">
                  <p data-block-key="home.about.point1">
                    {t(
                      'home.about.point1',
                      "We're staffed with the most experienced and competent managers and supervisors who take care in monitoring the performance, attendance, and general demeanor of your virtual specialists on-site."
                    )}
                  </p>
                </div>
              </div>

              <div className="about-point-card">
                <div className="point-icon-box">
                  <i className="bi bi-headset"></i>
                </div>
                <div className="point-text">
                  <p data-block-key="home.about.point2">
                    {t(
                      'home.about.point2',
                      'From Sales (from Lead generation to Closer) to Customer Service (phone, chat, email) and everything else in between, we got your operational needs covered 24/7.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
