// =================================================================
// backend/email-service.js  —  Nodemailer Email Service
// =================================================================
// Reads SMTP config from email_settings table.
// Never exposes credentials to the client.
// Graceful failure: database record is always primary; email is secondary.
// =================================================================

const nodemailer = require("nodemailer");
const { db } = require("./db");

// ── Load all email settings from DB ──────────────────────────────
async function getSettings() {
  try {
    const result = await db.execute("SELECT setting_key, setting_value FROM email_settings");
    const settings = {};
    result.rows.forEach((r) => {
      settings[r.setting_key] = r.setting_value;
    });
    return settings;
  } catch (err) {
    console.error("[email-service] Failed to load settings:", err.message);
    return {};
  }
}

// ── Create transporter from current DB settings ───────────────────
async function createTransporter(settings) {
  const host = settings.smtp_host?.trim();
  const user = settings.smtp_user?.trim();
  const pass = settings.smtp_pass?.trim();

  if (!host || !user || !pass) {
    return null; // SMTP not configured
  }

  // Prevent any sending from legacy email
  if (user.toLowerCase().includes("nsixx631")) {
    console.warn("[email-service] Blocked attempt to send using legacy email nsixx631@gmail.com");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(settings.smtp_port || "587", 10),
    secure: settings.smtp_secure === "true",
    auth: { user, pass },
    tls: { rejectUnauthorized: false }, // allow self-signed for local testing
  });
}

// ── Interpolate template variables ───────────────────────────────
function interpolate(template, vars) {
  let result = template || "";
  Object.entries(vars).forEach(([k, v]) => {
    result = result.replaceAll(`{${k}}`, v || "");
  });
  return result;
}

// ── Log email attempt to DB ───────────────────────────────────────
async function logEmail({ eventType, submissionId, recipientEmail, subject, status, errorMessage }) {
  try {
    await db.execute({
      sql: `INSERT INTO email_log (event_type, submission_id, recipient_email, subject, status, error_message)
            VALUES (?,?,?,?,?,?)`,
      args: [eventType, submissionId || null, recipientEmail || null, subject || null, status, errorMessage || null],
    });
  } catch (err) {
    console.error("[email-service] Failed to write email log:", err.message);
  }
}

// ── Update contact_submissions email_notify_status ────────────────
async function updateNotifyStatus(submissionId, status) {
  try {
    await db.execute({
      sql: "UPDATE contact_submissions SET email_notify_status = ? WHERE id = ?",
      args: [status, submissionId],
    });
  } catch (_) {}
}

// ── Visual Design Template Builders (Compliant with Email Visual Design Skill) ──

