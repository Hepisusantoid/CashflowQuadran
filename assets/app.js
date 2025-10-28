// assets/app.js

// ===== Helper =====
function formatNumberID(num) {
    if (num === "" || num === null || num === undefined) return "";
    const n = typeof num === "string" ? parseInt(num, 10) : num;
    if (isNaN(n)) return "";
    return n.toLocaleString("id-ID");
}
function formatRupiah(num) {
    const formatted = formatNumberID(num);
    return "Rp" + (formatted === "" ? "0" : formatted);
}
function parseNumberFromIDFormat(str) {
    if (!str) return 0;
    const digitsOnly = str.replace(/\D/g, "");
    return digitsOnly === "" ? 0 : parseInt(digitsOnly, 10);
}

// ===== State =====
let incomeData = [];
let donutChart = null;
let lineChart = null;

let currentEditId = null; // null = mode tambah, bukan edit

// ===== DOM =====
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginForm = document.getElementById("loginForm");
const loginErrorBox = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");

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

const incomeForm = document.getElementById("incomeForm");
const editIdInput = document.getElementById("editId");
const yearInput = document.getElementById("yearInput");
const quadrantInput = document.getElementById("quadrantInput");
const sectorInput = document.getElementById("sectorInput");
const amountInput = document.getElementById("amountInput");

const saveBtnLabel = document.getElementById("saveBtnLabel");
const cancelEditBtn = document.getElementById("cancelEditBtn");

// ===== Session =====
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

// ===== API calls =====
async function apiLogin(username, password) {
    const res = await fetch("/api/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username, password })
    });
    return res.json();
}
async function apiGetData() {
    const res = await fetch("/api/getData");
    return res.json();
}
async function apiSaveData(newItem) {
    const res = await fetch("/api/saveData", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(newItem)
    });
    return res.json();
}
async function apiUpdateData(updatedItem) {
    const res = await fetch("/api/updateData", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(updatedItem)
    });
    return res.json();
}
async function apiDeleteData(id) {
    const res = await fetch("/api/deleteData", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ id })
    });
    return res.json();
}

// ===== Data transform =====
function getYearlyTotals() {
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

// ===== RENDER SUMMARY =====
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

// ===== RENDER DONUT =====
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

        const div = document.createElement("div");
        div.className = "donut-legend-item";
        div.innerHTML = `
            <div class="donut-row-top">
                <div class="donut-left">
                    <div class="donut-dot" style="background:${q.color};"></div>
                    <div>${q.label}</div>
                </div>
                <div class="donut-percent">${percent}</div>
            </div>
            <div class="donut-amount">${formatRupiah(q.val||0)}</div>
        `;
        donutLegendBox.appendChild(div);
    });
}

// ===== RENDER LINE CHART =====
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
                legend: { display: false }
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

// ===== RENDER TABLE =====
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
                <div class="row-actions">
                    <button class="btn-small btn-edit" data-id="${item.id}">Edit</button>
                    <button class="btn-del btn-delete" data-id="${item.id}">Hapus</button>
                </div>
            </td>
        `;
        incomeTableBody.appendChild(tr);
    });
}

// ===== RENDER ALL =====
function renderAll() {
    updateSummaryCards();
    renderDonutChart();
    renderLineChart();
    renderTable();
}

// ===== LOAD DATA AFTER LOGIN =====
async function reloadDataFromServer() {
    const result = await apiGetData();
    if (!result || !result.success) {
        alert("Gagal ambil data dari server. Cek pengaturan ENV BIN_ID / JSONBIN_API_KEY di backend.");
        incomeData = [];
    } else {
        incomeData = result.data;
    }
    renderAll();
}

// ===== FORM MODE HANDLING (TAMBAH vs EDIT) =====
function setFormToAddMode() {
    currentEditId = null;
    editIdInput.value = "";
    yearInput.value = "";
    quadrantInput.value = "";
    sectorInput.value = "";
    amountInput.value = "";

    saveBtnLabel.textContent = "+ Tambah Data";
    cancelEditBtn.classList.add("hidden");
}
function setFormToEditMode(item) {
    currentEditId = item.id;
    editIdInput.value = item.id;
    yearInput.value = item.year;
    quadrantInput.value = item.quadrant;
    sectorInput.value = item.sector;
    amountInput.value = formatNumberID(item.amount);

    saveBtnLabel.textContent = "Update Data";
    cancelEditBtn.classList.remove("hidden");
}

// ===== EVENT: LOGIN =====
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

// ===== EVENT: LOGOUT =====
logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("loggedIn");
    if (donutChart) { donutChart.destroy(); donutChart = null; }
    if (lineChart) { lineChart.destroy(); lineChart = null; }
    incomeData = [];
    setFormToAddMode();
    showLogin();
});

// ===== EVENT: INPUT RIBUAN REALTIME =====
amountInput.addEventListener("input", (e) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "");
    e.target.value = formatNumberID(digits);
});

// ===== EVENT: SUBMIT FORM TAMBAH / UPDATE =====
incomeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const yearVal = yearInput.value.trim();
    const quadVal = quadrantInput.value.trim();
    const sectorVal = sectorInput.value.trim();
    const amountFormatted = amountInput.value.trim();
    const amountNum = parseNumberFromIDFormat(amountFormatted);

    if (!yearVal || !quadVal || !sectorVal || !amountNum) {
        alert("Lengkapi semua field.");
        return;
    }

    if (currentEditId) {
        // MODE EDIT
        const updatedItem = {
            id: currentEditId,
            year: parseInt(yearVal, 10),
            quadrant: quadVal.toUpperCase(),
            sector: sectorVal,
            amount: amountNum
        };
        const result = await apiUpdateData(updatedItem);
        if (!result || !result.success) {
            alert("Gagal update data.");
            return;
        }
        incomeData = result.data;
        renderAll();
        setFormToAddMode();
    } else {
        // MODE TAMBAH
        const newItem = {
            year: parseInt(yearVal, 10),
            quadrant: quadVal.toUpperCase(),
            sector: sectorVal,
            amount: amountNum
        };
        const result = await apiSaveData(newItem);
        if (!result || !result.success) {
            alert("Gagal menyimpan data.");
            return;
        }
        incomeData = result.data;
        renderAll();
        setFormToAddMode();
    }
});

// ===== EVENT: BATAL EDIT =====
cancelEditBtn.addEventListener("click", () => {
    setFormToAddMode();
});

// ===== EVENT: CLICK DI TABEL (EDIT / HAPUS) =====
incomeTableBody.addEventListener("click", async (e) => {
    // EDIT
    if (e.target.classList.contains("btn-edit")) {
        const id = e.target.getAttribute("data-id");
        const item = incomeData.find(d => d.id === id);
        if (!item) return;
        setFormToEditMode(item);
        return;
    }

    // HAPUS
    if (e.target.classList.contains("btn-delete")) {
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
        // kalau lagi edit item yang dihapus → reset form
        if (currentEditId === id) {
            setFormToAddMode();
        }
    }
});

// ===== INIT PAGE LOAD =====
document.addEventListener("DOMContentLoaded", async () => {
    if (isLoggedIn()) {
        showDashboard();
        await reloadDataFromServer();
    } else {
        showLogin();
    }
    setFormToAddMode();
});
