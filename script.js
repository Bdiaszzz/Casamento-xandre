// ---------- Countdown ----------
const weddingDate = new Date("2026-10-22T00:00:00");
const organizerPassword = "casamento2026";
const spreadsheetWebhookUrl = ""; // Cole aqui a URL do Apps Script do Google Sheets

async function saveToSpreadsheet(entry) {
  if (!spreadsheetWebhookUrl) return false;

  const response = await fetch(spreadsheetWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });

  if (!response.ok) {
    throw new Error(`Erro ao salvar na planilha: ${response.status}`);
  }

  return true;
}

function updateCountdown() {
  const now = new Date();
  const diff = weddingDate - now;
  if (diff <= 0) {
    document.getElementById("cd-days").textContent = "0";
    document.getElementById("cd-hours").textContent = "0";
    document.getElementById("cd-min").textContent = "0";
    return;
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  document.getElementById("cd-days").textContent = days;
  document.getElementById("cd-hours").textContent = hours;
  document.getElementById("cd-min").textContent = mins;
}
updateCountdown();
setInterval(updateCountdown, 30000);

// ---------- Radio selection ----------
const optSim = document.getElementById("opt-sim");
const optNao = document.getElementById("opt-nao");
const acompWrap = document.getElementById("acompanhantes-wrap");

function selectPresenca(chosen) {
  [optSim, optNao].forEach((o) => o.classList.remove("selected"));
  chosen.classList.add("selected");
  chosen.querySelector("input").checked = true;
  acompWrap.classList.toggle("open", chosen === optSim);
  document.getElementById("err-presenca").style.display = "none";
}
optSim.addEventListener("click", () => selectPresenca(optSim));
optNao.addEventListener("click", () => selectPresenca(optNao));

// ---------- Submit ----------
const form = document.getElementById("rsvp-form");
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const presencaEl = document.querySelector('input[name="presenca"]:checked');
  let valid = true;

  document.getElementById("err-nome").style.display = "none";
  document.getElementById("err-presenca").style.display = "none";

  if (!nome) {
    document.getElementById("err-nome").style.display = "block";
    valid = false;
  }
  if (!presencaEl) {
    document.getElementById("err-presenca").style.display = "block";
    valid = false;
  }
  if (!valid) return;

  const presenca = presencaEl.value;
  const acompanhantes =
    presenca === "sim"
      ? document.getElementById("acompanhantes").value || "1"
      : "0";
  const mensagem = document.getElementById("mensagem").value.trim();

  const entry = {
    nome,
    presenca: presenca === "sim" ? "Sim" : "Não",
    pessoas: acompanhantes,
    mensagem,
    data_envio: new Date().toLocaleString("pt-BR"),
  };

  const submitBtn = form.querySelector(".submit-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando...";

  try {
    const key =
      "rsvp:" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    await window.storage.set(key, JSON.stringify(entry), true);

    try {
      if (spreadsheetWebhookUrl) {
        await saveToSpreadsheet(entry);
      }
    } catch (sheetErr) {
      console.warn("Resposta salva localmente, mas não foi possível enviar para a planilha:", sheetErr);
    }

    document.getElementById("form-state").style.display = "none";
    document.getElementById("success-state").classList.add("show");
  } catch (err) {
    console.error("Erro ao salvar resposta:", err);
    submitBtn.disabled = false;
    submitBtn.textContent = "Enviar confirmação";
    alert(
      "Não foi possível enviar sua confirmação agora. Tente novamente em instantes.",
    );
  }
});

// ---------- Organizer panel ----------
const orgToggle = document.getElementById("organizer-toggle");
const orgPanel = document.getElementById("organizer-panel");
const orgSummary = document.getElementById("org-summary");

async function loadResponses() {
  try {
    const list = await window.storage.list("rsvp:", true);
    if (!list || !list.keys || list.keys.length === 0) {
      orgSummary.textContent = "Nenhuma resposta ainda.";
      return [];
    }
    const entries = [];
    for (const key of list.keys) {
      try {
        const res = await window.storage.get(key, true);
        if (res && res.value) {
          entries.push(JSON.parse(res.value));
        }
      } catch (e) {
        /* skip missing/broken key */
      }
    }
    const confirmados = entries.filter((e) => e.presenca === "Sim").length;
    const totalPessoas = entries
      .filter((e) => e.presenca === "Sim")
      .reduce((sum, e) => sum + (parseInt(e.pessoas) || 1), 0);
    orgSummary.textContent = `${entries.length} resposta(s) — ${confirmados} confirmaram presença (${totalPessoas} pessoa(s) no total).`;
    return entries;
  } catch (err) {
    console.error("Erro ao carregar respostas:", err);
    orgSummary.textContent = "Erro ao carregar respostas.";
    return [];
  }
}

orgToggle.addEventListener("click", async () => {
  const password = prompt("Digite a senha para acessar a área do organizador:");
  if (password !== organizerPassword) {
    orgSummary.textContent = "Acesso restrito.";
    orgPanel.classList.remove("open");
    return;
  }

  const willOpen = !orgPanel.classList.contains("open");
  orgPanel.classList.toggle("open");
  if (willOpen) {
    orgSummary.textContent = "Carregando respostas...";
    await loadResponses();
  }
});

document.getElementById("export-btn").addEventListener("click", async () => {
  const btn = document.getElementById("export-btn");
  btn.disabled = true;
  btn.textContent = "Gerando...";
  try {
    const entries = await loadResponses();
    if (entries.length === 0) {
      alert("Ainda não há respostas para exportar.");
      return;
    }
    const rows = entries.map((e) => ({
      Nome: e.nome,
      Presença: e.presenca,
      "Nº de pessoas": e.pessoas,
      Mensagem: e.mensagem || "-",
      "Data de envio": e.data_envio,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 24 },
      { wch: 12 },
      { wch: 14 },
      { wch: 36 },
      { wch: 20 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Confirmações");
    XLSX.writeFile(wb, "rsvp_alexandre_juliana.xlsx");
  } catch (err) {
    console.error("Erro ao exportar:", err);
    alert("Não foi possível gerar a planilha agora.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Baixar planilha (.xlsx)";
  }
});