function buildEmailShell({ title, heroPill, heroTitle, heroSubtitle, bodyContent, ctaText, ctaUrl, footerNote, supportEmail }) {
  const brandGold = "#eba22d";
  const darkNavy  = "#0d1117";
  const footerBg  = "#0f172a";
  const emailTo   = supportEmail || "nikkisixxacosta083@gmail.com";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title || "Omni Virtual Solutions"}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; min-width: 100%; background-color: #f3f4f6; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .mobile-p { padding: 20px 16px !important; }
      .mobile-h1 { font-size: 22px !important; line-height: 28px !important; }
      .mobile-btn { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">
    ${heroTitle} — Omni Virtual Solutions
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3f4f6">
    <tr>
      <td align="center" style="padding: 28px 12px 36px 12px;">
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06); border: 1px solid #e5e7eb;">
          
          <!-- 1. Header -->
          <tr>
            <td bgcolor="${darkNavy}" style="padding: 24px 32px; border-bottom: 3px solid ${brandGold};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; display: inline-block;">
                      <span style="color: ${brandGold};">✦</span> Omni Virtual Solutions
                    </span>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 4px; letter-spacing: 0.3px; text-transform: uppercase;">
                      Empowering Individuals &amp; Businesses
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 2. Hero Headline -->
          <tr>
            <td class="mobile-p" style="padding: 32px 32px 18px 32px; background-color: #ffffff;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    ${heroPill || ""}
                    <h1 class="mobile-h1" style="margin: 0 0 10px 0; font-size: 25px; line-height: 32px; font-weight: 800; color: #0f172a;">
                      ${heroTitle}
                    </h1>
                    ${heroSubtitle ? `<p style="margin: 0; font-size: 15px; line-height: 24px; color: #475569;">${heroSubtitle}</p>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 3. Body Content -->
          <tr>
            <td class="mobile-p" style="padding: 0 32px 24px 32px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- 4. Primary CTA -->
          ${ctaText && ctaUrl ? `
          <tr>
            <td class="mobile-p" align="center" style="padding: 6px 32px 32px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="${brandGold}" style="border-radius: 8px;">
                    <a href="${ctaUrl}" target="_blank" class="mobile-btn" style="background-color: ${brandGold}; color: #0d1117; font-size: 14.5px; font-weight: 700; text-decoration: none; padding: 13px 32px; border-radius: 8px; display: inline-block; letter-spacing: 0.2px;">
                      ${ctaText} &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : ""}

          <!-- 5. Footer -->
          <tr>
            <td bgcolor="${footerBg}" style="padding: 24px 32px; color: #94a3b8; font-size: 12px; line-height: 20px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
              <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #f1f5f9;">
                Omni Virtual Solutions
              </p>
              <p style="margin: 0 0 8px 0; color: #94a3b8;">
                1350 Ave of the Americas, Fl 2 -1100, New York, NY 10019<br>
                Phone: <a href="tel:+13159154799" style="color: ${brandGold}; text-decoration: none;">+1 315-915-4799</a> &nbsp;|&nbsp; Email: <a href="mailto:${emailTo}" style="color: ${brandGold}; text-decoration: none;">${emailTo}</a>
              </p>
              <p style="margin: 0; color: #64748b; font-size: 11px;">
                ${footerNote || "© 2026 Omni Virtual Solutions. All rights reserved."}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildAutoReplyHtml({ submission, settings, bodyText, senderEmail }) {
  const customerName = submission.full_name || "Valued Client";
  const inquirySubject = submission.subject || "General Inquiry";
  const submissionDate = submission.created_at || new Date().toLocaleString("en-US", { timeZoneName: "short" });
  const rawMessage = (submission.message || "").trim();
  const messageExcerpt = rawMessage.length > 320 ? rawMessage.substring(0, 320) + "..." : rawMessage;
  const siteUrl = "https://omnivirtualsolution.com";

  const heroPill = `
    <div style="display: inline-block; background-color: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 700; color: #15803d; margin-bottom: 14px;">
      ✓ Inquiry Received
    </div>`;

  const bodyContent = `
    <div style="background-color: #f8fafc; border-left: 4px solid #eba22d; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; line-height: 22px; color: #334155;">
        <strong>Expected turnaround:</strong> We typically respond within <strong>1–2 business days</strong>. If your request is time-sensitive, you can also reach our desk at <a href="tel:+13159154799" style="color: #d97706; text-decoration: none; font-weight: 600;">+1 315-915-4799</a>.
      </p>
    </div>

    <!-- Message Summary Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 8px;">
      <tr>
        <td style="padding: 12px 16px; background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
          Inquiry Summary
        </td>
      </tr>
      <tr>
        <td style="padding: 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13.5px; color: #334155;">
            <tr>
              <td width="115" style="padding: 6px 0; font-weight: 600; color: #64748b; vertical-align: top;">Subject:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${inquirySubject}</td>
            </tr>
            <tr>
              <td width="115" style="padding: 6px 0; font-weight: 600; color: #64748b; vertical-align: top;">Submitted At:</td>
              <td style="padding: 6px 0; color: #0f172a;">${submissionDate}</td>
            </tr>
            ${messageExcerpt ? `
            <tr>
              <td width="115" style="padding: 6px 0; font-weight: 600; color: #64748b; vertical-align: top;">Your Message:</td>
              <td style="padding: 6px 0; color: #334155; line-height: 1.6; font-style: italic;">
                "${messageExcerpt.replace(/</g, "&lt;").replace(/>/g, "&gt;")}"
              </td>
            </tr>` : ""}
          </table>
        </td>
      </tr>
    </table>
  `;

  return buildEmailShell({
    title: "We received your message — Omni Virtual Solutions",
    heroPill,
    heroTitle: "We received your message!",
    heroSubtitle: `Hello <strong style="color: #0f172a;">${customerName}</strong>, thank you for contacting Omni Virtual Solutions. Our team is already reviewing your inquiry.`,
    bodyContent,
    ctaText: "Visit Omni Virtual Solutions",
    ctaUrl: siteUrl,
    footerNote: "You are receiving this confirmation because an inquiry was submitted with your email on omnivirtualsolution.com.",
    supportEmail: senderEmail
  });
}

