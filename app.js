// =====================
// APP.JS - All logic
// =====================

let currentRole = "user";
let currentUser = null;

// ---- INIT ----
window.onload = function () {
  initStorage();
  checkSession();
  startRealTimeTicker();
};

function checkSession() {
  const session = JSON.parse(sessionStorage.getItem("session"));
  if (session) {
    currentUser = session;
    currentRole = session.role;
    if (session.role === "admin") showPage("page-admin");
    else showPage("page-user");
    updateNavName();
  }
}

// ---- NAVIGATION ----
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
  if (pageId === "page-user") loadAlerts();
  if (pageId === "page-admin") { loadAdminAlerts(); loadResources(); loadReports(); loadSosAdmin(); }
}

function showSection(sectionId, btn) {
  document.querySelectorAll("#page-user .section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll("#page-user .sidebar-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("section-" + sectionId).classList.add("active");
  btn.classList.add("active");
  if (sectionId === "alerts") loadAlerts();
  if (sectionId === "dashboard") loadDashboard();
  if (sectionId === "map") loadMap();
}

function showAdminSection(sectionId, btn) {
  document.querySelectorAll("#page-admin .section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll("#page-admin .sidebar-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("section-" + sectionId).classList.add("active");
  btn.classList.add("active");
  if (sectionId === "resources") loadResources();
  if (sectionId === "reports") loadReports();
  if (sectionId === "sos-admin") loadSosAdmin();
  if (sectionId === "send-alert") loadAdminAlerts();
}

// ---- LOGIN / LOGOUT ----
function switchTab(role) {
  currentRole = role;
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  event.target.classList.add("active");
  document.getElementById("login-username").value = "";
  document.getElementById("login-password").value = "";
  document.getElementById("login-error").textContent = "";
}

function handleLogin() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();
  const errorEl = document.getElementById("login-error");
  errorEl.textContent = "";

  if (!username || !password) { errorEl.textContent = "Please enter both username and password."; return; }

  const db = currentRole === "admin" ? ADMINS : USERS;
  const found = db.find(u => u.username === username && u.password === password);

  if (!found) { errorEl.textContent = "❌ Invalid username or password."; return; }

  currentUser = found;
  sessionStorage.setItem("session", JSON.stringify(found));
  updateNavName();

  if (found.role === "admin") showPage("page-admin");
  else showPage("page-user");
}

function logout() {
  sessionStorage.removeItem("session");
  currentUser = null;
  showPage("page-login");
}

function updateNavName() {
  const el = document.getElementById(currentUser.role === "admin" ? "admin-username" : "nav-username");
  if (el) el.textContent = "👤 " + currentUser.name;
}

// ---- SOS ----
function sendSOS() {
  const requests = JSON.parse(localStorage.getItem("sos_requests")) || [];
  const newSOS = {
    id: Date.now(),
    user: currentUser.name,
    time: new Date().toLocaleTimeString(),
    date: new Date().toLocaleDateString(),
    status: "Pending"
  };
  requests.push(newSOS);
  localStorage.setItem("sos_requests", JSON.stringify(requests));

  const statusEl = document.getElementById("sos-status");
  statusEl.style.display = "block";
  statusEl.className = "status-box status-success";
  statusEl.innerHTML = "✅ SOS Alert Sent! Help is on the way.<br/><small>Request ID: #" + newSOS.id + " | Time: " + newSOS.time + "</small>";
}

// ---- REPORT DISASTER ----
function submitDisaster() {
  const type = document.getElementById("disaster-type").value;
  const location = document.getElementById("disaster-location").value.trim();
  const severity = document.getElementById("disaster-severity").value;
  const desc = document.getElementById("disaster-desc").value.trim();
  const statusEl = document.getElementById("report-status");

  if (!type || !location || !severity) {
    statusEl.style.display = "block";
    statusEl.className = "status-box status-error";
    statusEl.textContent = "❌ Please fill in all required fields.";
    return;
  }

  const disasters = JSON.parse(localStorage.getItem("disasters")) || [];
  disasters.push({
    id: Date.now(),
    type, location, severity, desc,
    reportedBy: currentUser.name,
    time: new Date().toLocaleString(),
    resolved: false
  });
  localStorage.setItem("disasters", JSON.stringify(disasters));

  statusEl.style.display = "block";
  statusEl.className = "status-box status-success";
  statusEl.textContent = "✅ Disaster reported successfully! Authorities have been notified.";

  document.getElementById("disaster-type").value = "";
  document.getElementById("disaster-location").value = "";
  document.getElementById("disaster-severity").value = "";
  document.getElementById("disaster-desc").value = "";
}

// ---- LOAD ALERTS (USER) ----
function loadAlerts() {
  const alerts = JSON.parse(localStorage.getItem("alerts")) || [];
  const container = document.getElementById("alerts-list");
  if (alerts.length === 0) { container.innerHTML = '<p class="empty-msg">No active alerts right now.</p>'; return; }
  container.innerHTML = alerts.map(a => `
    <div class="alert-card">
      <div>
        <div class="alert-msg">⚠️ ${a.message}</div>
        <div class="alert-meta">🕐 ${a.time} &nbsp;|&nbsp; Type: ${a.type}</div>
      </div>
      <span class="alert-badge">ACTIVE</span>
    </div>
  `).join("");
}

// ---- ADMIN: SEND ALERT ----
function sendAlert() {
  const type = document.getElementById("alert-type").value;
  const message = document.getElementById("alert-message").value.trim();
  const statusEl = document.getElementById("alert-sent-status");

  if (!message) { statusEl.style.display = "block"; statusEl.className = "status-box status-error"; statusEl.textContent = "❌ Please enter an alert message."; return; }

  const alerts = JSON.parse(localStorage.getItem("alerts")) || [];
  alerts.unshift({ id: Date.now(), message, type, time: "Just now", active: true });
  localStorage.setItem("alerts", JSON.stringify(alerts));

  statusEl.style.display = "block";
  statusEl.className = "status-box status-success";
  statusEl.textContent = "✅ Alert broadcasted to all users!";
  document.getElementById("alert-message").value = "";
  loadAdminAlerts();
}

function loadAdminAlerts() {
  const alerts = JSON.parse(localStorage.getItem("alerts")) || [];
  const container = document.getElementById("admin-alerts-list");
  if (alerts.length === 0) { container.innerHTML = '<p class="empty-msg">No alerts sent yet.</p>'; return; }
  container.innerHTML = alerts.map(a => `
    <div class="alert-card">
      <div>
        <div class="alert-msg">📢 ${a.message}</div>
        <div class="alert-meta">Type: ${a.type} &nbsp;|&nbsp; ${a.time}</div>
      </div>
      <button onclick="deleteAlert(${a.id})" style="background:#450a0a;border:none;color:#fca5a5;padding:6px 12px;border-radius:6px;cursor:pointer;">Delete</button>
    </div>
  `).join("");
}

function deleteAlert(id) {
  let alerts = JSON.parse(localStorage.getItem("alerts")) || [];
  alerts = alerts.filter(a => a.id !== id);
  localStorage.setItem("alerts", JSON.stringify(alerts));
  loadAdminAlerts();
}

// ---- ADMIN: RESOURCES ----
function loadResources() {
  const resources = JSON.parse(localStorage.getItem("resources")) || [];
  const select = document.getElementById("resource-select");
  if (select) select.innerHTML = resources.map(r => `<option value="${r.id}">${r.name}</option>`).join("");

  const container = document.getElementById("resources-list");
  container.innerHTML = `
    <table class="resource-table">
      <thead><tr><th>Resource</th><th>Total</th><th>Assigned</th><th>Available</th><th>Location</th></tr></thead>
      <tbody>
        ${resources.map(r => `
          <tr>
            <td>${r.name}</td>
            <td>${r.total}</td>
            <td>${r.assigned}</td>
            <td>${r.total - r.assigned}</td>
            <td>${r.location}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function assignResource() {
  const id = parseInt(document.getElementById("resource-select").value);
  const qty = parseInt(document.getElementById("resource-qty").value);
  const location = document.getElementById("resource-location").value.trim();
  const statusEl = document.getElementById("resource-status");

  let resources = JSON.parse(localStorage.getItem("resources")) || [];
  const res = resources.find(r => r.id === id);

  if (!qty || !location) { statusEl.style.display = "block"; statusEl.className = "status-box status-error"; statusEl.textContent = "❌ Please fill in quantity and location."; return; }
  if (qty > (res.total - res.assigned)) { statusEl.style.display = "block"; statusEl.className = "status-box status-error"; statusEl.textContent = "❌ Not enough resources available."; return; }

  res.assigned += qty;
  res.location = location;
  localStorage.setItem("resources", JSON.stringify(resources));
  statusEl.style.display = "block";
  statusEl.className = "status-box status-success";
  statusEl.textContent = `✅ ${qty} ${res.name} assigned to ${location}`;
  loadResources();
}

// ---- ADMIN: REPORTS ----
function loadReports() {
  const disasters = JSON.parse(localStorage.getItem("disasters")) || [];
  const container = document.getElementById("reports-list");
  if (disasters.length === 0) { container.innerHTML = '<p class="empty-msg">No disaster reports submitted yet.</p>'; return; }
  container.innerHTML = disasters.reverse().map(d => `
    <div class="report-card">
      <h4>${d.type} <span class="badge badge-${d.severity}">${d.severity.toUpperCase()}</span> ${d.resolved ? '<span class="badge badge-resolved">RESOLVED</span>' : ''}</h4>
      <p>📍 Location: ${d.location}</p>
      <p>👤 Reported by: ${d.reportedBy} &nbsp;|&nbsp; 🕐 ${d.time}</p>
      ${d.desc ? `<p>📝 ${d.desc}</p>` : ""}
      ${!d.resolved ? `<button onclick="resolveDisaster(${d.id})" style="margin-top:10px;padding:7px 16px;background:#1e3a5f;border:none;color:#93c5fd;border-radius:6px;cursor:pointer;">✔ Mark Resolved</button>` : ""}
    </div>
  `).join("");
}

function resolveDisaster(id) {
  let disasters = JSON.parse(localStorage.getItem("disasters")) || [];
  disasters = disasters.map(d => d.id === id ? { ...d, resolved: true } : d);
  localStorage.setItem("disasters", JSON.stringify(disasters));
  loadReports();
}

// ---- ADMIN: SOS REQUESTS ----
function loadSosAdmin() {
  const sos = JSON.parse(localStorage.getItem("sos_requests")) || [];
  const container = document.getElementById("sos-admin-list");
  if (sos.length === 0) { container.innerHTML = '<p class="empty-msg">No SOS requests yet.</p>'; return; }
  container.innerHTML = sos.reverse().map(s => `
    <div class="report-card" style="border-left-color:#ef4444">
      <h4>🆘 SOS from ${s.user}</h4>
      <p>🕐 ${s.date} at ${s.time} &nbsp;|&nbsp; Status: <b style="color:#fbbf24">${s.status}</b></p>
      <button onclick="respondSOS(${s.id})" style="margin-top:10px;padding:7px 16px;background:#064e3b;border:none;color:#6ee7b7;border-radius:6px;cursor:pointer;">✔ Mark Responded</button>
    </div>
  `).join("");
}

function respondSOS(id) {
  let sos = JSON.parse(localStorage.getItem("sos_requests")) || [];
  sos = sos.map(s => s.id === id ? { ...s, status: "Responded" } : s);
  localStorage.setItem("sos_requests", JSON.stringify(sos));
  loadSosAdmin();
}

// ---- REAL-TIME TICKER SIMULATION ----
function startRealTimeTicker() {
  const messages = [
    "⚠️ Cyclone warning active for coastal Maharashtra",
    "🌊 Flood alert in low-lying areas of Mumbai",
    "🚨 NDRF teams deployed to Raigad district",
    "🌧️ Heavy rainfall expected in next 24 hours",
    "✅ Relief camps set up at 5 locations in Thane"
  ];
  let i = 0;
  setInterval(() => {
    const existing = document.querySelector(".ticker");
    if (!existing) {
      const ticker = document.createElement("div");
      ticker.className = "ticker";
      document.querySelector(".navbar") && document.querySelector(".navbar").after(ticker);
    }
    const ticker = document.querySelector(".ticker");
    if (ticker) { ticker.textContent = messages[i % messages.length]; i++; }
  }, 4000);
}
// =====================
// DASHBOARD + MAP
// =====================

function loadDashboard() {
  const disasters = JSON.parse(localStorage.getItem("disasters")) || [];
  const alerts = JSON.parse(localStorage.getItem("alerts")) || [];

  document.getElementById("stat-total").textContent = disasters.length;
  document.getElementById("stat-high").textContent = disasters.filter(d => d.severity === "high").length;
  document.getElementById("stat-resolved").textContent = disasters.filter(d => d.resolved).length;
  document.getElementById("stat-alerts").textContent = alerts.length;

  renderTypeChart(disasters);
  renderSeverityChart(disasters);
}

function renderTypeChart(disasters) {
  const ctx = document.getElementById("chart-type").getContext("2d");
  const types = ["Flood","Earthquake","Cyclone","Landslide","Fire","Drought","Other"];
  const counts = types.map(t => disasters.filter(d => d.type === t).length);

  if (window.chartType) window.chartType.destroy();
  window.chartType = new Chart(ctx, {
    type: "bar",
    data: {
      labels: types,
      datasets: [{ label: "Reports", data: counts,
        backgroundColor: ["#3b82f6","#f59e0b","#ef4444","#8b5cf6","#f97316","#10b981","#64748b"],
        borderRadius: 6, borderSkipped: false }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#94a3b8", font: { size: 11 } }, grid: { color: "#1e293b" } },
        y: { ticks: { color: "#94a3b8", stepSize: 1 }, grid: { color: "#334155" }, beginAtZero: true }
      }
    }
  });
}

function renderSeverityChart(disasters) {
  const ctx = document.getElementById("chart-severity").getContext("2d");
  const low = disasters.filter(d => d.severity === "low").length;
  const med = disasters.filter(d => d.severity === "medium").length;
  const high = disasters.filter(d => d.severity === "high").length;

  if (window.chartSeverity) window.chartSeverity.destroy();
  window.chartSeverity = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Low", "Medium", "High"],
      datasets: [{ data: [low, med, high],
        backgroundColor: ["#22c55e","#fbbf24","#ef4444"],
        borderColor: "#0f172a", borderWidth: 3 }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#94a3b8", font: { size: 12 } } }
      }
    }
  });
}

