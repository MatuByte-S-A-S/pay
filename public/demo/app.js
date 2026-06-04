const fmt = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

let session = null;
let catalog = [];
let selectedProductId = null;
let pollTimer = null;

const $ = (id) => document.getElementById(id);

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.apiKey}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `Error ${res.status}`);
  return data;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function showResult(html, type = "pending") {
  const panel = $("resultPanel");
  panel.className = `result-panel ${type}`;
  panel.innerHTML = html;
  panel.classList.remove("hidden");
}

function showBoldAlert(status) {
  const el = $("boldAlert");
  if (status?.ok) {
    el.classList.add("hidden");
    return;
  }
  el.classList.remove("hidden");
  el.innerHTML = `<strong>Bold no conectado</strong><br/>${escapeHtml(status?.message || "")}<br/>
    Revisa AUTHORIZATION_BOLD_DEV en .env (formato: <code>x-api-key ...</code>)`;
}

function renderCatalog() {
  const list = $("catalogList");
  list.innerHTML = catalog
    .map(
      (item) => `
    <label class="product-option ${selectedProductId === item.id ? "selected" : ""}">
      <input type="radio" name="product" value="${item.id}" ${selectedProductId === item.id ? "checked" : ""} />
      <div class="product-info">
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(item.description || "")} · ${item.currency}</span>
      </div>
      <span class="product-price">${item.currency === "USD" ? `US$${item.amount}` : fmt.format(item.amount)}</span>
    </label>`,
    )
    .join("");

  list.querySelectorAll('input[name="product"]').forEach((input) => {
    input.addEventListener("change", () => {
      selectedProductId = input.value;
      renderCatalog();
      updateSummary();
      $("payBtn").disabled = false;
    });
  });
}

function updateSummary() {
  const item = catalog.find((c) => c.id === selectedProductId);
  if (!item) {
    $("summary").innerHTML = '<p class="summary-empty">Elige un producto.</p>';
    return;
  }
  $("summary").innerHTML = `<div class="summary-row summary-total"><span>Total</span><span>${escapeHtml(item.name)}</span></div>`;
}

async function pollLink(linkId) {
  try {
    const res = await api(`/v1/payment/link/${encodeURIComponent(linkId)}`);
    const status = (res.data?.status || "").toUpperCase();
    if (status === "PAID") {
      clearInterval(pollTimer);
      showResult(`<strong>Pago exitoso</strong>`, "success");
      $("payBtn").disabled = false;
    } else if (["REJECTED", "CANCELLED", "EXPIRED"].includes(status)) {
      clearInterval(pollTimer);
      showResult(`<strong>Estado:</strong> ${escapeHtml(status)}`, "error");
      $("payBtn").disabled = false;
    }
  } catch {
    /* sigue */
  }
}

async function init() {
  const boldStatus = await fetch("/api/demo/bold-status").then((r) => r.json());
  showBoldAlert(boldStatus);

  session = await fetch("/api/demo/session").then((r) => r.json());
  $("appLabel").textContent = session.appName;
  $("boldMode").textContent = "API Link Bold";
  $("envBadge").textContent = session.boldSandbox ? "Pruebas" : "Producción";
  $("envBadge").classList.add(session.boldSandbox ? "sandbox" : "production");

  if (!boldStatus.ok) {
    $("catalogList").innerHTML = '<p class="error-msg">Configura Bold en .env</p>';
    return;
  }

  const cat = await api("/v1/catalog");
  catalog = cat.catalog || [];
  if (catalog.length) {
    selectedProductId = catalog[0].id;
    $("payBtn").disabled = false;
  }
  renderCatalog();
  updateSummary();
}

$("checkoutForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("payBtn").disabled = true;
  $("payBtn").textContent = "Generando link…";

  try {
    const res = await api("/v1/payment", {
      method: "POST",
      body: JSON.stringify({ productId: selectedProductId }),
    });
    const { url, link_id, reference } = res.data;
    showResult(
      `<strong>Link creado</strong><br/>Ref: <code>${escapeHtml(reference)}</code><br/>
      <a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="btn-link">Abrir checkout Bold →</a>`,
      "pending",
    );
    window.open(url, "_blank");
    pollTimer = setInterval(() => pollLink(link_id), 4000);
    pollLink(link_id);
  } catch (err) {
    showResult(`<strong>Error</strong><br/>${escapeHtml(err.message)}`, "error");
  }

  $("payBtn").disabled = false;
  $("payBtn").textContent = "Generar link de pago";
});

init();
