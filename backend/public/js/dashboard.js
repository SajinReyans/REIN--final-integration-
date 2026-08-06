(function () {
  "use strict";

  const MAX_ROWS = 50;
  const historyBody = document.getElementById("history-body");
  const rows = []; // in-memory client-side history cache

  // ---------- helpers ----------

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
  }

  function formatTime(isoString) {
    if (!isoString) return "—";
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  }

  function aqiLabel(aqi) {
    if (aqi <= 50) return { text: "Good", cls: "text-cyan-signal border-cyan-signal/40" };
    if (aqi <= 100) return { text: "Moderate", cls: "text-amber-signal border-amber-signal/40" };
    if (aqi <= 150) return { text: "Unhealthy (Sensitive Groups)", cls: "text-amber-signal border-amber-signal/40" };
    if (aqi <= 200) return { text: "Unhealthy", cls: "text-alert-signal border-alert-signal/40" };
    if (aqi <= 300) return { text: "Very Unhealthy", cls: "text-alert-signal border-alert-signal/40" };
    return { text: "Hazardous", cls: "text-alert-signal border-alert-signal/40" };
  }

  function setStatusDot(id, connected) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle("status-dot-on", connected);
    el.classList.toggle("status-dot-off", !connected);
  }

  function flashUpdated() {
    const flag = document.getElementById("updated-flag");
    flag.classList.remove("opacity-0");
    flag.classList.add("opacity-100");
    setTimeout(() => {
      flag.classList.remove("opacity-100");
      flag.classList.add("opacity-0");
    }, 1400);

    ["card-temperature", "card-humidity", "card-aqi", "card-rainfall"].forEach((id) => {
      const el = document.getElementById(id);
      el.classList.remove("flash-update");
      // reflow to restart animation
      void el.offsetWidth;
      el.classList.add("flash-update");
    });
  }

  function updateCards(reading) {
    document.getElementById("val-temperature").textContent = Number(reading.temperature).toFixed(1);
    document.getElementById("val-humidity").textContent = Number(reading.humidity).toFixed(1);
    document.getElementById("val-aqi").textContent = reading.aqi;
    document.getElementById("val-rainfall").textContent = Number(reading.rainfall).toFixed(1);

    const t = formatTime(reading.timestamp);
    document.getElementById("time-temperature").textContent = t;
    document.getElementById("time-humidity").textContent = t;
    document.getElementById("time-rainfall").textContent = t;

    const label = aqiLabel(Number(reading.aqi));
    const aqiEl = document.getElementById("aqi-label");
    aqiEl.textContent = label.text;
    aqiEl.className = "px-1.5 py-0.5 rounded-sm border font-mono " + label.cls;

    document.getElementById("device-id").textContent = reading.device_id || reading.deviceId || "—";
    document.getElementById("last-received").textContent = t;
  }

  function renderHistoryRow(reading) {
    const tr = document.createElement("tr");
    tr.className = "border-b border-station-line/60 hover:bg-station-panelLight/40";
    tr.innerHTML = `
      <td class="px-5 py-2.5 text-station-muted">${escapeHtml(formatTime(reading.timestamp))}</td>
      <td class="px-5 py-2.5">${escapeHtml(reading.device_id || reading.deviceId)}</td>
      <td class="px-5 py-2.5 text-amber-signal">${escapeHtml(Number(reading.temperature).toFixed(1))}</td>
      <td class="px-5 py-2.5 text-cyan-signal">${escapeHtml(Number(reading.humidity).toFixed(1))}</td>
      <td class="px-5 py-2.5">${escapeHtml(reading.aqi)}</td>
      <td class="px-5 py-2.5 text-cyan-signal">${escapeHtml(Number(reading.rainfall).toFixed(1))}</td>
    `;
    return tr;
  }

  function prependHistoryRow(reading) {
    rows.unshift(reading);
    if (rows.length > MAX_ROWS) rows.pop();
    renderHistoryTable();
  }

  function renderHistoryTable() {
    historyBody.innerHTML = "";
    if (rows.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="6" class="px-5 py-6 text-center text-station-muted">No readings yet — waiting for telemetry…</td>`;
      historyBody.appendChild(tr);
      return;
    }
    const fragment = document.createDocumentFragment();
    rows.forEach((r) => fragment.appendChild(renderHistoryRow(r)));
    historyBody.appendChild(fragment);
  }

  // ---------- initial load (REST) ----------

  async function loadInitialData() {
    try {
      const latestRes = await fetch("/api/weather/latest");
      if (latestRes.ok) {
        const latest = await latestRes.json();
        updateCards(latest);
      }
    } catch (err) {
      console.error("Failed to load latest reading:", err);
    }

    try {
      const historyRes = await fetch(`/api/weather/history?page=1&limit=${MAX_ROWS}`);
      if (historyRes.ok) {
        const { data } = await historyRes.json();
        rows.length = 0;
        rows.push(...data);
        renderHistoryTable();
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  }

  async function pollHealth() {
    try {
      const res = await fetch("/api/health");
      const health = await res.json();
      setStatusDot("db-dot", health.database === "connected");
      setStatusDot("mqtt-dot", health.mqtt === "connected");
    } catch (err) {
      setStatusDot("db-dot", false);
      setStatusDot("mqtt-dot", false);
    }
  }

  // ---------- live updates (Socket.IO) ----------

  const socket = io();

  socket.on("connect", () => {
    setStatusDot("live-dot", true);
    document.getElementById("live-text").textContent = "LIVE";
  });

  socket.on("disconnect", () => {
    setStatusDot("live-dot", false);
    document.getElementById("live-text").textContent = "OFFLINE";
  });

  socket.on("connect_error", () => {
    setStatusDot("live-dot", false);
    document.getElementById("live-text").textContent = "OFFLINE";
  });

  socket.on("weather:new", (reading) => {
    updateCards(reading);
    prependHistoryRow(reading);
    flashUpdated();
  });

  // ---------- boot ----------

  loadInitialData();
  pollHealth();
  setInterval(pollHealth, 10000); // health dots only — NOT used for live weather data
})();
