import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CmsProvider } from './context/CmsContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollTop from './components/ScrollTop';
import Home from './pages/Home';
import ServicesPage from './pages/ServicesPage';
import './App.css';

// Automatically scrolls to top on route change
function ScrollToTopOnNavigate() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

export default function App() {
  useEffect(() => {
    // Initialize AOS animations if present in window
    if (window.AOS) {
      window.AOS.init({
        duration: 600,
        easing: 'ease-in-out',
        once: true,
        mirror: false,
      });
    }
  }, []);

  return (
    <CmsProvider>
      <Router>
        <ScrollToTopOnNavigate />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/index.html" element={<Navigate to="/" replace />} />
          <Route path="/services.html" element={<Navigate to="/services" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
        <ScrollTop />
      </Router>
    </CmsProvider>
  );
}
