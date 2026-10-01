---
name: login-security-mastery
description: >-
  Use this skill whenever building, reviewing, or hardening a login page,
  signup flow, password reset flow, or session/auth layer. Covers passkeys
  (recommended default), password hashing, MFA, session management, rate
  limiting, enumeration prevention, CSRF, and the full OWASP/NIST 800-63B-4
  pre-ship checklist. Trigger on: "build/secure a login", "add auth/MFA/2FA/
  passkeys", "prevent brute force", "review this auth code", or any task
  touching password storage, sessions, tokens, or login forms.
---

# Login Page Security Mastery Skill

## Purpose
Use this skill whenever building, reviewing, or hardening a login page, signup flow,
password reset flow, or session/auth layer. Aligned with current (2026) consensus:
NIST SP 800-63B-4, the OWASP Authentication/Session Management/Password Storage
cheat sheets, and WebAuthn L3. The single biggest shift in this space in the last
few years is **passkeys becoming the recommended default**, not an optional add-on
-- this skill treats them that way rather than as a bonus feature bolted onto a
password form.

## When to trigger
- "build/secure a login page" / "add authentication" / "review this auth code"
- "add MFA / 2FA / passkeys"
- "prevent brute force / bot logins"
- "the login form leaks whether an email exists" or similar security review requests
- Any task touching password storage, sessions, tokens, or login forms

---

## 1. Threat model

Before writing code, know what you are protecting against. Most real-world
authentication breaches are:

- **Credential stuffing**: replay of breached username/password pairs from other sites.
- **Phishing**: fake login page captures the password; modern kits proxy the real
  login in real time and capture the session cookie even after MFA completes.
  Passkeys are cryptographically bound to the real domain and cannot be phished.
- **Brute force / automated bot login attempts** against the login endpoint.
- **Session hijacking**: valid session cookie/token stolen via XSS, insecure transport,
  or an unprotected intermediate request.
- **Account enumeration**: attacker learns which emails have accounts via different
  error messages or timing.
- **Weak server-side enforcement**: client-side-only checks that do not stop an attacker
  calling the API directly.

---

## 2. Transport & cookie basics

- HTTPS everywhere, no exceptions. Not just the login form -- every page and
  every subsequent request.
- HSTS enabled so browsers refuse to downgrade to HTTP.
- Session cookies: Secure (HTTPS-only), HttpOnly (unreachable by JS), SameSite=Lax
  or Strict (blocks most CSRF).
- Never put session tokens in URLs -- they end up in logs, browser history, and
  referrer headers.

---

## 3. Passkeys -- make them the default, not an extra option

- A passkey is cryptographically bound to the domain it was registered on.
  It CANNOT be used on a phishing lookalike domain.
- Offer passkey signup/login as the primary path. Keep password + MFA as a fallback.
- Allow users to register multiple passkeys (phone, laptop, security key).
- Give users a passkey management page to view, name, and revoke registered passkeys.
- Implementation: WebAuthn (navigator.credentials.create / .get). Use a maintained
  library (SimpleWebAuthn) rather than implementing the ceremony by hand.

---

## 4. Password handling (when passwords are still supported)

- Hash with argon2id -- the current OWASP recommendation. Never MD5, SHA1, or
  unsalted/weakly-salted hashes.

  Example (Node.js):
    await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

- Require length (12+ chars minimum) over arbitrary complexity rules.
- Do NOT force periodic password rotation with no evidence of compromise.
- Check new passwords against a known-breached-password list (Have I Been Pwned
  k-anonymity range search) and reject matches.
- Never log passwords, even accidentally via request logging.
- Let password managers work: do not disable paste in password fields; do not set
  autocomplete="off" on auth fields.

---

## 5. MFA and step-up authentication

- Prefer passkeys/hardware security keys > authenticator-app TOTP > SMS/email OTP
  (SMS is the weakest; SIM-swapping and interception make it unreliable).
- Step-up authentication: require MFA at login and again for sensitive actions
  (changing recovery email, rotating API key, changing password, making a payment).
- Adaptive/risk-based authentication: re-evaluate risk during a session -- a login
  from a new device/location can trigger a re-auth prompt even mid-session.

