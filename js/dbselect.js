/* ═══════════════════════════════════════════════════════════════
   MOKSHIFY — database selector
   Recommendations mirror our published ADRs; the reasoning is the
   product. No telemetry beyond the standard dataLayer prep.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  "use strict";
  const form = document.querySelector(".est");
  const name = document.querySelector("#db-name");
  const why = document.querySelector("#db-why");
  if (!form) return;
  const pick = n => (form.querySelector(`input[name="${n}"]:checked`) || {}).value || "";

  function run() {
    const shape = pick("shape");
    const scale = pick("scale");
    const extra = pick("extra");
    let db = "PostgreSQL";
    let reason = "Relational rigour, row-level security for tenancy, JSONB where shape genuinely varies, and two decades of operational knowledge. The boring, correct default — see ADR-003.";

    if (shape === "analytics") {
      db = "PostgreSQL + a warehouse";
      reason = "Transactions stay in Postgres; heavy analytics move to a columnar warehouse (ClickHouse or a managed equivalent) fed from it. Replacing your OLTP database because dashboards got slow is the classic over-correction.";
    } else if (shape === "documents" && scale === "high") {
      db = "PostgreSQL (JSONB) — probably";
      reason = "Truly schema-fluid, high-volume document workloads are the honest case for a document store — but JSONB covers most 'document-shaped' products with transactions and joins intact. Prove JSONB insufficient before adding a second engine.";
    }
    if (extra === "vector") {
      db += " + pgvector";
      reason += " AI retrieval lives in pgvector inside the same database — one engine to operate, not two.";
    } else if (extra === "cache") {
      db += " + Redis";
      reason += " Hot paths, sessions and queues go to Redis beside it — see ADR-004.";
    }
    name.textContent = db;
    why.textContent = reason;
    if (Array.isArray(window.dataLayer))
      window.dataLayer.push({ event: "dbselector_change", shape, scale, extra });
  }
  form.addEventListener("change", run);
  run();
})();