function buildReplyHtml({ submission, settings, fullBody, senderEmail }) {
  const customerName = submission.full_name || "Valued Client";
  const inquirySubject = submission.subject || "Your Inquiry";
  const siteUrl = "https://omnivirtualsolution.com";

  const heroPill = `
    <div style="display: inline-block; background-color: rgba(235, 162, 45, 0.15); border: 1px solid rgba(235, 162, 45, 0.3); border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 700; color: #b45309; margin-bottom: 14px;">
      ● Team Response
    </div>`;

  const bodyContent = `
    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px 22px; font-size: 15px; line-height: 1.7; color: #1f2937; margin-bottom: 20px;">
      ${fullBody.replace(/\n/g, "<br>")}
    </div>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #64748b;">
      <strong>Regarding:</strong> ${inquirySubject} &nbsp;|&nbsp; Submitted by ${customerName}
    </div>
  `;

  return buildEmailShell({
    title: `Re: ${inquirySubject} — Omni Virtual Solutions`,
    heroPill,
    heroTitle: `Response to: ${inquirySubject}`,
    heroSubtitle: `A message from the team at Omni Virtual Solutions for ${customerName}.`,
    bodyContent,
    ctaText: "Visit Our Website",
    ctaUrl: siteUrl,
    footerNote: "This message was sent in direct response to your inquiry submitted at omnivirtualsolution.com.",
    supportEmail: senderEmail
  });
}

