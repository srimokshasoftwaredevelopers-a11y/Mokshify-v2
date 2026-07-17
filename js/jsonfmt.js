/* MOKSHIFY - JSON formatter. Entirely client-side; nothing leaves the page. */
(() => {
  "use strict";
  const inp = document.querySelector("#jf-in");
  const out = document.querySelector("#jf-out");
  const err = document.querySelector("#jf-err");
  if (!inp) return;
  function run() {
    const v = inp.value.trim();
    if (!v) { out.textContent = ""; err.textContent = ""; return; }
    try {
      out.textContent = JSON.stringify(JSON.parse(v), null, 2);
      err.textContent = "Valid JSON.";
      err.style.color = "#3E6B48";
    } catch (e) {
      out.textContent = "";
      err.textContent = e.message;
      err.style.color = "#6B1932";
    }
  }
  inp.addEventListener("input", run);
  document.querySelector("#jf-copy").addEventListener("click", () => {
    if (out.textContent) navigator.clipboard.writeText(out.textContent);
  });
})();