import React, { useState, useEffect } from 'react';
import { useCms } from '../context/CmsContext';

export default function Contact() {
  const { company, t } = useCms();

  // Business email is dynamic: pulled from database company profile or CMS, fallback to default
  const businessEmail = company?.email || t('footer.email', 'admin@omnivirtualsolution.com');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service_interest: '',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState({ type: '', message: '', link: '' });
  const [copied, setCopied] = useState(false);

  const serviceOptions = [
    { id: '1', label: 'Publishing Packages' },
    { id: '2', label: 'Editorial Evaluation' },
    { id: '3', label: 'Book Marketing' },
    { id: '4', label: 'Custom Virtual Assistance' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const buildEmailContent = () => {
    const selectedService = serviceOptions.find((s) => s.id === formData.service_interest)?.label || '';
    const emailSubject =
      formData.subject.trim() ||
      (selectedService
        ? `${selectedService} Inquiry — ${formData.name.trim()}`
        : `Website Inquiry from ${formData.name.trim()}`);

    const lines = [
      `Hi Omni Virtual Solutions Team,`,
      ``,
      `Name: ${formData.name.trim()}`,
      formData.email.trim() ? `Email: ${formData.email.trim()}` : null,
      formData.phone.trim() ? `Phone: ${formData.phone.trim()}` : null,
      selectedService ? `Service of Interest: ${selectedService}` : null,
      ``,
      `Message:`,
      formData.message.trim(),
    ].filter((l) => l !== null);

    return {
      subject: emailSubject,
      body: lines.join('\n'),
    };
  };

  const handleSendViaGmail = (e) => {
    if (e) e.preventDefault();

    if (!formData.name.trim() || !formData.message.trim()) {
      setStatus({
        type: 'danger',
        message: 'Please provide your Name and Message before sending.',
        link: '',
      });
      return;
    }

    const { subject, body } = buildEmailContent();

    // Construct direct Gmail Web Compose URL
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      businessEmail
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Optional background log to admin database so inquiry shows in Leads CRM
    try {
      fetch('/api/v1/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.name.trim(),
          name: formData.name.trim(),
          email: formData.email.trim() || 'visitor@direct-mail.com',
          phone: formData.phone.trim(),
          subject,
          message: formData.message.trim(),
          service_interest_id: formData.service_interest ? parseInt(formData.service_interest, 10) : null,
          direct_mail: true,
        }),
      }).catch(() => {});
    } catch (_) {}

    // Open Gmail web compose ONLY in a new tab
    const newTab = window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    if (!newTab) {
      // In case popup blocker prevents window.open, trigger via simulated link
      const a = document.createElement('a');
      a.href = gmailUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    setStatus({
      type: 'success',
      message: 'Gmail opened in a new tab with your pre-filled draft! Simply click Send in Gmail.',
      link: gmailUrl,
    });
  };

  const handleSendDefaultMail = () => {
    if (!formData.name.trim() || !formData.message.trim()) {
      setStatus({
        type: 'danger',
        message: 'Please provide your Name and Message before sending.',
        link: '',
      });
      return;
    }

    const { subject, body } = buildEmailContent();
    const mailtoUrl = `mailto:${encodeURIComponent(businessEmail)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoUrl;

    setStatus({
      type: 'success',
      message: 'Launching your default email app with your message pre-filled.',
      link: mailtoUrl,
    });
  };

  const handleCopyEmail = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(businessEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <section id="contact" className="contact section contact-redesign">
      <div className="container" data-aos="fade-up" data-aos-delay="100">
        <div className="text-center">
          <div className="contact-pill-badge">
            <span>✦ GET IN TOUCH</span>
          </div>
          <h2 className="contact-section-heading">Contact Our Team</h2>
          <div className="contact-heading-divider"></div>
        </div>

        <div className="row gy-4 mt-2">
          {/* Contact Info Column */}
          <div className="col-lg-5" data-aos="fade-right" data-aos-delay="150">
            <div className="contact-info-card">
              <div className="contact-info-icon">
                <i className="bi bi-geo-alt-fill"></i>
              </div>
              <div className="contact-info-content">
                <h4>Our Headquarters</h4>
                <p data-block-key="footer.address">
                  {t('footer.address', '1350 Ave of the Americas, Fl 2 -1100 New York, NY 10019')}
                </p>
              </div>
            </div>

            <div className="contact-info-card">
              <div className="contact-info-icon">
                <i className="bi bi-envelope-fill"></i>
              </div>
              <div className="contact-info-content">
                <h4>Email Inquiries</h4>
                <p>
                  <a
                    href={`mailto:${businessEmail}`}
                    style={{ color: '#eba22d', textDecoration: 'none', fontWeight: 600 }}
                  >
                    {businessEmail}
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="btn btn-sm btn-link p-0 ms-2 text-muted"
                    title="Copy Email"
                    style={{ fontSize: '13px', textDecoration: 'none' }}
                  >
                    <i className={copied ? 'bi bi-check-lg text-success' : 'bi bi-clipboard'}></i>
                    <span className="ms-1" style={{ fontSize: '11px' }}>
                      {copied ? 'Copied' : 'Copy'}
                    </span>
                  </button>
                </p>
              </div>
            </div>

            <div className="contact-info-card">
              <div className="contact-info-icon">
                <i className="bi bi-telephone-fill"></i>
              </div>
              <div className="contact-info-content">
                <h4>Phone Support</h4>
                <p>
                  <a
                    href={`tel:${t('footer.phone', '+1 315-915-4799')}`}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                    data-block-key="footer.phone"
                  >
                    {t('footer.phone', '+1 315-915-4799')}
                  </a>
                </p>
              </div>
            </div>

            <div className="contact-info-card">
              <div className="contact-info-icon">
                <i className="bi bi-clock-fill"></i>
              </div>
              <div className="contact-info-content">
                <h4>Operating Hours</h4>
                <p>
                  Monday – Friday: 9:00 AM – 6:00 PM EST
                  <br />
                  24/7 Virtual Specialist Operations
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form Column */}
          <div className="col-lg-7" data-aos="fade-left" data-aos-delay="200">
            <div className="contact-form-card">
              <form onSubmit={handleSendViaGmail} noValidate>
                <div className="row gy-3">
                  <div className="col-md-6">
                    <label className="form-label">
                      Your Name <span className="text-warning">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Your Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="john@example.com (optional)"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-control"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Service of Interest</label>
                    <select
                      name="service_interest"
                      className="form-select"
                      value={formData.service_interest}
                      onChange={handleChange}
                    >
                      <option value="">Select a Service (Optional)</option>
                      {serviceOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      className="form-control"
                      placeholder="Project Inquiry / Consultation"
                      value={formData.subject}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">
                      Message <span className="text-warning">*</span>
                    </label>
                    <textarea
                      name="message"
                      className="form-control"
                      rows="4"
                      placeholder="Tell us about your project or workforce needs..."
                      value={formData.message}
                      onChange={handleChange}
                      required
                    ></textarea>
                  </div>

                  {status.message && (
                    <div className="col-12">
                      <div className={`alert alert-${status.type}`} role="alert">
                        <div>{status.message}</div>
                        {status.link && (
                          <div className="mt-2" style={{ fontSize: '13px' }}>
                            <a
                              href={status.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-decoration-underline fw-bold"
                              style={{ color: 'inherit' }}
                            >
                              Click here if Gmail didn't open automatically &rarr;
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="col-12 mt-2">
                    <button type="submit" className="contact-btn-submit">
                      <i className="bi bi-google"></i>
                      <span>Send via Gmail</span>
                      <i className="bi bi-box-arrow-up-right ms-1" style={{ fontSize: '13px' }}></i>
                    </button>
                  </div>

                  <div className="col-12">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleSendDefaultMail}
                        className="btn btn-sm btn-outline-secondary"
                        style={{
                          borderRadius: '8px',
                          fontSize: '12.5px',
                          borderColor: 'rgba(255, 255, 255, 0.15)',
                          color: '#a0aec0',
                        }}
                      >
                        <i className="bi bi-envelope me-1"></i> Open Default Mail App
                      </button>

                      <div className="d-flex align-items-center gap-1" style={{ fontSize: '12px', color: '#718096' }}>
                        <span>Delivering to:</span>
                        <span className="text-warning fw-semibold">{businessEmail}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
