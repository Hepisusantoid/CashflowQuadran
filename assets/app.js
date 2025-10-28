// assets/app.js

// ===== Helper Format Angka =====
function formatNumberID(num) {
    if (num === "" || num === null || num === undefined) return "";
    const n = typeof num === "string" ? parseInt(num, 10) : num;
    if (isNaN(n)) return "";
    return n.toLocaleString("id-ID"); // titik ribuan
}

function formatRupiah(num) {
    const formatted = formatNumberID(num);
    return "Rp" + (formatted === "" ? "0" : formatted);
}

// "100.000.000" -> 100000000
function parseNumberFromIDFormat(str) {
    if (!str) return 0;
    const digitsOnly = str.replace(/\D/g, "");
    return digitsOnly === "" ? 0 : parseInt(digitsOnly, 10);
}

// ===== State Global =====
let incomeData = [];
let donutChart = null;
let lineChart = null;
let tableBodyEl = null;

// ===== DOM Refs =====
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginForm = document.getElementById("loginForm");
const loginErrorBox = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");
const addIncomeForm = document.getElementById("addIncomeForm");
const amountInput = document.getElementById("amountInput");
const summaryYearEl = document.getElementById("summaryYear");
const donutYearLabelEl = document.getElementById("donutYearLabel");

const amountEEl = document.getElementById("amountE");
const amountSEl = document.getElementById("amountS");
const amountBEl = document.getElementById("amountB");
const amountIEl = document.getElementById("amountI");

const percentEEl = document.getElementById("percentE");
const percentSEl = document.getElementById("percentS");
const percentBEl = document.getElementById("percentB");
const percentIEl = document.getElementById("percentI");

const donutLegendBox = document.getElementById("donutLegend");
const incomeTableBody = document.querySelector("#incomeTable tbody");

// ===== Session login =====
function isLoggedIn() {
    return localStorage.getItem("loggedIn") === "true";
}
function showLogin() {
    loginSection.classList.remove("hidden");
    dashboardSection.classList.add("hidden");
}
function showDashboard() {
    loginSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");
}

// ===== Backend Calls =====

// POST /api/login
async function apiLogin(username, password) {
    const res = await fetch("/api/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username, password })
    });
    return res.json(); // {success:true/false}
}

// GET /api/getData
async function apiGetData() {
    const res = await fetch("/api/getData");
    return res.json(); // {success:true, data:[...]} atau {success:false,...}
}

// POST /api/saveData
async function apiSaveData(newItem) {
    const res = await fetch("/api/saveData", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(newItem)
    });
    return res.json(); // {success:true, data:[...]} setelah update
}

// POST /api/deleteData
async function apiDeleteData(id) {
    const res = await fetch("/api/deleteData", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({id})
    });
    return res.json(); // {success:true, data:[...]} setelah hapus
}

// ===== Data Utils =====
function getYearlyTotals() {
    // hasil: { "2025": {E:...,S:...,B:...,I:...}, ... }
    const yearly = {};
    incomeData.forEach(item => {
        const y = String(item.year);
        const q = item.quadrant ? item.quadrant.toUpperCase() : "";
        const amt = Number(item.amount) || 0;
        if (!yearly[y]) {
            yearly[y] = { E:0, S:0, B:0, I:0 };
        }
        if (!yearly[y][q]) {
            yearly[y][q] = 0;
        }
        yearly[y][q] += amt;
    });
    return yearly;
}
function getLatestYear(yearlyTotalsObj) {
    const years = Object.keys(yearlyTotalsObj)
        .map(y => parseInt(y,10))
        .sort((a,b)=>a-b);
    if (years.length === 0) return null;
    return years[years.length - 1].toString();
}

