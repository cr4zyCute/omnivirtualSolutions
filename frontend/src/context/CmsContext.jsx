import React, { createContext, useContext, useState, useEffect } from 'react';

const CmsContext = createContext({
  blocks: {},
  stats: {},
  company: {},
  books: [],
  loading: true,
  t: (key, fallback) => fallback,
});

export const CmsProvider = ({ children }) => {
  const [blocks, setBlocks] = useState({});
  const [stats, setStats] = useState({});
  const [company, setCompany] = useState({});
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch initial metadata
  useEffect(() => {
    let isMounted = true;
    const fetchMeta = async () => {
      try {
        const res = await fetch('/api/v1/site-meta');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.blockMap) setBlocks(data.blockMap);
            if (data.company) setCompany(data.company);
            if (data.showcase_books && data.showcase_books.length > 0) {
              setBooks(data.showcase_books);
            }
            if (data.stats && Array.isArray(data.stats)) {
              const statMap = {};
              data.stats.forEach((s) => {
                statMap[s.stat_key] = s.stat_value;
              });
              setStats((prev) => ({ ...prev, ...statMap }));
            }
          }
        }
      } catch (err) {
        // Fallback gracefully to default static text
        console.warn('[CMS] Running in standalone/fallback mode:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMeta();

    // 2. Real-time Live SSE Listener
    let eventSource = null;
    try {
      eventSource = new EventSource('/api/v1/live');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'cms_block_updated' && data.key) {
            setBlocks((prev) => {
              const updated = { ...prev, [data.key]: data.value };
              if (data.key === 'services.cta.email' || data.key === 'footer.email') {
                updated['services.cta.email'] = data.value;
                updated['footer.email'] = data.value;
              }
              return updated;
            });
            if (data.key === 'services.cta.email' || data.key === 'footer.email') {
              setCompany((prev) => ({ ...prev, email: data.value, recipient_email: data.value }));
            }
          } else if (data.type === 'stats_updated' && data.key) {
            setStats((prev) => ({ ...prev, [data.key]: data.value }));
          } else if (data.type === 'company_updated' && data.company) {
            setCompany((prev) => ({ ...prev, ...data.company }));
            if (data.company.email) {
              setBlocks((prev) => ({
                ...prev,
                'footer.email': data.company.email,
                'services.cta.email': data.company.email,
              }));
            }
          } else if (data.type === 'email_settings_updated' && data.recipient_email) {
            setCompany((prev) => ({ ...prev, email: data.recipient_email, recipient_email: data.recipient_email }));
            setBlocks((prev) => ({
              ...prev,
              'footer.email': data.recipient_email,
              'services.cta.email': data.recipient_email,
            }));
          }
        } catch (_) {}
      };
    } catch (_) {}

    return () => {
      isMounted = false;
      if (eventSource) eventSource.close();
    };
  }, []);

  const t = (key, fallback = '') => {
    if (blocks[key] !== undefined && blocks[key] !== null) {
      return blocks[key];
    }
    return fallback;
  };

  return (
    <CmsContext.Provider value={{ blocks, stats, company, books, loading, t }}>
      {children}
    </CmsContext.Provider>
  );
};

export const useCms = () => useContext(CmsContext);
