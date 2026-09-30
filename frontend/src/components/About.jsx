import React from 'react';
import { useCms } from '../context/CmsContext';
import './About.css';

const stats = [
  { icon: 'bi-people-fill',     value: '200+',  label: 'Clients Served'    },
  { icon: 'bi-clock-fill',      value: '24/7',  label: 'Operations'        },
  { icon: 'bi-star-fill',       value: '5★',    label: 'Satisfaction Rate' },
  { icon: 'bi-globe2',          value: '10+',   label: 'Industries Served' },
];

const pillars = [
  {
    icon: 'bi-shield-fill-check',
    title: 'Autonomy with Oversight',
    body: 'We believe in employee autonomy as a pivotal component of corporate success — carefully balanced with the right level of oversight, without crossing into micro-management.',
  },
  {
    icon: 'bi-people-fill',
    title: 'Elite Virtual Specialists',
    body: 'We hire only the most qualified virtual professionals so you can focus on what matters — the essentials that drive your organization\'s sustainability and industry superiority.',
  },
  {
    icon: 'bi-headset',
    title: 'Full-Spectrum Coverage',
    body: 'From lead generation to customer service — phone, chat, and email — we cover every operational touchpoint, 24 hours a day, 7 days a week.',
  },
];

export default function About() {
  const { t } = useCms();

  React.useEffect(() => {
    if (window.AOS) {
      window.AOS.refresh();
    }
  }, []);

  return (
    <section id="about" className="about-v2">
      {/* ── Background decoration with single moving highlight circle ── */}
      <div className="about-v2-bg" aria-hidden="true">
        <div className="about-v2-glow glow-1" />
        <div className="about-v2-glow glow-2" />
        <div className="about-v2-grid" />
      </div>

      <div className="container about-v2-inner">

        {/* ════ TOP: Eyebrow + Headline ════ */}
        <div className="about-v2-head" data-aos="fade-up" data-aos-delay="100">
          <span className="about-v2-eyebrow">
            <i className="bi bi-stars" />
            {t('home.about.badge', 'Who We Are')}
          </span>
          <h2 className="about-v2-title" data-block-key="home.about.heading">
            {t('home.about.heading',
              <>Built on Trust,<br /><em>Driven by Excellence.</em></>
            )}
          </h2>
          <p className="about-v2-lead" data-block-key="home.about.lead">
            {t(
              'home.about.lead',
              'Omni Virtual Solutions pairs world-class virtual talent with robust management systems — so your business runs smoothly while you stay focused on growth.'
            )}
          </p>
        </div>

        {/* ════ MIDDLE: Image + Pillars ════ */}
        <div className="about-v2-body">

          {/* Image stack */}
          <div className="about-v2-visual" data-aos="fade-right" data-aos-delay="150">
            <div className="about-v2-img-frame">
              <img
                src={t('home.about.image', '/assets/img/about_team.jpg')}
                alt="Omni Virtual Solutions team at work"
                className="about-v2-img"
                data-block-key="home.about.image"
              />
              <div className="about-v2-img-overlay" />
            </div>

            {/* Floating badge */}
            <div className="about-v2-float-badge">
              <div className="float-badge-icon">
                <i className="bi bi-patch-check-fill" />
              </div>
              <div className="float-badge-text">
                <strong>Balanced</strong>
                <span>Autonomy &amp; Oversight</span>
              </div>
            </div>

            {/* Corner accent tag */}
            <div className="about-v2-corner-tag">
              <i className="bi bi-clock-history" />
              <span>24 / 7</span>
              <small>Operations</small>
            </div>
          </div>

          {/* Pillar cards */}
          <div className="about-v2-pillars">
            {pillars.map((p, i) => (
              <div
                className="about-pillar-card"
                key={i}
                data-aos="fade-left"
                data-aos-delay={200 + i * 100}
                style={{ '--delay': `${i * 80}ms` }}
              >
                <div className="pillar-icon">
                  <i className={`bi ${p.icon}`} />
                </div>
                <div className="pillar-body">
                  <h3 className="pillar-title">{p.title}</h3>
                  <p className="pillar-text">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ════ BOTTOM: Stats strip ════ */}
        <div className="about-v2-stats" data-aos="fade-up" data-aos-delay="250">
          {stats.map((s, i) => (
            <div
              className="about-stat-item"
              key={i}
              data-aos="zoom-in"
              data-aos-delay={300 + i * 75}
            >
              <div className="stat-icon-ring">
                <i className={`bi ${s.icon}`} />
              </div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
