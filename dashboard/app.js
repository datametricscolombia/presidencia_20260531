const BASE_URL = "https://datametricscolombia.github.io/presidencia_20260531";
let indexData = {};
let cache = {};
let chart = null;
let currentData = null;

// ===============================
// CACHE INTELIGENTE
// ===============================
async function fetchConCache(url) {

    if (cache[url]) return cache[url];

    const stored = localStorage.getItem(url);
    if (stored) {
        cache[url] = JSON.parse(stored);
        return cache[url];
    }

    const response = await fetch(url);
    const data = await response.json();

    cache[url] = data;
    localStorage.setItem(url, JSON.stringify(data));

    return data;
}

// ===============================
// CARGAR INDEX
// ===============================
async function cargarIndex() {
    indexData = await fetchConCache(`${BASE_URL}/index_hierarquico.json`);
    mostrarPais();
}

// ===============================
// PAÍS
// ===============================
async function mostrarPais() {
    const data = await fetchConCache(indexData.pais.url);
    actualizarVista("País", data, null);
}

// ===============================
// DEPARTAMENTO
// ===============================
async function mostrarDepartamento(cod) {
    const dep = indexData.departamentos[cod];
    const data = await fetchConCache(dep.url);
    actualizarVista(dep.nombre, data, cod);
}

// ===============================
// ACTUALIZAR UI
// ===============================
function actualizarVista(nombre, data, codDep) {

    currentData = data;

    // Breadcrumb
    const bc = document.getElementById("breadcrumb");
    bc.innerHTML = `
      <li class="breadcrumb-item"><a href="#" onclick="mostrarPais()">País</a></li>
      ${codDep ? `<li class="breadcrumb-item active">${nombre}</li>` : ""}
    `;

    // Totales
    document.getElementById("totalVotos").innerText = data.total_votos || 0;
    document.getElementById("totalMesas").innerText = data.total_mesas || 0;

    // Gráfico
    renderGrafico(data.resultados);

    // Ranking
    renderRanking(data.resultados);

    // Lista departamentos si estamos en país
    if (!codDep) {
        mostrarListaDepartamentos();
    }
}

// ===============================
// LISTA DEPARTAMENTOS
// ===============================
function mostrarListaDepartamentos() {

    const rankingDiv = document.getElementById("ranking");
    rankingDiv.innerHTML = "<h6>Seleccione Departamento</h6>";

    Object.entries(indexData.departamentos).forEach(([cod, dep]) => {
        rankingDiv.innerHTML += `
            <div>
              <a href="#" onclick="mostrarDepartamento('${cod}')">
                ${dep.nombre}
              </a>
            </div>
        `;
    });
}

// ===============================
// GRÁFICO
// ===============================
function renderGrafico(resultados) {

    const ctx = document.getElementById("grafico");

    const partidos = Object.keys(resultados);
    const votos = Object.values(resultados);

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: partidos,
            datasets: [{
                label: 'Votos',
                data: votos
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// ===============================
// RANKING DINÁMICO
// ===============================
function renderRanking(resultados) {

    const rankingDiv = document.getElementById("ranking");

    const ordenado = Object.entries(resultados)
        .sort((a,b) => b[1] - a[1]);

    rankingDiv.innerHTML = "";

    ordenado.forEach(([candidato, votos], index) => {
        rankingDiv.innerHTML += `
          <div class="d-flex justify-content-between border-bottom py-1">
            <span>${index+1}. ${candidato}</span>
            <strong>${votos}</strong>
          </div>
        `;
    });
}

// ===============================
// DESCARGAR CSV
// ===============================
function descargarCSV() {

    if (!currentData) return;

    let csv = "Candidato,Votos\n";

    Object.entries(currentData.resultados).forEach(([p,v]) => {
        csv += `${p},${v}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "resultados.csv";
    a.click();
}

// ===============================
cargarIndex();