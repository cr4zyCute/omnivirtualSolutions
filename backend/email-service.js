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

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
      <div style="background: #0d1117; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #eba22d; font-size: 20px; margin: 0;">✦ New Website Inquiry</h1>
        <p style="color: #8a9cb8; font-size: 13px; margin: 6px 0 0 0;">Omni Virtual Solutions — Contact Form Submission</p>
      </div>
      <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 12px; font-weight: 700; color: #374151; width: 140px; border-bottom: 1px solid #f3f4f6;">From</td>
            <td style="padding: 8px 12px; color: #111827; border-bottom: 1px solid #f3f4f6;">${submission.full_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: 700; color: #374151; border-bottom: 1px solid #f3f4f6;">Email</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6;"><a href="mailto:${submission.email}" style="color: #eba22d;">${submission.email}</a></td>
          </tr>
          ${submission.phone ? `<tr><td style="padding: 8px 12px; font-weight: 700; color: #374151; border-bottom: 1px solid #f3f4f6;">Phone</td><td style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6;">${submission.phone}</td></tr>` : ""}
          <tr>
            <td style="padding: 8px 12px; font-weight: 700; color: #374151; border-bottom: 1px solid #f3f4f6;">Subject</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6;">${submission.subject || "General Inquiry"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: 700; color: #374151; vertical-align: top;">Message</td>
            <td style="padding: 8px 12px; color: #1f2937; line-height: 1.6;">${(submission.message || "").replace(/\n/g, "<br>")}</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding: 14px 16px; background: #f3f4f6; border-radius: 6px; font-size: 13px; color: #6b7280;">
          Received: ${submission.created_at || new Date().toISOString()} &nbsp;|&nbsp; IP: ${submission.ip_address || "unknown"}
        </div>
        ${settings.admin_url && !settings.admin_url.includes("localhost") ? `
        <div style="margin-top: 16px; text-align: center;">
          <a href="${settings.admin_url}" style="background: #eba22d; color: #0d1117; padding: 10px 22px; border-radius: 6px; font-size: 14px; font-weight: 700; text-decoration: none; display: inline-block;">View in Admin Dashboard →</a>
        </div>` : ""}
      </div>
    </div>
  `;

  const senderName  = settings.sender_name  || "Omni Virtual Solutions";
  const senderEmail = settings.sender_email?.trim() || settings.recipient_email?.trim() || settings.smtp_user?.trim();
  if (senderEmail && senderEmail.toLowerCase().includes("nsixx631")) {
    console.warn("[email-service] Notification blocked: legacy email sender detected");
    return { success: false, reason: "legacy_sender_blocked" };
  }

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

  try {
    await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: submission.email,
      subject,
      text: bodyText,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${bodyText.replace(/\n/g, "<br>")}</div>`,
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

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0d1117; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="color: #eba22d; margin: 0; font-size: 18px;">✦ Omni Virtual Solutions</h2>
      </div>
      <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; line-height: 1.7; color: #1f2937;">
        ${fullBody.replace(/\n/g, "<br>")}
      </div>
      <div style="padding: 12px 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; font-size: 12px; color: #9ca3af; border-radius: 0 0 8px 8px;">
        This message is in response to your inquiry submitted at omnivirtualsolution.com
      </div>
    </div>
  `;

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

module.exports = {
  sendNewSubmissionNotification,
  sendAutoReply,
  sendReply,
  testSmtpConnection,
  getEmailStats,
  getSettings,
  interpolate,
};