// ===== Render Summary Cards =====
function updateSummaryCards() {
    const yearlyTotals = getYearlyTotals();
    const latestYear = getLatestYear(yearlyTotals);

    const zeroObj = {E:0,S:0,B:0,I:0};
    let dataYear = zeroObj;
    if (latestYear && yearlyTotals[latestYear]) {
        dataYear = yearlyTotals[latestYear];
    }

    const totalAll =
        (dataYear.E||0) + (dataYear.S||0) +
        (dataYear.B||0) + (dataYear.I||0);

    summaryYearEl.textContent = latestYear ? latestYear : "-";
    donutYearLabelEl.textContent = latestYear ? latestYear : "-";

    function pct(part, whole){
        if (!whole || whole===0) return "0%";
        return ((part/whole)*100).toFixed(1) + "%";
    }

    amountEEl.textContent = formatRupiah(dataYear.E||0);
    amountSEl.textContent = formatRupiah(dataYear.S||0);
    amountBEl.textContent = formatRupiah(dataYear.B||0);
    amountIEl.textContent = formatRupiah(dataYear.I||0);

    percentEEl.textContent = pct(dataYear.E||0, totalAll);
    percentSEl.textContent = pct(dataYear.S||0, totalAll);
    percentBEl.textContent = pct(dataYear.B||0, totalAll);
    percentIEl.textContent = pct(dataYear.I||0, totalAll);
}

// ===== Render Donut Chart =====
function renderDonutChart() {
    const yearlyTotals = getYearlyTotals();
    const latestYear = getLatestYear(yearlyTotals);

    const donutCtx = document.getElementById("donutChart").getContext("2d");

    const dataYear = (latestYear && yearlyTotals[latestYear])
        ? yearlyTotals[latestYear]
        : {E:0,S:0,B:0,I:0};

    const donutDataArr = [
        dataYear.E||0,
        dataYear.S||0,
        dataYear.B||0,
        dataYear.I||0
    ];

    if (donutChart) donutChart.destroy();

    donutChart = new Chart(donutCtx, {
        type: 'doughnut',
        data: {
            labels: ["E", "S", "B", "I"],
            datasets: [{
                data: donutDataArr,
                backgroundColor: [
                    "#4ade80", // E
                    "#22c55e", // S
                    "#0ea5e9", // B
                    "#a855f7"  // I
                ],
                borderColor: "#000000",
                borderWidth: 2
            }]
        },
        options: {
            plugins: {
                legend: { display: false }
            },
            cutout: "60%"
        }
    });

    // Legend bawah donut
    const totalAll = donutDataArr.reduce((a,b)=>a+b,0);
    donutLegendBox.innerHTML = "";

    const quadInfo = [
        {label:"E - Employee", color:"#4ade80", val:dataYear.E||0},
        {label:"S - Self Employed", color:"#22c55e", val:dataYear.S||0},
        {label:"B - Business", color:"#0ea5e9", val:dataYear.B||0},
        {label:"I - Investor", color:"#a855f7", val:dataYear.I||0}
    ];

    quadInfo.forEach(q => {
        const percent = (!totalAll || totalAll===0)
            ? "0%"
            : ((q.val/totalAll)*100).toFixed(1)+"%";

        const itemDiv = document.createElement("div");
        itemDiv.className = "legend-item";

        itemDiv.innerHTML = `
            <div class="legend-row-top">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div class="legend-color" style="background:${q.color};"></div>
                    <div class="legend-q">${q.label}</div>
                </div>
                <div class="legend-percent">${percent}</div>
            </div>
            <div class="legend-amount">${formatRupiah(q.val||0)}</div>
        `;
        donutLegendBox.appendChild(itemDiv);
    });
}

// ===== Render Line Chart =====
function renderLineChart() {
    const yearlyTotals = getYearlyTotals();
    const yearsSorted = Object.keys(yearlyTotals)
        .map(y => parseInt(y,10))
        .sort((a,b)=>a-b)
        .map(y => y.toString());

    const dataE = yearsSorted.map(y => yearlyTotals[y].E || 0);
    const dataS = yearsSorted.map(y => yearlyTotals[y].S || 0);
    const dataB = yearsSorted.map(y => yearlyTotals[y].B || 0);
    const dataI = yearsSorted.map(y => yearlyTotals[y].I || 0);

    const lineCtx = document.getElementById("lineChart").getContext("2d");

    if (lineChart) lineChart.destroy();

    lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: yearsSorted,
            datasets: [
                {
                    label: "E",
                    data: dataE,
                    borderColor: "#4ade80",
                    backgroundColor: "#4ade80",
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 3
                },
                {
                    label: "S",
                    data: dataS,
                    borderColor: "#22c55e",
                    backgroundColor: "#22c55e",
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 3
                },
                {
                    label: "B",
                    data: dataB,
                    borderColor: "#0ea5e9",
                    backgroundColor: "#0ea5e9",
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 3
                },
                {
                    label: "I",
                    data: dataI,
                    borderColor: "#a855f7",
                    backgroundColor: "#a855f7",
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: "#ffffff",
                        font: { size: 10 }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: "#ffffff",
                        font: { size: 10 }
                    },
                    grid: {
                        color: "rgba(255,255,255,0.08)"
                    }
                },
                y: {
                    ticks: {
                        color: "#ffffff",
                        font: { size: 10 },
                        callback: function(value) {
                            return "Rp" + Number(value).toLocaleString("id-ID");
                        }
                    },
                    grid: {
                        color: "rgba(255,255,255,0.08)"
                    }
                }
            }
        }
    });
}