function buildNotificationHtml({ submission, settings, senderEmail, recipientEmail }) {
  const adminUrl = settings.admin_url && !settings.admin_url.includes("localhost") ? settings.admin_url : "https://omnivirtualsolution.com/admin";

  const heroPill = `
    <div style="display: inline-block; background-color: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 700; color: #1d4ed8; margin-bottom: 14px;">
      ● New Website Lead
    </div>`;

  const bodyContent = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 16px;">
      <tr>
        <td style="padding: 12px 16px; background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
          Lead Details
        </td>
      </tr>
      <tr>
        <td style="padding: 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 14px; color: #334155;">
            <tr>
              <td width="110" style="padding: 8px 0; font-weight: 700; color: #64748b;">From:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${submission.full_name}</td>
            </tr>
            <tr>
              <td width="110" style="padding: 8px 0; font-weight: 700; color: #64748b;">Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${submission.email}" style="color: #eba22d; font-weight: 600; text-decoration: none;">${submission.email}</a></td>
            </tr>
            ${submission.phone ? `
            <tr>
              <td width="110" style="padding: 8px 0; font-weight: 700; color: #64748b;">Phone:</td>
              <td style="padding: 8px 0; color: #0f172a;">${submission.phone}</td>
            </tr>` : ""}
            <tr>
              <td width="110" style="padding: 8px 0; font-weight: 700; color: #64748b;">Subject:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${submission.subject || "General Inquiry"}</td>
            </tr>
            <tr>
              <td width="110" style="padding: 8px 0; font-weight: 700; color: #64748b; vertical-align: top;">Message:</td>
              <td style="padding: 8px 0; color: #1e293b; line-height: 1.6;">${(submission.message || "").replace(/\n/g, "<br>")}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="background-color: #f8fafc; border-radius: 6px; padding: 12px 16px; font-size: 12.5px; color: #64748b;">
      Received: ${submission.created_at || new Date().toISOString()} &nbsp;|&nbsp; IP: ${submission.ip_address || "unknown"}
    </div>
  `;

  return buildEmailShell({
    title: `New Inquiry from ${submission.full_name}`,
    heroPill,
    heroTitle: "New Website Contact Inquiry",
    heroSubtitle: `You have received a new inquiry submitted via the website contact form.`,
    bodyContent,
    ctaText: "Open Admin Leads Dashboard",
    ctaUrl: adminUrl,
    footerNote: "Automated administrative notification dispatched by Omni Virtual Solutions CMS.",
    supportEmail: senderEmail
  });
}

// =================================================================
// MAIN: Send notification to admin when a new contact form is submitted
// =================================================================
async function sendNewSubmissionNotification(submission) {
  const settings = await getSettings();

  // Check if notifications are enabled
  if (settings.email_notifications_enabled !== "true") {
    await updateNotifyStatus(submission.id, "skipped");
    return { success: false, reason: "notifications_disabled" };
  }

  if (settings.notification_pref === "off") {
    await updateNotifyStatus(submission.id, "skipped");
    return { success: false, reason: "preference_off" };
  }

  const recipientEmail = settings.recipient_email?.trim();
  if (!recipientEmail) {
    await updateNotifyStatus(submission.id, "skipped");
    return { success: false, reason: "no_recipient_email" };
  }

  const transporter = await createTransporter(settings);
  if (!transporter) {
    await updateNotifyStatus(submission.id, "failed");
    await logEmail({
      eventType: "new_submission_notify",
      submissionId: submission.id,
      recipientEmail,
      subject: "(not sent — SMTP not configured)",
      status: "failed",
      errorMessage: "SMTP not configured. Set smtp_host, smtp_user, smtp_pass in Email Settings.",
    });
    return { success: false, reason: "smtp_not_configured" };
  }

  const subjectTemplate = settings.notification_subject || "New Website Inquiry — {customer_name}";
  const subject = interpolate(subjectTemplate, { customer_name: submission.full_name });

  const senderName  = settings.sender_name  || "Omni Virtual Solutions";
  const senderEmail = settings.sender_email?.trim() || settings.recipient_email?.trim() || settings.smtp_user?.trim();
  if (senderEmail && senderEmail.toLowerCase().includes("nsixx631")) {
    console.warn("[email-service] Notification blocked: legacy email sender detected");
    return { success: false, reason: "legacy_sender_blocked" };
  }

  const htmlBody = buildNotificationHtml({ submission, settings, senderEmail, recipientEmail });

  try {
    await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to:   recipientEmail,
      replyTo: submission.email,
      subject,
      html: htmlBody,
      text: `New inquiry from ${submission.full_name} (${submission.email})\n\nSubject: ${submission.subject || "General Inquiry"}\n\nMessage:\n${submission.message}`,
    });

    await updateNotifyStatus(submission.id, "sent");
    await logEmail({ eventType: "new_submission_notify", submissionId: submission.id, recipientEmail, subject, status: "sent" });
    console.log(`[email] Notification sent for submission #${submission.id} → ${recipientEmail}`);
    return { success: true };
  } catch (err) {
    const errMsg = err.message;
    await updateNotifyStatus(submission.id, "failed");
    await logEmail({ eventType: "new_submission_notify", submissionId: submission.id, recipientEmail, subject, status: "failed", errorMessage: errMsg });
    console.error(`[email] Notification FAILED for submission #${submission.id}:`, errMsg);
    return { success: false, reason: errMsg };
  }
}

