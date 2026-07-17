# Mokshify - Content & Marketing Playbook (Phase 3)

Internal working document - not published on the site. Everything here is a
plan or a draft; nothing becomes public until a human approves it.

## Blog strategy: topical clusters

Each cluster = one pillar page (/blog/<cluster>/) + supporting articles that
link up to the pillar and sideways to services. Schema: Article + Breadcrumb;
pillar gets CollectionPage. Ship one cluster at a time, 4-6 articles each.

| Cluster | Pillar | Links to service |
|---|---|---|
| AI | Building AI products that survive production | /services/ai-product-development/ |
| Cloud | Cloud architecture for products, not diagrams | /services/cloud-engineering/ |
| Enterprise | Custom software that enterprises actually adopt | /services/ |
| Flutter | One codebase, two stores: Flutter in production | /services/mobile-app-development/ |
| React/Next | Product-grade React and Next.js | /services/saas-development/ |
| Node/Python/FastAPI | Backend services that stay boring | /services/saas-development/ |
| DevOps | Pipelines, IaC and releases without fear | /services/cloud-engineering/ |
| Architecture | Systems design for founders | /architecture/ |
| Databases | PostgreSQL as a product decision | /architecture/ |

## 50 article ideas (grouped)

### AI (8)
1. RAG in production: the pipeline, the eval suite, the bill
2. AI agents need permission boundaries more than they need prompts
3. OpenAI vs Claude vs Gemini: a routing decision, not a religion
4. What an AI feasibility spike looks like (week one, real data)
5. Hallucination control that actually ships: schemas, citations, checkpoints
6. Token cost engineering: caching, routing, budgets, metering
7. pgvector vs a dedicated vector DB: when one database wins
8. The AI review gate: letting a model review every merge

### Cloud (6)
9. AWS vs Azure vs OCI vs GCP for Indian startups: an honest matrix
10. Terraform from day one: why environments should be code
11. Kubernetes is premature (until it isn't): a decision checklist
12. Staged rollouts and instant rollback on a startup budget
13. Cloud cost anomalies: catching them in days, not billing cycles
14. Multi-cloud portability without multi-cloud pain

### Software / Enterprise (6)
15. The one-workflow MVP: scoping a fundable product in 6 weeks
16. Rescuing a codebase: audit, stabilise, then improve
17. Why client code ownership is our retention strategy
18. Internal platforms: the software SMBs actually need
19. SSO, roles and audit trails: what "enterprise-ready" means concretely
20. The decision log: cheap documentation that survives teams

### Flutter (5)
21. Flutter vs native in 2026: the honest decision tree
22. One backend, three surfaces: architecture for web + iOS + Android
23. Shipping to both stores from one codebase: what breaks and when
24. Offline states, empty states, thumb reach: mobile UX that converts
25. Store review without surprises: a submission checklist

### React / Next.js (5)
26. Server rendering when it matters: SEO-critical product pages
27. React architecture that survives feature growth
28. Design systems without a design-system team
29. Web performance budgets: LCP under 1.8s on real devices
30. Forms, validation and the boring 40% of every product

### Node / Python / FastAPI (5)
31. Node or Python? Choosing by team, not by benchmark
32. FastAPI in production: typed boundaries, free docs
33. Background jobs without a message-queue PhD: Redis patterns
34. API versioning that doesn't break customers
35. Idempotency keys: the cheapest reliability you'll ever add

### DevOps (5)
36. GitHub Actions as the whole pipeline: tests, AI review, rollout
37. Secrets management: vaults, rotation, and never-in-code
38. Monitoring that pages a human who can act
39. Backups are worthless; restores are everything
40. The deploy-from-README test for documentation

### Architecture (5)
41. Row-level vs schema-per-tenant: multi-tenancy trade-offs
42. Security in layers: assuming each layer fails
43. The walking skeleton: end-to-end in week two
44. Boring technology as a competitive advantage
45. Migration strategies: reversible by default

### Databases (5)
46. PostgreSQL schema design as a product artifact
47. Indexes, query budgets and the two-hundredth customer
48. Redis beyond caching: sessions, rate limits, queues
49. Zero-downtime migrations: patterns that work
50. When NOT to add a second database

## Newsletter: "Production Notes" (monthly)
Sections: one engineering insight (from the blog clusters above), one AI
update that matters to builders, one architecture pattern, one thing we
shipped/learned, one resource. Plain HTML email, no tracking pixels beyond
the ESP default. Signup CTA to add to /resources/ once an ESP is chosen.

## Email sequences (drafts - personalise before sending)

### 1. Welcome (on first enquiry)
Subject: Got it - here's what happens next
Body: Thanks for writing to Mokshify. A real engineer reads every enquiry;
you'll have our reply within 24 hours. Meanwhile: our process (link), our
work (link), and the planning checklist (link) if you want a head start.

### 2. Consultation follow-up (within 24h of the call)
Subject: Notes from our call + the first step
Body: What we heard (2-3 bullets), our feasibility read (honest), the one
workflow we'd ship first, engagement recommendation, and the next step with
a date. No pressure line: if now isn't the time, the notes are yours.

### 3. Proposal follow-up (3-4 days after proposal)
Subject: Questions on the proposal?
Body: Short. Offer a 15-minute walkthrough, invite pushback on scope,
restate the start date window. One question: "What would need to be true
for this to be an easy yes?"

### 4. Case-study share (contextual, not scheduled)
Subject: How <similar company type> shipped in 6 weeks
Body: One-paragraph story matching their industry (link to the case study),
one relevant metric, one line on what transfers to their project.

### 5. Newsletter template
See "Production Notes" above.

## Social content (idea banks)

### LinkedIn - 100 posts (10 themes x 10)
Themes: build-in-public engineering notes; before/after architecture
stories; honest technology comparisons; MVP scoping lessons; AI-in-
production lessons; cost-engineering wins; process explainers (one stage
per post); checklist excerpts; case-study threads; contrarian takes
(kindly argued). For each theme, 10 posts = one per week per theme is a
year of content; write from real work only, never invent client details.

### X/Twitter - 50 ideas
Condensed versions of the LinkedIn themes as single insights, plus: one-
tweet architecture diagrams; "we chose X over Y because"; pipeline
screenshots (sanitised); eval-suite results (anonymised); checklist items
as standalone tips.

### YouTube - 30 topics
Architecture walkthroughs (5); AI product build series (5); cloud decision
guides (4); Flutter production series (4); DevOps hands-on (4); founder-
facing explainers: scoping, costs, hiring (5); case-study breakdowns with
client permission only (3).

### Webinars - 20 topics
MVP scoping workshop; AI feasibility live-audit; RAG architecture deep
dive; multi-tenancy patterns; cloud cost review; pipeline setup live;
Flutter vs native debate; PostgreSQL for founders; security layers
walkthrough; monitoring setup; plus audience-requested repeats of the top
performers.

### Short-form video - 50 ideas
60-second versions of: each checklist item (20); each architecture diagram
explained (5); each technology "why we use it" (18); process stages (7).
The site content is the script bank - nothing needs inventing.

## Publishing rules
- Real work only. No invented clients, metrics, or testimonials.
- Every public claim must be verifiable on the site or in a live product.
- Blog posts get Article schema, a named author, and a dateModified.
- Everything links somewhere useful: service, case study, or resource.