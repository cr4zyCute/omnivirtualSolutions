---
name: fullstack-backend-engineering
description: >-
  Use whenever a task involves the backend of a website or app — APIs,
  databases, auth, business logic, infrastructure, or anything beyond what the browser renders.
  Written to senior/staff-level production standards.
---

# Full-Stack & Backend Engineering Skill (Senior/Staff-level)

## Purpose
Use this skill whenever a task involves the **backend** of a website or app — APIs,
databases, auth, business logic, infrastructure, or anything beyond what the browser
renders. Written to the standard of a senior/staff engineer (20+ years, production
systems at scale) — favor boring, proven, maintainable choices over clever ones.

## When to trigger
- "build an API / backend / server for this"
- "add a database", "add authentication", "add payments"
- "how should I architect this system"
- "review this backend code / API design"
- any request producing server-side code, schemas, migrations, or infra config

---

## 1. Engineering philosophy

- **Boring technology wins.** Prefer well-understood, battle-tested tools over the
  newest framework. Novelty should be reserved for the one part of the system that's
  actually your hard problem — everything else should be standard.
- **Design for failure, not just the happy path.** Every external call (DB, API, queue)
  can fail, time out, or be slow. Code should say what happens when it does.
- **Make invalid states unrepresentable** where practical — validate at the boundary,
  not everywhere downstream.
- **Optimize for the next engineer reading this code**, not for cleverness. Clear >
  clever. A senior engineer's code looks obvious in hindsight, not impressive.
- **YAGNI, but know the difference between speculative complexity and load-bearing
  simplicity.** Don't build for scale you don't have; do build clean boundaries so
  scaling later doesn't require a rewrite.

---

## 2. Workflow for any backend task

1. **Clarify the contract first**: what does this API/service receive, return, and
   guarantee (consistency, latency, idempotency)? Write this down before code.
2. **Data model before endpoints.** Get the schema/entities and their relationships
   right first — endpoints are just operations on that model.
3. **Design the API surface** (see section 3) before implementing it.
4. **Implement with tests alongside**, not after — at minimum, cover the logic that
   isn't trivially obvious from reading the code.
5. **Handle errors and edge cases explicitly** (see section 7) — don't leave them as
   an afterthought pass.
6. **Review against the checklist in section 12** before calling it done.

---

## 3. API design

- **REST by default** for CRUD-shaped resources; **GraphQL** when clients need flexible,
  nested queries across many resource types; **gRPC** for internal service-to-service
  calls where performance and strict contracts matter more than human-readability.
- Resource-oriented URLs (`/users/123/orders`), plural nouns, HTTP verbs carry meaning
  (GET/POST/PUT/PATCH/DELETE) — don't put verbs in the URL (`/getUser`).
- Version your API from day one (`/v1/...` or a header) — you will need to change it.
- Consistent, predictable error responses: a stable shape (`{ error: { code, message } }`),
  correct HTTP status codes (400 vs 401 vs 403 vs 404 vs 409 vs 422 vs 500 — don't
  return 200 with an error buried in the body).
- Pagination on any list endpoint from the start (cursor-based for large/growing
  datasets, offset-based is fine for small stable ones) — don't let a list endpoint
  become unbounded.
- Idempotency keys on any endpoint that creates something and might be retried
  (payments, order creation) — network retries should never double-charge.
- Document the API (OpenAPI/Swagger) as you build it, not after.

---

## 4. Database design

- **Model relationships explicitly** (foreign keys, constraints) — don't push integrity
  checks entirely into application code when the database can enforce them.
- **Normalize by default**; denormalize deliberately, later, for a specific measured
  performance need — not preemptively.
- **Index what you query.** Every `WHERE`/`JOIN`/`ORDER BY` column that runs often on a
  growing table needs an index; check query plans (`EXPLAIN ANALYZE`), don't guess.
- **Migrations are code**: version-controlled, reversible where possible, never edited
  after being applied to a shared environment — write a new migration instead.
- **Transactions** wrap any multi-step write that must succeed or fail as a unit.
  Know your isolation level; don't assume defaults are always correct for the case.
- **Choose SQL vs NoSQL by access pattern**, not trend: relational (Postgres/MySQL) for
  structured data with relationships and transactional integrity; document/KV stores
  (Mongo, DynamoDB, Redis) for schema-flexible or high-throughput key-based access.
  Postgres is a reasonable default for most new products — it does a lot well.