// =================================================================
// Send auto-reply acknowledgment to visitor after form submission
// =================================================================
async function sendAutoReply(submission) {
  const settings = await getSettings();
  if (settings.auto_reply_enabled !== "true") return { success: false, reason: "auto_reply_disabled" };

  if (!submission.email || submission.email.includes("direct-mail.com") || submission.email.includes("example.com")) {
    return { success: false, reason: "invalid_visitor_email" };
  }

  const transporter = await createTransporter(settings);
  if (!transporter) return { success: false, reason: "smtp_not_configured" };

  const subject = interpolate(settings.auto_reply_subject || "We received your message", { customer_name: submission.full_name });
  const bodyText = interpolate(settings.auto_reply_body || "Hello {customer_name}, thank you for contacting us!", { customer_name: submission.full_name });

  const senderName  = settings.sender_name  || "Omni Virtual Solutions";
  const senderEmail = settings.sender_email?.trim() || settings.recipient_email?.trim() || settings.smtp_user?.trim();
  if (senderEmail && senderEmail.toLowerCase().includes("nsixx631")) {
    console.warn("[email-service] Auto-reply blocked: legacy email sender detected");
    return { success: false, reason: "legacy_sender_blocked" };
  }

  const htmlBody = buildAutoReplyHtml({ submission, settings, bodyText, senderEmail });

  try {
    await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: submission.email,
      subject,
      text: bodyText,
      html: htmlBody,
    });
    await logEmail({ eventType: "auto_reply", submissionId: submission.id, recipientEmail: submission.email, subject, status: "sent" });
    return { success: true };
  } catch (err) {
    await logEmail({ eventType: "auto_reply", submissionId: submission.id, recipientEmail: submission.email, subject, status: "failed", errorMessage: err.message });
    return { success: false, reason: err.message };
  }
}

// =================================================================
// Send admin reply to visitor
// =================================================================
async function sendReply({ submission, replyBody, replyId, sentBy }) {
  const settings = await getSettings();
  const transporter = await createTransporter(settings);

  const senderName  = settings.sender_name  || "Omni Virtual Solutions";
  const senderEmail = settings.sender_email?.trim() || settings.recipient_email?.trim() || settings.smtp_user?.trim();
  if (senderEmail && senderEmail.toLowerCase().includes("nsixx631")) {
    console.warn("[email-service] Reply blocked: legacy email sender detected");
    return { success: false, reason: "legacy_sender_blocked" };
  }
  const subject     = `Re: ${submission.subject || "Your Inquiry"} — Omni Virtual Solutions`;

  if (!transporter) {
    await db.execute({
      sql: "UPDATE contact_replies SET email_sent = 0, email_error = ? WHERE id = ?",
      args: ["SMTP not configured", replyId],
    });
    await logEmail({ eventType: "reply_sent", submissionId: submission.id, recipientEmail: submission.email, subject, status: "failed", errorMessage: "SMTP not configured" });
    return { success: false, reason: "smtp_not_configured" };
  }

  // Apply reply template
  const template = settings.reply_template || "Hello {customer_name},\n\n{reply_body}\n\nBest regards,\nOmni Virtual Solutions";
  const fullBody = interpolate(template, { customer_name: submission.full_name, reply_body: replyBody });

  const htmlBody = buildReplyHtml({ submission, settings, fullBody, senderEmail });

  try {
    await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to:   submission.email,
      replyTo: senderEmail,
      subject,
      text: fullBody,
      html: htmlBody,
    });

    await db.execute({
      sql: "UPDATE contact_replies SET email_sent = 1 WHERE id = ?",
      args: [replyId],
    });
    await logEmail({ eventType: "reply_sent", submissionId: submission.id, recipientEmail: submission.email, subject, status: "sent" });
    return { success: true };
  } catch (err) {
    await db.execute({
      sql: "UPDATE contact_replies SET email_sent = 0, email_error = ? WHERE id = ?",
      args: [err.message, replyId],
    });
    await logEmail({ eventType: "reply_sent", submissionId: submission.id, recipientEmail: submission.email, subject, status: "failed", errorMessage: err.message });
    return { success: false, reason: err.message };
  }
}

