/* ═══════════════════════════════════════════════════════════════
   MOKSHIFY — project estimator
   Honest by design: outputs duration, team shape and engagement
   model derived from our published anchors (MVP 4-6 weeks, etc.).
   Cost is presented as drivers + a prefilled enquiry, never an
   invented number.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  "use strict";
  const form = document.querySelector(".est");
  const out = {
    weeks: document.querySelector("#est-weeks"),
    team: document.querySelector("#est-team"),
    model: document.querySelector("#est-model"),
    drivers: document.querySelector("#est-drivers"),
    mail: document.querySelector("#est-mail"),
  };
  if (!form) return;

  const pick = name =>
    (form.querySelector(`input[name="${name}"]:checked`) || {}).value || "";

  function estimate() {
    const platform = pick("platform");
    const scope = pick("scope");
    const ai = pick("ai");
    const infra = pick("infra");

    // duration anchors: published MVP Sprint = 4-6 weeks
    let lo = 4, hi = 6;
    const drivers = [];

    if (platform === "webmobile") { lo += 2; hi += 3; drivers.push("two client surfaces (web + mobile) on one backend"); }
    else if (platform === "mobile") { lo += 1; hi += 2; drivers.push("store submission and review time"); }

    if (scope === "integrations") { lo += 1; hi += 3; drivers.push("third-party integrations (each adds testing surface)"); }
    else if (scope === "complex") { lo += 4; hi += 8; drivers.push("multi-role workflows and permission complexity"); }

    if (ai === "assistant") { lo += 1; hi += 2; drivers.push("LLM feature with evaluation suite"); }
    else if (ai === "rag") { lo += 2; hi += 4; drivers.push("RAG pipeline: ingestion, retrieval tuning and eval harness"); }
    else if (ai === "agents") { lo += 3; hi += 6; drivers.push("agent actions: permission boundaries, audit, human checkpoints"); }

    if (infra === "new") { drivers.push("cloud foundation via Terraform (runs in parallel, adds little time)"); }
    else if (infra === "existing") { lo += 1; hi += 2; drivers.push("integrating with existing infrastructure and access processes"); }

    // team shape
    let team = "1 product engineer + 1 design-capable engineer";
    if (hi > 9) team = "2 engineers + 1 designer + shared platform engineer";
    if (hi > 14) team = "3 engineers + 1 designer + platform engineer";
    if (ai === "rag" || ai === "agents") team += " (one AI-specialised)";

    // engagement model
    let model = "MVP Sprint";
    if (hi > 8) model = "Product Engineering";
    if (scope === "complex" && hi > 12) model = "Product Engineering (phased)";

    out.weeks.textContent = `${lo}–${hi} weeks`;
    out.team.textContent = team;
    out.model.textContent = model;
    out.drivers.innerHTML = drivers.length
      ? "<strong>What drives this estimate:</strong> " + drivers.join("; ") + "."
      : "<strong>Baseline:</strong> one core workflow, one platform — our published MVP Sprint anchor.";

    const summary = encodeURIComponent(
      `Estimator summary:\n- Platform: ${platform}\n- Scope: ${scope}\n- AI: ${ai}\n- Infrastructure: ${infra}\n- Suggested: ${model}, ${lo}-${hi} weeks, ${team}\n\nAbout the product: (tell us in a paragraph)`
    );
    out.mail.href = `mailto:hello@mokshify.io?subject=Project%20estimate%20request&body=${summary}`;

    if (Array.isArray(window.dataLayer))
      window.dataLayer.push({ event: "estimator_change", platform, scope, ai, infra });
  }

  form.addEventListener("change", estimate);
  estimate();

  /* share the estimate with Mokshify Desk (window.mokshifySendLead, from site.js); if the CRM can't be
     reached, the visitor's mail app opens with the estimate filled in, as before */
  const share = document.getElementById("est-share");
  if (share) {
    share.hidden = false;
    const status = share.querySelector(".form-status");
    share.addEventListener("submit", async e => {
      e.preventDefault();
      const f = new FormData(share);
      const name = String(f.get("name") || "").trim(), contact = String(f.get("contact") || "").trim();
      if (f.get("website")) return;                                       // honeypot
      if (!name || !contact) { status.textContent = "Please add your name and a phone number or email."; return; }
      if (!f.get("consent")) { status.textContent = "Please tick the consent box to send."; return; }
      const isEmail = /@/.test(contact);
      const summary = decodeURIComponent(out.mail.href.split("&body=")[1] || "").replace("About the product: (tell us in a paragraph)", `About the product: ${String(f.get("about") || "").trim() || "(not given)"}`);
      const btn = share.querySelector("button[type=submit]");
      btn.disabled = true; status.textContent = "Sending…";
      const send = window.mokshifySendLead || (async () => "unreachable");
      const result = await send({ name, ...(isEmail ? { email: contact } : { phone: contact }), message: summary, consent: true, source: "Estimator", service: out.model.textContent });
      btn.disabled = false;
      if (result === "sent") { share.reset(); status.textContent = "Sent. An engineer will reply within 24 hours with a real range."; }
      else if (result.startsWith("refused:")) status.textContent = `${result.slice(8)} You can also WhatsApp us.`;
      else { location.href = out.mail.href; status.textContent = "We couldn't reach our inbox just now, so your mail app should open with the estimate filled in."; }
    });
  }
})();