// ===== Render Table =====
function renderTable() {
    incomeTableBody.innerHTML = "";

    const sorted = [...incomeData].sort((a,b) => {
        if (b.year !== a.year) return b.year - a.year;
        return (b.amount||0) - (a.amount||0);
    });

    sorted.forEach(item => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${item.year || "-"}</td>
            <td>${item.quadrant || "-"}</td>
            <td>${item.sector || "-"}</td>
            <td class="text-right">${formatRupiah(item.amount||0)}</td>
            <td>
                <button class="btn-del" data-id="${item.id}">Hapus</button>
            </td>
        `;

        incomeTableBody.appendChild(tr);
    });
}

// ===== FULL RENDER (dipanggil tiap habis update data) =====
function renderAll() {
    updateSummaryCards();
    renderDonutChart();
    renderLineChart();
    renderTable();
}

// ===== Event Handlers =====

// Login
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUser").value.trim();
    const password = document.getElementById("loginPass").value.trim();

    const result = await apiLogin(username, password);

    if (result && result.success) {
        loginErrorBox.style.display = "none";
        localStorage.setItem("loggedIn", "true");
        showDashboard();
        await reloadDataFromServer();
    } else {
        loginErrorBox.style.display = "block";
    }
});

// Logout
logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("loggedIn");
    if (donutChart) { donutChart.destroy(); donutChart = null; }
    if (lineChart) { lineChart.destroy(); lineChart = null; }
    incomeData = [];
    showLogin();
});

// Tambah Income
addIncomeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const yearVal = document.getElementById("yearInput").value.trim();
    const quadVal = document.getElementById("quadrantInput").value.trim();
    const sectorVal = document.getElementById("sectorInput").value.trim();
    const amountFormatted = document.getElementById("amountInput").value.trim();

    const amountNum = parseNumberFromIDFormat(amountFormatted);

    if (!yearVal || !quadVal || !sectorVal || !amountNum) {
        alert("Lengkapi semua field.");
        return;
    }

    const newItem = {
        year: parseInt(yearVal, 10),
        quadrant: quadVal.toUpperCase(),
        sector: sectorVal,
        amount: amountNum
    };

    const result = await apiSaveData(newItem);
    if (!result || !result.success) {
        alert("Gagal menyimpan data ke server.");
        return;
    }

    incomeData = result.data;
    renderAll();

    e.target.reset();
});

// Input format ribuan realtime
amountInput.addEventListener("input", (e) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "");
    e.target.value = formatNumberID(digits);
});

// Delete income (event delegation di tabel)
incomeTableBody.addEventListener("click", async (e) => {
    if (e.target.classList.contains("btn-del")) {
        const id = e.target.getAttribute("data-id");
        const yakin = confirm("Hapus data ini?");
        if (!yakin) return;

        const result = await apiDeleteData(id);
        if (!result || !result.success) {
            alert("Gagal hapus data.");
            return;
        }

        incomeData = result.data;
        renderAll();
    }
});

// ===== Load data setelah login =====
async function reloadDataFromServer() {
    const result = await apiGetData();
    if (!result || !result.success) {
        alert("Gagal ambil data dari server. (Cek env BIN_ID / KEY di backend)");
        incomeData = [];
    } else {
        incomeData = result.data;
    }
    renderAll();
}

// ===== On page load =====
document.addEventListener("DOMContentLoaded", async () => {
    if (isLoggedIn()) {
        showDashboard();
        await reloadDataFromServer();
    } else {
        showLogin();
    }
});