// =================================================================
// Test SMTP connection (for settings page)
// =================================================================
async function testSmtpConnection(testSettings) {
  const transporter = await createTransporter(testSettings);
  if (!transporter) return { success: false, reason: "Incomplete SMTP credentials" };
  try {
    await transporter.verify();
    return { success: true };
  } catch (err) {
    return { success: false, reason: err.message };
  }
}

// =================================================================
// Get email usage stats
// =================================================================
async function getEmailStats() {
  try {
    const [total, sent, failed, skipped] = await Promise.all([
      db.execute("SELECT COUNT(*) AS n FROM email_log"),
      db.execute("SELECT COUNT(*) AS n FROM email_log WHERE status = 'sent'"),
      db.execute("SELECT COUNT(*) AS n FROM email_log WHERE status = 'failed'"),
      db.execute("SELECT COUNT(*) AS n FROM email_log WHERE status = 'skipped'"),
    ]);
    return {
      total:   total.rows[0].n,
      sent:    sent.rows[0].n,
      failed:  failed.rows[0].n,
      skipped: skipped.rows[0].n,
    };
  } catch (_) {
    return { total: 0, sent: 0, failed: 0, skipped: 0 };
  }
}

// =================================================================
// 24-Hour Quota & Delivery Strategy Engine
// =================================================================
async function getQuotaStatus() {
  try {
    const settings = await getSettings();
    const strategy = settings.delivery_strategy || "smart_auto"; // 'smart_auto' | 'force_smtp' | 'force_popup'
    const limit = parseInt(settings.daily_quota_limit || "500", 10);

    // Count sent emails in rolling 24 hours
    const resCount = await db.execute({
      sql: `SELECT COUNT(*) AS n FROM email_log 
            WHERE status = 'sent' 
            AND datetime(sent_at) >= datetime('now', '-24 hours')`,
    });
    const sent24h = Number(resCount.rows?.[0]?.n || 0);

    // Check if Google rejected recently due to quota/daily limit
    const resLimitErr = await db.execute({
      sql: `SELECT id, error_message FROM email_log 
            WHERE status = 'failed' 
            AND datetime(sent_at) >= datetime('now', '-4 hours')
            AND (
              lower(error_message) LIKE '%daily%limit%' 
              OR lower(error_message) LIKE '%quota%' 
              OR lower(error_message) LIKE '%550%5.4.5%'
              OR lower(error_message) LIKE '%user-sending limit%'
            )
            ORDER BY id DESC LIMIT 1`,
    });
    const googleLimitHit = Boolean(resLimitErr.rows && resLimitErr.rows.length > 0);

    const isExceeded = sent24h >= limit || googleLimitHit;
    const remaining = Math.max(0, limit - sent24h);

    const shouldUsePopupFallback = strategy === "force_popup" || (strategy === "smart_auto" && isExceeded);
    const canSendSmtp = strategy !== "force_popup" && (!isExceeded || strategy === "force_smtp");

    return {
      strategy,
      limit,
      sent24h,
      remaining,
      isExceeded,
      googleLimitHit,
      canSendSmtp,
      shouldUsePopupFallback,
    };
  } catch (err) {
    console.error("[email-service] getQuotaStatus error:", err.message);
    return {
      strategy: "smart_auto",
      limit: 500,
      sent24h: 0,
      remaining: 500,
      isExceeded: false,
      googleLimitHit: false,
      canSendSmtp: true,
      shouldUsePopupFallback: false,
    };
  }
}

module.exports = {
  sendNewSubmissionNotification,
  sendAutoReply,
  sendReply,
  testSmtpConnection,
  getEmailStats,
  getQuotaStatus,
  getSettings,
  interpolate,
};
