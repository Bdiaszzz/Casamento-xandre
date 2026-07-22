// ---------- Countdown ----------
const weddingDate = null;
const organizerPassword = "casamento2026";
const spreadsheetWebhookUrl =
  new URLSearchParams(window.location.search).get("sheet") ||
  "https://script.google.com/macros/s/AKfycbzBOkrm-5jtUmTO9CgMj_qpJj66IPSJPiH2veb7xdeuQP-QmnW3AEo7avYKgB_II-Rf/exec";

function createStorageAdapter() {
  if (
    window.storage &&
    typeof window.storage.set === "function" &&
    typeof window.storage.get === "function" &&
    typeof window.storage.list === "function"
  ) {
    return window.storage;
  }

  return {
    async set(key, value) {
      localStorage.setItem(key, value);
      return true;
    },
    async get(key) {
      const value = localStorage.getItem(key);
      return value === null ? null : { value };
    },
    async list(prefix) {
      const keys = Object.keys(localStorage)
        .filter((itemKey) => itemKey.startsWith(prefix))
        .sort();
      return { keys };
    },
  };
}

const storage = createStorageAdapter();

async function saveToSpreadsheet(entry) {
  if (!spreadsheetWebhookUrl) return false;

  try {
    const response = await fetch(spreadsheetWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(entry),
      mode: "cors",
      redirect: "follow",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Erro ao salvar na planilha: ${response.status} - ${text}`,
      );
    }

    return true;
  } catch (err) {
    console.error("Erro no envio para a planilha:", err);
    throw err;
  }
}

function submitXHRFallback(entry) {
  return new Promise((resolve) => {
    const formData = new FormData();
    formData.append("nome", entry.nome || "");
    formData.append("presenca", entry.presenca || "");
    formData.append("pessoas", entry.pessoas || "");
    formData.append("mensagem", entry.mensagem || "");
    formData.append("data_envio", entry.data_envio || "");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", spreadsheetWebhookUrl, true);
    xhr.onload = () => {
      console.log("XHR POST success:", xhr.status, xhr.responseText);
      resolve(true);
    };
    xhr.onerror = () => {
      console.error("XHR POST error:", xhr.status, xhr.responseText);
      resolve(true);
    };
    xhr.ontimeout = () => {
      console.warn("XHR POST timeout");
      resolve(true);
    };
    xhr.timeout = 15000;
    try {
      xhr.send(formData);
    } catch (e) {
      console.error("XHR send failed:", e);
      resolve(true);
    }
  });
}

// ---------- Confetti effect ----------
function createConfetti() {
  const colors = ["#B8924A", "#8F6E33", "#2C2620", "#E4D9C4"];
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement("div");
    confetti.style.position = "fixed";
    confetti.style.left = Math.random() * 100 + "%";
    confetti.style.top = "-10px";
    confetti.style.width = Math.random() * 10 + 5 + "px";
    confetti.style.height = Math.random() * 10 + 5 + "px";
    confetti.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];
    confetti.style.borderRadius = "50%";
    confetti.style.pointerEvents = "none";
    confetti.style.zIndex = "9999";
    confetti.style.animation = `confetti ${Math.random() * 1 + 2}s ease-in forwards`;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 3000);
  }
}

function updateCountdown() {
  if (!weddingDate) {
    document.getElementById("cd-days").textContent = "_";
    document.getElementById("cd-hours").textContent = "_";
    document.getElementById("cd-min").textContent = "_";
    return;
  }

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

// ---------- Real-time validation ----------
const nomeInput = document.getElementById("nome");
const acompInput = document.getElementById("acompanhantes");

nomeInput.addEventListener("blur", () => {
  if (nomeInput.value.trim()) {
    nomeInput.classList.add("valid");
    nomeInput.classList.remove("invalid");
  }
});

nomeInput.addEventListener("input", () => {
  if (nomeInput.value.trim()) {
    nomeInput.classList.add("valid");
    nomeInput.classList.remove("invalid");
  } else {
    nomeInput.classList.remove("valid");
  }
});

acompInput.addEventListener("change", () => {
  if (parseInt(acompInput.value) > 0) {
    acompInput.classList.add("valid");
  }
});

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
    nomeInput.classList.add("invalid");
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
  submitBtn.classList.add("loading");

  try {
    const key =
      "rsvp:" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    await storage.set(key, JSON.stringify(entry), true);

    try {
      if (spreadsheetWebhookUrl) {
        await saveToSpreadsheet(entry);
      }
    } catch (sheetErr) {
      console.warn(
        "saveToSpreadsheet falhou, tentando fallback XMLHttpRequest:",
        sheetErr,
      );
      try {
        await submitXHRFallback(entry);
      } catch (fbErr) {
        console.error("XHR fallback também falhou:", fbErr);
      }
    }

    // Trigger success with confetti
    document.getElementById("form-state").style.display = "none";
    document.getElementById("success-state").classList.add("show");
    createConfetti();

    // Reset form for potential re-use
    setTimeout(() => {
      form.reset();
      nomeInput.classList.remove("valid", "invalid");
      acompInput.classList.remove("valid");
      [optSim, optNao].forEach((o) => o.classList.remove("selected"));
      acompWrap.classList.remove("open");
    }, 1000);
  } catch (err) {
    console.error("Erro ao salvar resposta:", err);
    submitBtn.disabled = false;
    submitBtn.classList.remove("loading");
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
    const list = await storage.list("rsvp:", true);
    if (!list || !list.keys || list.keys.length === 0) {
      orgSummary.textContent = "Nenhuma resposta ainda.";
      return [];
    }
    const entries = [];
    for (const key of list.keys) {
      try {
        const res = await storage.get(key, true);
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
    orgSummary.innerHTML = `<strong>${entries.length}</strong> resposta(s) — <strong>${confirmados}</strong> confirmaram presença (<strong>${totalPessoas}</strong> pessoa(s) no total).`;
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
