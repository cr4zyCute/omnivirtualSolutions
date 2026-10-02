import React, { useState, useEffect } from 'react';
import { useCms } from '../context/CmsContext';

export default function Contact() {
  const { t } = useCms();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service_interest: '',
    subject: '',
    message: '',
    website: '', // honeypot
  });
  const [loadTime, setLoadTime] = useState(Date.now());
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoadTime(Date.now());
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setStatus({ type: 'danger', message: 'Please fill in all required fields (Name, Email, Message).' });
      return;
    }

    setSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await fetch('/api/v1/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.name,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject || 'General Inquiry',
          message: formData.message,
          service_interest_id: formData.service_interest ? parseInt(formData.service_interest, 10) : null,
          service_interest: formData.service_interest,
          website: formData.website,
          _form_load_time: loadTime,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus({
          type: 'success',
          message: data.message || 'Thank you! Your message has been sent successfully. We will get back to you shortly.',
        });
        setFormData({
          name: '',
          email: '',
          phone: '',
          service_interest: '',
          subject: '',
          message: '',
          website: '',
        });
        setLoadTime(Date.now());
      } else {
        setStatus({
          type: 'danger',
          message: data.error?.message || 'Failed to submit form. Please try again or email us directly.',
        });
      }
    } catch (err) {
      setStatus({
        type: 'danger',
        message: 'Network error. Please try again later or contact us at admin@omnivirtualsolution.com',
      });
    } finally {
      setSubmitting(false);
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
                    href={`mailto:${t('footer.email', 'admin@omnivirtualsolution.com')}`}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                    data-block-key="footer.email"
                  >
                    {t('footer.email', 'admin@omnivirtualsolution.com')}
                  </a>
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
              <form onSubmit={handleSubmit} noValidate>
                {/* Honeypot for bot protection */}
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  tabIndex="-1"
                  autoComplete="off"
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    pointerEvents: 'none',
                    height: 0,
                    width: 0,
                  }}
                  aria-hidden="true"
                />

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
                    <label className="form-label">
                      Your Email <span className="text-warning">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
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
                      <option value="1">Publishing Packages</option>
                      <option value="2">Editorial Evaluation</option>
                      <option value="3">Book Marketing</option>
                      <option value="4">Custom Virtual Assistance</option>
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
                        {status.message}
                      </div>
                    </div>
                  )}

                  <div className="col-12 mt-2">
                    <button
                      type="submit"
                      className="contact-btn-submit"
                      disabled={submitting}
                    >
                      <span>{submitting ? 'Sending...' : 'Send Message'}</span>
                      <i className="bi bi-arrow-right ms-2"></i>
                    </button>
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