---

## 6. Session management

- Rotate the session identifier on login (and on privilege change, e.g. after MFA).
  Never keep a pre-auth session ID valid post-auth (prevents session fixation).
- Short-lived access tokens + refresh tokens over one long-lived static session.
- Logout must actually invalidate server-side state. JWTs need a revocation
  mechanism (short expiry + refresh token revocation, or server-side session lookup).
- Give users visibility into active sessions/devices and a way to revoke any remotely.
- Expire idle sessions after a reasonable period.

---

## 7. Defending the login endpoint

- Rate-limit login attempts per-account AND per-IP.
  Per-account alone does not stop credential stuffing across many accounts.
  Per-IP alone does not stop distributed attempts.
- Prefer exponential backoff over a hard account lockout (hard lockout is itself
  an attack vector -- an attacker can lock a victim out deliberately).
- Consider adaptive CAPTCHA triggered after repeated failures, not on every login.
- Detect credential-stuffing patterns: many distinct accounts from one source,
  or the same password tried across many usernames.

---

## 8. Preventing account enumeration

- Login and "forgot password" error messages must be identical regardless of whether
  the account exists:
    "If an account exists for this email, a reset link has been sent."
- Avoid timing differences: hashing always takes consistent time -- do not
  short-circuit before the hash comparison in a way that leaks timing.
- Signup flows have the same issue ("this email is already registered") -- a
  verification-email-based flow sidesteps it entirely.

---

## 9. CSRF protection

- For cookie-based sessions: SameSite=Lax/Strict handles most CSRF in modern
  browsers. Pair with an explicit CSRF token for defense in depth.
- Token-based auth (Bearer tokens in headers, not cookies) is not CSRF-vulnerable
  the same way since a malicious site cannot attach another origin Authorization header.

---

## 10. Server-side enforcement

- Every check must be re-validated server-side. Client-side form validation,
  disabled buttons, and hidden fields are UX conveniences, not security controls.
- Authorization checks belong in the service/data layer, not just gated behind
  a hidden UI element.
- Validate and sanitize all auth-related input server-side.

---

## 11. Logging & monitoring

- Log authentication events (login success/failure, password changes, MFA changes,
  session revocation) with enough context to investigate -- but NEVER log passwords,
  tokens, or full session identifiers.
- Alert on anomalous patterns: spike in failed logins, logins from unusual geographies,
  rapid account creation from one source.
- Keep an audit trail for sensitive account changes (email/password change, MFA changes).

---

## 12. Pre-ship checklist

- [ ] HTTPS enforced everywhere; HSTS enabled
- [ ] Session cookies set Secure, HttpOnly, and SameSite
- [ ] Passwords hashed with argon2id (or current-recommended bcrypt work factor)
- [ ] New passwords checked against a known-breached-password list
- [ ] Passkey registration/login supported and offered as the default path,
      with multiple-passkey support
- [ ] MFA available, passkeys/hardware keys preferred over SMS;
      step-up auth on sensitive actions
- [ ] Session ID rotated on login; logout actually invalidates server-side state
- [ ] Login endpoint rate-limited per-account and per-IP with backoff
- [ ] Login and password-reset responses identical whether or not account exists
- [ ] CSRF protection in place for cookie-authenticated state-changing requests
- [ ] All validation and authorization enforced server-side, not just in the UI
- [ ] Auth events logged (without logging secrets) and anomalies alertable
- [ ] Password managers not actively blocked (autofill/paste allowed)

---

## 13. Reference resources

- OWASP Authentication Cheat Sheet
  https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Password Storage Cheat Sheet
  https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- OWASP Session Management Cheat Sheet
  https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- NIST SP 800-63B (Digital Identity Guidelines -- Authentication)
  https://pages.nist.gov/800-63-3/sp800-63b.html
- WebAuthn Level 3 (W3C) -- https://www.w3.org/TR/webauthn-3/
- web.dev Passkeys deployment checklist -- https://web.dev/articles/passkey-checklist
- Have I Been Pwned Passwords API -- https://haveibeenpwned.com/API/v3#PwnedPasswords
