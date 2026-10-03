/**
 * =================================================================
 * assets/js/cms-sync.js — Omni Virtual Solutions Universal Live CMS
 * =================================================================
 * 1. Fetches current content blocks from DB (/api/v1/site-meta) and
 *    injects them into any DOM element with [data-block-key].
 * 2. Connects to SSE (/api/v1/live) for real-time live synchronization.
 * 3. Handles in-place live editing for ANY page (Homepage, Services, etc.)
 *    when in admin session, inside editor iframe, or with ?edit=1.
 * 4. Auto-saves changes to the database on blur and debounced input.
 * =================================================================
 */

(function () {
  'use strict';

  // ── 1. Admin & Edit Mode Detection ──────────────────────────────
  const urlParams = new URLSearchParams(window.location.search);
  const isEditParam = urlParams.get('edit') === '1' || urlParams.get('admin') === '1';

  let token = localStorage.getItem('omni_admin_token') || sessionStorage.getItem('omni_admin_token');
  const isInsideIframe = window.parent && window.parent !== window;

  if (!token && isInsideIframe) {
    try {
      token = window.parent.localStorage.getItem('omni_admin_token') || window.parent.sessionStorage.getItem('omni_admin_token');
    } catch (_) {}
  }

  // Inside admin iframe or with ?edit=1 or with valid token -> Admin Edit Mode
  const isInsideAdminDashboard = isInsideIframe;
  const isAdmin = Boolean(token || isEditParam || isInsideAdminDashboard);
  let isEditMode = isAdmin;

  const debounceTimers = {};
  const boundElements = new WeakSet();

  // ── Track Page Visit Telemetry (Real-time to SQLite) ───────────
  if (!isInsideIframe && !window.location.pathname.startsWith('/admin')) {
    try {
      fetch('/api/v1/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: window.location.pathname,
          referrer: document.referrer || 'direct'
        })
      }).catch(function(){});
    } catch (_) {}
  }

  // ── 2. Apply content block to DOM element ────────────────────────
  function applyBlock(key, value, type) {
    if (value === undefined || value === null) return;
    const elements = document.querySelectorAll(`[data-block-key="${key}"]`);
    elements.forEach((el) => {
      // Don't overwrite if actively being edited
      if (document.activeElement === el) return;

      if (key === 'home.cta.trust_tags') {
        try {
          const tags = typeof value === 'string' ? JSON.parse(value) : value;
          if (Array.isArray(tags)) {
            el.innerHTML = tags.map(t => `
              <span class="trust-item"><i class="bi ${t.icon || 'bi-check-circle'}"></i> ${t.text || ''}</span>
            `).join('');
            el.classList.add('cms-live-pulsing');
            setTimeout(() => el.classList.remove('cms-live-pulsing'), 1200);
            return;
          }
        } catch (_) {}
      }

      if (el.tagName.toLowerCase() === 'img') {
        const path = value.startsWith('/') ? value.slice(1) : value;
        el.src = path;
      } else {
        if (value.includes('\n')) {
          el.innerHTML = value.replace(/\n/g, '<br>');
        } else {
          el.textContent = value;
        }
      }

      el.classList.add('cms-live-pulsing');
      setTimeout(() => el.classList.remove('cms-live-pulsing'), 1200);
    });
  }

  // ── 3. Auto-assign data-block-key to service sections ────────────
  function setupServiceBlockKeys() {
    const contentArea = document.querySelector('.content') || document.querySelector('main') || document.body;
    if (!contentArea) return;

    // Scan all sections inside content or root
    const sections = contentArea.querySelectorAll('section');
    sections.forEach((sec) => {
      const secId = (sec.id || 'general').replace(/-section$/, '').toLowerCase();

      // Tag Headings
      sec.querySelectorAll('h1, h2, h3, h4, h5').forEach((heading, idx) => {
        if (!heading.hasAttribute('data-block-key')) {
          // Check if it has a child <b> that already has a key
          const childB = heading.querySelector('b[data-block-key]');
          if (!childB) {
            heading.setAttribute('data-block-key', `service.${secId}.h_${idx}`);
          }
        }
      });

      // Tag Paragraphs and Spans
      sec.querySelectorAll('p, blockquote, span').forEach((textEl, idx) => {
        const text = textEl.textContent.trim();
        // Skip tiny labels, icons, or if inside an already tagged element
        if (text.length > 12 && !textEl.hasAttribute('data-block-key')) {
          const parentTagged = textEl.parentElement?.closest('[data-block-key]');
          if (!parentTagged) {
            const tag = textEl.tagName.toLowerCase();
            textEl.setAttribute('data-block-key', `service.${secId}.${tag}_${idx}`);
          }
        }
      });
    });
  }

  // ── 4. Load initial content from DB via /api/v1/site-meta ────────
  async function loadInitialContent() {
    try {
      const res = await fetch('/api/v1/site-meta');
      if (!res.ok) return;
      const data = await res.json();

      if (data.blockMap) {
        Object.entries(data.blockMap).forEach(([key, val]) => {
          applyBlock(key, val);
        });
      }
    } catch (err) {
      console.warn('[cms-sync] Could not load initial DB content:', err.message);
    }
  }

  // ── 5. Save Block to Database ────────────────────────────────────
  async function saveBlock(key, value) {
    // Always refresh token from local or parent storage
    token = localStorage.getItem('omni_admin_token') || sessionStorage.getItem('omni_admin_token');
    if (!token && isInsideIframe) {
      try {
        token = window.parent.localStorage.getItem('omni_admin_token') || window.parent.sessionStorage.getItem('omni_admin_token');
      } catch (_) {}
    }

    updateStatus('saving');

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;

      const res = await fetch(`/api/v1/cms/blocks/${encodeURIComponent(key)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ value }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        updateStatus('saved');
        showToast(`Saved: ${key}`);
      } else {
        updateStatus('error');
      }
    } catch (err) {
      updateStatus('error');
    }
  }

  // ── 6. In-Place Live Editing Engine ──────────────────────────────
  function attachEditableListeners() {
    const editables = document.querySelectorAll('[data-block-key]');
    editables.forEach((el) => {
      if (boundElements.has(el)) return;
      boundElements.add(el);

      const key = el.getAttribute('data-block-key');

      if (el.tagName.toLowerCase() === 'img') {
        el.title = `Click to change image (${key})`;
        el.addEventListener('click', (e) => {
          if (!isEditMode) return;
          e.preventDefault();
          e.stopPropagation();
          promptImageUpload(key, el);
        });
      } else {
        el.contentEditable = isEditMode ? 'true' : 'false';
        el.spellcheck = false;

        // Prevent link navigation when clicking inside content in edit mode
        el.addEventListener('click', (e) => {
          if (isEditMode) {
            // Allow clicking to focus, but stop link navigation
            const anchor = el.tagName.toLowerCase() === 'a' ? el : el.closest('a');
            if (anchor) e.preventDefault();
          }
        });

        // Auto-save on blur
        el.addEventListener('blur', () => {
          if (!isEditMode) return;
          const val = el.innerText.trim();
          saveBlock(key, val);
        });

        // Debounced auto-save on typing (800ms)
        el.addEventListener('input', () => {
          if (!isEditMode) return;
          updateStatus('saving');
          clearTimeout(debounceTimers[key]);
          debounceTimers[key] = setTimeout(() => {
            const val = el.innerText.trim();
            saveBlock(key, val);
          }, 800);
        });
      }
    });

    // Also disable clicking on links within content during edit mode
    if (isEditMode) {
      document.querySelectorAll('.content a, section a').forEach((a) => {
        if (!a.classList.contains('content-link')) {
          a.addEventListener('click', (e) => {
            if (isEditMode && a.getAttribute('href')?.startsWith('#')) {
              e.preventDefault();
            }
          });
        }
      });
    }
  }

  function initLiveEditor() {
    if (!isAdmin) return;

    document.body.classList.add('is-admin-session', 'mode-edit');
    attachEditableListeners();
    injectFloatingBar();
  }

  // Public hook to refresh editables when switching sections/tabs
  window.__omniRefreshLiveEditor = function () {
    setupServiceBlockKeys();
    if (isEditMode) {
      document.body.classList.add('is-admin-session', 'mode-edit');
      attachEditableListeners();
    }
  };

  // ── 7. Image Upload ──────────────────────────────────────────────
  function promptImageUpload(blockKey, imgEl) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('image', file);
      formData.append('block_key', blockKey);

      showToast('Uploading new photo...');
      try {
        const headers = {};
        if (token) headers['Authorization'] = 'Bearer ' + token;

        const res = await fetch('/api/v1/cms/upload', {
          method: 'POST',
          headers,
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.success) {
          imgEl.src = data.path;
          showToast('Photo updated successfully!');
        } else {
          alert('Upload failed: ' + (data.error?.message || 'Error'));
        }
      } catch (err) {
        alert('Upload error: ' + err.message);
      }
    };
    input.click();
  }

  // ── 8. Status Bar & Indicators ───────────────────────────────────
  function injectFloatingBar() {
    if (document.getElementById('omniLiveAdminBar')) return;

    const bar = document.createElement('div');
    bar.id = 'omniLiveAdminBar';

    if (isInsideIframe) {
      // In iframe: Render a sleek, non-intrusive floating indicator pill
      bar.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-weight:700; color:#eba22d; font-size:11.5px; background:rgba(235,162,45,0.18); padding:3px 8px; border-radius:4px; border:1px solid rgba(235,162,45,0.35);">
            ✦ LIVE IN-PLACE EDITOR
          </span>
          <span id="omniBarStatus" style="font-size:11.5px; color:#48bb78; display:flex; align-items:center; gap:5px;">
            <span style="width:7px; height:7px; background:#48bb78; border-radius:50%; display:inline-block;"></span> Click any text to edit
          </span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button id="toggleEditBtn" style="background:#eba22d; color:#0d1117; border:none; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">
            ✏️ Edit Mode: ON
          </button>
        </div>
      `;
      bar.setAttribute('style', `
        position: fixed;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(14, 18, 23, 0.94);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(235, 162, 45, 0.4);
        border-radius: 30px;
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 6px 16px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        box-shadow: 0 8px 30px rgba(0,0,0,0.6);
      `);
    } else {
      // Top bar for standalone viewing
      bar.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-weight:700; color:#eba22d; font-size:12px; background:rgba(235,162,45,0.15); padding:3px 8px; border-radius:4px; border:1px solid rgba(235,162,45,0.3);">
            ✦ OMNI CMS
          </span>
          <span id="omniBarStatus" style="font-size:11.5px; color:#48bb78; display:flex; align-items:center; gap:5px;">
            <span style="width:7px; height:7px; background:#48bb78; border-radius:50%; display:inline-block;"></span> All changes saved
          </span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button id="toggleEditBtn" style="background:#eba22d; color:#0d1117; border:none; padding:4px 10px; border-radius:6px; font-size:11.5px; font-weight:700; cursor:pointer;">
            ✏️ Edit Mode: ON
          </button>
          <a href="admin/" style="background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.15); padding:4px 10px; border-radius:6px; font-size:11.5px; text-decoration:none; font-weight:600;">
            Dashboard &rarr;
          </a>
        </div>
      `;
      bar.setAttribute('style', `
        position: fixed;
        top: 0; left: 0; right: 0;
        height: 40px;
        background: rgba(14, 18, 23, 0.96);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(235, 162, 45, 0.35);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        box-shadow: 0 4px 16px rgba(0,0,0,0.5);
      `);
      document.body.style.paddingTop = '40px';
    }

    document.body.appendChild(bar);

    const toggleBtn = bar.querySelector('#toggleEditBtn');
    if (toggleBtn) {
      toggleBtn.onclick = () => {
        isEditMode = !isEditMode;
        document.body.classList.toggle('mode-edit', isEditMode);
        document.body.classList.toggle('mode-preview', !isEditMode);
        toggleBtn.textContent = isEditMode ? '✏️ Edit Mode: ON' : '👁️ Visitor Preview';
        toggleBtn.style.background = isEditMode ? '#eba22d' : 'rgba(255,255,255,0.1)';
        toggleBtn.style.color = isEditMode ? '#0d1117' : '#fff';

        document.querySelectorAll('[data-block-key]').forEach((el) => {
          if (el.tagName.toLowerCase() !== 'img') {
            el.contentEditable = isEditMode ? 'true' : 'false';
          }
        });
        showToast(isEditMode ? 'Edit Mode active' : 'Visitor Preview active');
      };
    }
  }

  function updateStatus(state) {
    const el = document.getElementById('omniBarStatus') || document.getElementById('editorSaveStatus');
    if (el) {
      if (state === 'saving') {
        el.style.color = '#eba22d';
        el.innerHTML = '<span class="spinner-border spinner-border-sm me-1" style="width:10px;height:10px;border-width:2px;display:inline-block;"></span> Saving to database...';
      } else if (state === 'saved') {
        el.style.color = '#48bb78';
        el.innerHTML = '<span style="width:7px; height:7px; background:#48bb78; border-radius:50%; display:inline-block;"></span> All changes saved';
      } else {
        el.style.color = '#f56565';
        el.innerHTML = '⚠️ Save failed';
      }
    }

    // Also notify parent iframe container if present
    if (isInsideIframe) {
      try {
        window.parent.postMessage({ type: 'CMS_STATUS', status: state }, '*');
      } catch (_) {}
    }
  }

  function showToast(msg) {
    let toast = document.getElementById('omniUniversalToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'omniUniversalToast';
      toast.setAttribute('style', `
        position: fixed;
        bottom: 24px; right: 24px;
        background: #141922;
        border: 1px solid rgba(235, 162, 45, 0.4);
        color: #fff;
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 13px;
        z-index: 9999999;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        transition: all 0.3s ease;
        display: none;
      `);
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => { if (toast) toast.style.display = 'none'; }, 2400);
  }

  // ── 9. Connect to real-time Server-Sent Events (SSE) ────────────
  function connectLiveSync() {
    if (!window.EventSource) return;

    let sse;
    function initSSE() {
      try {
        sse = new EventSource('/api/v1/live');
        sse.addEventListener('change', (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.table === 'content_blocks' && data.key) {
              applyBlock(data.key, data.value, data.blockType);
            }
          } catch (_) {}
        });
        sse.onerror = () => {
          sse.close();
          setTimeout(initSSE, 5000);
        };
      } catch (_) {
        setTimeout(initSSE, 5000);
      }
    }
    initSSE();
  }

  // ── 10. Handle Contact Form submission ──────────────────────────
  function setupContactForm() {
    const form = document.getElementById('omniContactForm');
    if (!form) return;

    // Set form load timestamp for bot timing detection
    const loadTimeField = document.getElementById('_form_load_time');
    if (loadTimeField) loadTimeField.value = Date.now();

    const alertBox = document.getElementById('contactAlert');
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name    = form.querySelector('[name="name"]')?.value.trim();
      const email   = form.querySelector('[name="email"]')?.value.trim();
      const phone   = form.querySelector('[name="phone"]')?.value.trim();
      const subject = form.querySelector('[name="subject"]')?.value.trim();
      const message = form.querySelector('[name="message"]')?.value.trim();
      const serviceInterest = form.querySelector('[name="service_interest"]')?.value;
      const website = form.querySelector('[name="website"]')?.value; // honeypot
      const formLoadTime = form.querySelector('[name="_form_load_time"]')?.value;

      if (!name || !message) {
        showAlert('Please fill in your name and message.', 'danger');
        return;
      }

      const targetEmail = document.querySelector('[data-block-key="footer.email"]')?.textContent?.trim() || 'admin@omnivirtualsolution.com';
      const serviceSelect = form.querySelector('[name="service_interest"]');
      const serviceText = serviceSelect?.options[serviceSelect.selectedIndex]?.text;
      const cleanService = serviceText && !serviceText.includes('Select a Service') ? serviceText : '';

      const emailSubject = subject || (cleanService ? `${cleanService} Inquiry — ${name}` : `Website Inquiry from ${name}`);
      const bodyLines = [
        `Hi Omni Virtual Solutions Team,`,
        ``,
        `Name: ${name}`,
        email ? `Email: ${email}` : null,
        phone ? `Phone: ${phone}` : null,
        cleanService ? `Service of Interest: ${cleanService}` : null,
        ``,
        `Message:`,
        message,
      ].filter(l => l !== null);
      const emailBody = bodyLines.join('\n');

      const submitBtn = form.querySelector('button[type="submit"]');
      const origBtnContent = submitBtn ? submitBtn.innerHTML : 'Send Message';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Sending...';
      }

      let resData = null;
      try {
        const response = await fetch('/api/v1/contact/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: name,
            name,
            email: email || 'visitor@direct-mail.com',
            phone,
            subject: emailSubject,
            message,
            service_interest_id: serviceInterest ? parseInt(serviceInterest, 10) : null,
            form_load_time: formLoadTime,
            website,
          }),
        });
        resData = await response.json();
      } catch (err) {
        console.error('[contact] Submit network error:', err);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origBtnContent;
        }
      }

      if (resData && resData.success) {
        form.reset();

        if (resData.mode === 'popup_fallback') {
          // Quota reached or admin forced popup mode: open Gmail popup fallback
          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
          const width = 680;
          const height = 740;
          const screenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
          const screenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;
          const innerWidth = window.innerWidth || document.documentElement.clientWidth || screen.width;
          const innerHeight = window.innerHeight || document.documentElement.clientHeight || screen.height;
          const left = Math.max(0, Math.round(screenLeft + (innerWidth - width) / 2));
          const top = Math.max(0, Math.round(screenTop + (innerHeight - height) / 2));
          const features = `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`;
          const popupWin = window.open(gmailUrl, 'OmniGmailCompose', features);
          if (popupWin && popupWin.focus) popupWin.focus();

          showAlert(`
            <div style="font-weight:700; font-size:14px; margin-bottom:4px;">
              <i class="bi bi-info-circle-fill me-1"></i> Direct Gmail Compose Fallback Opened
            </div>
            <div>${resData.message || 'Daily automated limit reached. Please review and click <strong>Send</strong> inside the popup.'}</div>
            <div class="mt-2" style="font-size:12.5px;">
              Delivering to: <strong style="color:#fef08a;">${targetEmail}</strong>
              &nbsp;|&nbsp;
              <a href="#" onclick="window.open('${gmailUrl}','OmniGmailCompose','${features}');return false;" class="text-white text-decoration-underline fw-bold">Re-open Popup &rarr;</a>
            </div>
          `, 'warning');
        } else {
          // Standard Background Mode: show modern 5s auto-closing modal
          showSuccessModal(name, email);
        }
      } else {
        showAlert(resData?.error?.message || 'Failed to send your message. Please try again.', 'danger');
      }
    });

    function showSuccessModal(clientName, clientEmail) {
      const existing = document.getElementById('omniSuccessModal');
      if (existing) existing.remove();

      const modalEl = document.createElement('div');
      modalEl.id = 'omniSuccessModal';
      modalEl.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(10, 15, 29, 0.78);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        opacity: 0;
        transition: opacity 0.3s ease;
        padding: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      `;

      modalEl.innerHTML = `
        <div style="
          background: #0d1117;
          border: 1px solid rgba(235, 162, 45, 0.45);
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.65), 0 0 35px rgba(235, 162, 45, 0.18);
          border-radius: 16px;
          max-width: 480px;
          width: 100%;
          padding: 34px 28px;
          text-align: center;
          position: relative;
          color: #f1f5f9;
          transform: scale(0.92);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        ">
          <!-- Animated Checkmark Icon -->
          <div style="
            width: 70px;
            height: 70px;
            margin: 0 auto 18px;
            background: rgba(34, 197, 94, 0.15);
            border: 2px solid #22c55e;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #22c55e;
            font-size: 32px;
            font-weight: 800;
          ">
            ✓
          </div>

          <h3 style="margin: 0 0 8px; font-size: 23px; font-weight: 800; color: #ffffff; letter-spacing: 0.2px;">
            Message Sent Successfully!
          </h3>

          <p style="margin: 0 0 16px; font-size: 14.5px; line-height: 23px; color: #94a3b8;">
            Thank you, <strong style="color: #eba22d;">${clientName || 'Valued Client'}</strong>! We have received your inquiry and sent an automated confirmation to <strong style="color: #ffffff;">${clientEmail || 'your email'}</strong>.
          </p>

          <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 10px 14px; font-size: 12.5px; color: #cbd5e1; margin-bottom: 22px;">
            ⏱ Our team typically responds within <strong>1–2 business days</strong>.
          </div>

          <!-- Countdown and Progress bar -->
          <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; margin-bottom: 6px;">
              <span>Auto-closing in <strong id="modalCountdown" style="color: #eba22d;">5</strong>s</span>
              <span style="font-weight: 600;">Omni Virtual Solutions</span>
            </div>
            <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
              <div id="modalProgressBar" style="height: 100%; width: 100%; background: #eba22d; transition: width 5s linear;"></div>
            </div>
          </div>

          <button id="modalCloseBtn" style="
            background: #eba22d;
            color: #0d1117;
            border: none;
            border-radius: 8px;
            padding: 10px 28px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
          " onmouseover="this.style.background='#f59e0b'" onmouseout="this.style.background='#eba22d'">
            Close Window
          </button>
        </div>
      `;

      document.body.appendChild(modalEl);

      requestAnimationFrame(() => {
        modalEl.style.opacity = '1';
        modalEl.querySelector('div').style.transform = 'scale(1)';
        const bar = document.getElementById('modalProgressBar');
        if (bar) setTimeout(() => { bar.style.width = '0%'; }, 50);
      });

      let secondsLeft = 5;
      const countEl = document.getElementById('modalCountdown');
      const interval = setInterval(() => {
        secondsLeft -= 1;
        if (countEl) countEl.textContent = Math.max(0, secondsLeft);
        if (secondsLeft <= 0) {
          clearInterval(interval);
          closeModal();
        }
      }, 1000);

      function closeModal() {
        clearInterval(interval);
        modalEl.style.opacity = '0';
        modalEl.querySelector('div').style.transform = 'scale(0.92)';
        setTimeout(() => modalEl.remove(), 300);
      }

      document.getElementById('modalCloseBtn')?.addEventListener('click', closeModal);
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) closeModal();
      });
    }

    function showAlert(msg, type) {
      if (!alertBox) { alert(msg); return; }
      alertBox.className = `alert alert-${type} mt-3 mb-0`;
      alertBox.innerHTML = msg;
      alertBox.classList.remove('d-none');
      if (type === 'success') setTimeout(() => alertBox.classList.add('d-none'), 8000);
    }
  }

  // ── 11. Inject Editor Styles ───────────────────────────────────
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .cms-live-pulsing {
        animation: cmsPulseGlow 1.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      @keyframes cmsPulseGlow {
        0% { outline: 2px solid rgba(200, 149, 74, 0); }
        30% { outline: 2px solid rgba(200, 149, 74, 0.8); background-color: rgba(200, 149, 74, 0.1); border-radius: 4px; }
        100% { outline: 2px solid rgba(200, 149, 74, 0); }
      }
      body.mode-edit [data-block-key] {
        outline: 2px dashed rgba(235, 162, 45, 0.6) !important;
        outline-offset: 3px !important;
        border-radius: 4px !important;
        cursor: text !important;
        transition: outline 0.15s, background-color 0.15s !important;
        min-height: 1.2em;
        display: inline-block;
      }
      body.mode-edit p[data-block-key],
      body.mode-edit h1[data-block-key],
      body.mode-edit h2[data-block-key],
      body.mode-edit h3[data-block-key],
      body.mode-edit h4[data-block-key],
      body.mode-edit h5[data-block-key] {
        display: block !important;
      }
      body.mode-edit [data-block-key]:hover {
        outline: 2px solid #eba22d !important;
        background-color: rgba(235, 162, 45, 0.12) !important;
      }
      body.mode-edit [data-block-key]:focus {
        outline: 2px solid #eba22d !important;
        background-color: rgba(235, 162, 45, 0.18) !important;
      }
      body.mode-edit img[data-block-key] {
        cursor: pointer !important;
        display: inline-block !important;
      }
      body.mode-preview [data-block-key] {
        outline: none !important;
        cursor: default !important;
        background-color: transparent !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ── Init ───────────────────────────────────────────────────────
  function init() {
    injectStyles();
    setupServiceBlockKeys();
    loadInitialContent();
    connectLiveSync();
    setupContactForm();
    if (isAdmin) initLiveEditor();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