// ---- MAP ----
function loadMap() {
  const disasters = JSON.parse(localStorage.getItem("disasters")) || [];
  const container = document.getElementById("map-container");

  if (!container) return;

  const colorMap = { high: "#ef4444", medium: "#fbbf24", low: "#22c55e" };

  const baseLocations = [
    { name: "Mumbai",     lat: 19.076, lng: 72.877 },
    { name: "Thane",      lat: 19.218, lng: 72.978 },
    { name: "Pune",       lat: 18.520, lng: 73.856 },
    { name: "Navi Mumbai",lat: 19.033, lng: 73.029 },
    { name: "Vasai",      lat: 19.360, lng: 72.800 },
    { name: "Raigad",     lat: 18.515, lng: 73.118 },
    { name: "Nashik",     lat: 19.997, lng: 73.789 },
    { name: "Kolhapur",   lat: 16.705, lng: 74.243 }
  ];

  const minLat = 15.5, maxLat = 22.0;
  const minLng = 72.5, maxLng = 80.5;
  const W = 800, H = 480;

  function toX(lng) {
    return ((lng - minLng) / (maxLng - minLng)) * (W - 100) + 50;
  }
  function toY(lat) {
    return H - (((lat - minLat) / (maxLat - minLat)) * (H - 80)) - 40;
  }

  // Match disasters to locations
  const pins = disasters.map((d, i) => {
    const match = baseLocations.find(l =>
      d.location.toLowerCase().includes(l.name.toLowerCase())
    );
    const loc = match || baseLocations[i % baseLocations.length];
    return {
      x: toX(loc.lng),
      y: toY(loc.lat),
      name: loc.name,
      type: d.type,
      severity: d.severity
    };
  });

  // City dots
  const cityDots = baseLocations.map(c => `
    <circle cx="${toX(c.lng)}" cy="${toY(c.lat)}" r="4"
      fill="#475569" stroke="#64748b" stroke-width="1"/>
    <text x="${toX(c.lng) + 8}" y="${toY(c.lat) + 4}"
      font-size="11" fill="#64748b"
      font-family="Segoe UI, sans-serif">${c.name}</text>
  `).join("");

  // Disaster pins
  const pinsSVG = pins.length === 0
    ? `<text x="${W/2}" y="${H/2}"
        text-anchor="middle" font-size="14"
        fill="#475569" font-family="Segoe UI, sans-serif">
        No disasters reported yet. Submit a report to see pins here.
       </text>`
    : pins.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="16"
          fill="${colorMap[p.severity] || '#94a3b8'}" opacity="0.2"/>
        <circle cx="${p.x}" cy="${p.y}" r="8"
          fill="${colorMap[p.severity] || '#94a3b8'}"
          stroke="white" stroke-width="2"/>
        <text x="${p.x}" y="${p.y - 22}"
          text-anchor="middle" font-size="11"
          fill="#f1f5f9" font-family="Segoe UI, sans-serif">${p.type}</text>
        <text x="${p.x}" y="${p.y - 10}"
          text-anchor="middle" font-size="10"
          fill="#94a3b8" font-family="Segoe UI, sans-serif">${p.name}</text>
      `).join("");

  // Maharashtra outline (simplified)
  const mahaPoints = [
    [72.6,20.4],[73.3,20.9],[74.2,21.8],[75.5,21.9],
    [77.0,21.5],[79.0,21.0],[80.4,20.2],[80.3,18.5],
    [79.0,17.0],[77.5,16.0],[76.0,15.7],[74.5,16.5],
    [73.3,17.2],[72.7,18.2],[72.5,19.2]
  ].map(([lng, lat]) => `${toX(lng)},${toY(lat)}`).join(" ");

  const svgHTML = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="100%" height="100%"
         viewBox="0 0 ${W} ${H}"
         style="display:block;background:#0f172a;">

      <!-- Maharashtra region fill -->
      <polygon points="${mahaPoints}"
        fill="#1a2744" stroke="#3b82f6"
        stroke-width="1.5" stroke-linejoin="round"/>

      <!-- Arabian Sea label -->
      <text x="60" y="300"
        font-size="12" fill="#1e4a6b"
        font-style="italic"
        font-family="Segoe UI, sans-serif">Arabian Sea</text>

      <!-- City reference dots -->
      ${cityDots}

      <!-- Disaster pins -->
      ${pinsSVG}

      <!-- Map title -->
      <rect x="0" y="0" width="${W}" height="34" fill="#0f172a" opacity="0.7"/>
      <text x="20" y="22"
        font-size="13" fill="#94a3b8"
        font-family="Segoe UI, sans-serif">
        Maharashtra — Disaster Map
      </text>
    </svg>
  `;

  container.style.background = "#0f172a";
  container.style.borderRadius = "12px";
  container.style.overflow = "hidden";
  container.style.height = "480px";
  container.innerHTML = svgHTML;
}