- **Connection pooling** always — don't open a new DB connection per request in production.

---

## 5. Authentication & authorization

- Never store plaintext passwords — use a slow hash (bcrypt/argon2), never MD5/SHA1 alone.
- Prefer well-audited libraries/providers (OAuth2/OIDC, Auth0/Clerk/Cognito, or a
  mature framework's built-in auth) over hand-rolled auth — this is the one place
  "don't reinvent the wheel" applies almost without exception.
- Separate **authentication** (who are you) from **authorization** (what can you do).
  Use role/permission checks at the service layer, not just hidden UI buttons.
- Short-lived access tokens + refresh tokens over long-lived static tokens.
- Never put secrets (API keys, DB passwords, signing keys) in code or client-side
  bundles — environment variables / secrets manager only, and never commit `.env` files.
- Rate-limit auth endpoints (login, password reset) specifically — they're the most
  brute-forced routes in any app.

---

## 6. Security baseline (OWASP-aligned)

- **Input validation** on every external input (body, query params, headers) —
  never trust the client, even your own frontend.
- **Parameterized queries always** — never string-concatenate SQL (prevents injection).
- **Output encoding** to prevent XSS if you ever render user content.
- **HTTPS everywhere**, HSTS enabled, secure/HttpOnly/SameSite cookies.
- **CORS configured explicitly** — don't default to `*` on anything handling auth/cookies.
- **Least privilege** for service accounts, DB users, and API keys — scope permissions
  to exactly what's needed, not admin-by-default.
- Keep dependencies patched; watch for known CVEs in what you pull in.
- Log security-relevant events (auth failures, permission denials) without logging
  secrets or full sensitive payloads.

---

## 7. Error handling & resilience

- Distinguish **expected errors** (bad input, not found, unauthorized — return a
  clean 4xx) from **unexpected errors** (bugs, outages — log with full context, return
  a generic 500, never leak stack traces or internals to the client).
- **Timeouts** on every outbound call (DB, HTTP, queue) — an unbounded wait on a
  dependency becomes an unbounded wait on your whole service.
- **Retries with backoff** for transient failures, but only for idempotent operations —
  blind retries on a non-idempotent write can duplicate data.
- **Circuit breakers** around flaky downstream dependencies so one failing service
  doesn't cascade and take down everything that calls it.
- **Graceful degradation** where possible (serve cached/stale data, hide a broken
  widget) over a full page failure when one dependency is down.

---

## 8. Architecture patterns

- **Start with a well-organized monolith** for new products — layered/modular
  internally (routes → services → data access), so it *could* be split later.
  Don't reach for microservices until you have a concrete scaling or team-boundary
  reason; premature microservices mostly add network calls and operational overhead.
- **Split by business capability**, not by technical layer, when you do decompose
  services (an "orders" service, not a "database service").
- **Event-driven / message queues** (Kafka, RabbitMQ, SQS) for decoupling producers
  from consumers, absorbing traffic spikes, and background/async work — not for
  everything; synchronous request/response is simpler and fine for most user-facing reads.
- **Caching layers** (Redis/Memcached, or HTTP caching/CDN for public content):
  cache what's expensive to compute and safe to be briefly stale; always have an
  explicit invalidation strategy — "cache everything and hope" causes the worst bugs.
- **Twelve-Factor App principles** for anything deployed to the cloud: config via
  environment, stateless processes, logs as event streams, explicit dependency
  declarations — https://12factor.net/ (free, still the standard reference).

---

## 9. Testing

- **Unit tests** for business logic and edge cases — fast, no network/DB.
- **Integration tests** for the boundaries that matter (does this endpoint actually
  talk to a real-shaped DB correctly) — a smaller set, since they're slower.
- **A few end-to-end tests** on critical user flows (signup, checkout) — expensive,
  so keep this the smallest layer (the classic "testing pyramid").
- Test the failure paths, not just the happy path — what happens when the DB is down,
  the input is malformed, the external API times out.
- Don't chase 100% coverage as a goal in itself — chase confidence that the important
  logic is correct and won't silently regress.

---

## 10. Observability & operations

- **Structured logging** (JSON, not free-text) with request IDs so a single request
  can be traced across services/logs.
- **Metrics**: request rate, error rate, latency (p50/p95/p99) per endpoint at minimum
  — "is it slow" and "is it broken" should be answerable without reading logs.
- **Alerting** on symptoms users feel (error rate, latency, saturation), not just raw
  resource metrics like CPU — a healthy CPU with a broken app tells you nothing useful.
- **Health check endpoints** for load balancers/orchestrators to know if an instance
  is actually ready to serve traffic.
- Treat infrastructure as code (Terraform/CloudFormation/Pulumi) — manual console
  changes drift and aren't reviewable or reproducible.

---

## 11. Recommended stack defaults (pick per project, but these are safe defaults)

- **Node.js (Express/Fastify/NestJS) + TypeScript** — good default when the frontend
  is already JS/TS (shared types, one language across the stack), pairs well with the
  Vite + Tailwind frontend skill.
- **Python (FastAPI/Django)** — strong default for data-heavy or ML-adjacent backends,
  excellent for rapid, well-typed API development (FastAPI) or batteries-included
  full-stack apps (Django).
- **PostgreSQL** as the default relational database; **Redis** for caching/sessions/
  rate-limiting; add a message queue (SQS/RabbitMQ/Kafka) only once you have an actual
  async/decoupling need.
- **Docker** for local dev parity with production; container orchestration (ECS/K8s)
  only once complexity actually warrants it — a single well-configured container + a
  managed platform (Render/Fly/Railway/App Runner) is plenty for most projects.

---

## 12. Pre-ship checklist
- [ ] Every external input validated at the boundary
- [ ] Auth/authorization enforced server-side on every protected route (not just hidden in UI)
- [ ] No secrets in code, committed files, or client bundles
- [ ] All SQL parameterized — no string-built queries
- [ ] Errors return correct status codes and never leak stack traces to the client
- [ ] Every outbound call has a timeout; retries only on idempotent operations
- [ ] Critical write paths (payments, orders) are idempotent
- [ ] Migrations are reversible and have been run against a staging copy of real data shape
- [ ] Logging includes request IDs; no secrets/PII in logs
- [ ] Rate limiting on auth and any expensive/abusable endpoint
- [ ] Health check endpoint exists for the deployment platform
- [ ] Load-tested or at least reasoned about expected traffic vs. current capacity

---

## 13. Curated reference library (books & free resources)

**Foundational (read cover to cover if you only pick a few)**
- *Designing Data-Intensive Applications* — Martin Kleppmann — the single best deep-dive
  on databases, distributed systems, and data consistency trade-offs.
- *The Pragmatic Programmer* — Hunt & Thomas — engineering mindset and practices,
  still relevant decades on.
- *Clean Code* / *Clean Architecture* — Robert C. Martin — code-level and system-level
  structure principles (take the dogma with judgment, not as absolute law).
- *Site Reliability Engineering* — Google (free online) — https://sre.google/books/
  — how large-scale systems are actually kept running in production.
- *Release It!* — Michael Nygard — stability patterns (circuit breakers, bulkheads,
  timeouts) for production systems that fail gracefully instead of catastrophically.

**Architecture & system design**
- *Software Architecture: The Hard Parts* — Neal Ford & Mark Richards — trade-off-driven
  thinking for distributed system design decisions.
- *System Design Interview* (Vol. 1 & 2) — Alex Xu — accessible, visual walkthroughs of
  common scalable-system building blocks (load balancers, caching, sharding, queues).
- The Twelve-Factor App (free) — https://12factor.net/

**API & data**
- *REST API Design Rulebook* — Mark Massé — concrete conventions for consistent APIs.
- PostgreSQL official documentation (free, excellent) — https://www.postgresql.org/docs/
- OWASP Top 10 (free, the standard web security checklist) — https://owasp.org/www-project-top-ten/

**Free technical reference sites**
- MDN Web Docs (HTTP, security headers, web APIs) — https://developer.mozilla.org/
- web.dev — performance & best practices — https://web.dev/
- High Scalability (real-world architecture case studies) — http://highscalability.com/

Use these for principles and mental models — always design the actual schema, API,
and architecture around the specific project's real constraints, not by copying a
pattern from a book verbatim.
