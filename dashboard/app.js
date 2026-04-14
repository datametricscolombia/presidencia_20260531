const BASE_URL = "https://datametricscolombia.github.io/presidencia_20260531/presidencia";

const INDEX_FILE = `${BASE_URL}/pais.json`;
const MESA_MAP_FILE = `${BASE_URL}/mesa_chunk_map.json`;

let INDEX_DATA = {};
let MESA_MAP = {};
const cache = {};


// ================================
// LIMPIAR RESULTADOS
// ================================
function limpiarResultados() {

    const table = document.getElementById("results-table");
    const tbody = table.querySelector("tbody");

    tbody.innerHTML = "";
    table.style.display = "none";

    const totalDiv = document.getElementById("total-votos");
    totalDiv.style.display = "none";
    totalDiv.textContent = "";

    const breadcrumb = document.getElementById("breadcrumb");
    if (breadcrumb) breadcrumb.innerHTML = "";

    // imagen
    const container = document.getElementById("imagen-container");
    const img = document.getElementById("imagen-mesa");
    const btn = document.getElementById("btn-ver-imagen");

    if (container) container.style.display = "none";

    if (img) {
        img.src = "";
        img.style.display = "none";
    }

    if (btn) btn.style.display = "block";

    // cerrar modal si estaba abierto
    const modal = document.getElementById("modal-imagen");
    if (modal) modal.style.display = "none";
}


// ================================
// INIT
// ================================
async function init() {

    try {
        await cargarMapaMesas();
        await cargarIndice();
    } catch (error) {
        console.error("Error inicializando app:", error);
    }
}


// ================================
// MAPA MESA → CHUNK
// ================================
async function cargarMapaMesas() {

    const res = await fetch(MESA_MAP_FILE + "?t=" + Date.now());

    if (!res.ok) throw new Error("No se pudo cargar mesa_chunk_map");

    MESA_MAP = await res.json();
}


// ================================
// CARGAR ÍNDICE
// ================================
async function cargarIndice() {

    const res = await fetch(INDEX_FILE + "?t=" + Date.now());

    if (!res.ok) throw new Error("No se pudo cargar pais.json");

    const data = await res.json();

    INDEX_DATA = data.index || {};

    llenarDepartamentos();
}


// ================================
// DEPARTAMENTOS
// ================================
function llenarDepartamentos() {

    const depSelect = document.getElementById("dep-select");

    depSelect.innerHTML = '<option value="">Seleccione departamento</option>';

    for (const depKey in INDEX_DATA) {

        const dep = INDEX_DATA[depKey];

        const option = document.createElement("option");
        option.value = depKey;
        option.textContent = dep.nombre;

        depSelect.appendChild(option);
    }
}


// ================================
// MUNICIPIOS
// ================================
function llenarMunicipios(depKey) {

    const munSelect = document.getElementById("mun-select");

    munSelect.innerHTML = '<option value="">Seleccione municipio</option>';

    if (!depKey) return;

    const dep = INDEX_DATA[depKey];

    for (const munKey in dep.municipios) {

        const mun = dep.municipios[munKey];

        const option = document.createElement("option");
        option.value = munKey;
        option.textContent = mun.nombre;

        munSelect.appendChild(option);
    }
}


// ================================
// ZONAS
// ================================
function llenarZonas(depKey, munKey) {

    const zonaSelect = document.getElementById("zona-select");

    zonaSelect.innerHTML = '<option value="">Seleccione zona</option>';

    if (!depKey || !munKey) return;

    const mun = INDEX_DATA[depKey].municipios[munKey];

    for (const zonaKey in mun.zonas) {

        const zona = mun.zonas[zonaKey];

        const option = document.createElement("option");
        option.value = zonaKey;
        option.textContent = zona.nombre;

        zonaSelect.appendChild(option);
    }
}


// ================================
// PUESTOS
// ================================
function llenarPuestos(depKey, munKey, zonaKey) {

    const puestoSelect = document.getElementById("puesto-select");

    puestoSelect.innerHTML = '<option value="">Seleccione puesto</option>';

    if (!depKey || !munKey || !zonaKey) return;

    const zona = INDEX_DATA[depKey].municipios[munKey].zonas[zonaKey];

    for (const puestoKey in zona.puestos) {

        const puesto = zona.puestos[puestoKey];

        const option = document.createElement("option");
        option.value = puestoKey;
        option.textContent = puesto.nombre;

        puestoSelect.appendChild(option);
    }
}


// ================================
// MESAS
// ================================
function llenarMesas(depKey, munKey, zonaKey, puestoKey) {

    const mesaSelect = document.getElementById("mesa-select");

    mesaSelect.innerHTML = '<option value="">Seleccione mesa</option>';

    if (!depKey || !munKey || !zonaKey || !puestoKey) return;

    const puesto = INDEX_DATA[depKey]
        .municipios[munKey]
        .zonas[zonaKey]
        .puestos[puestoKey];

    puesto.mesas.forEach((mesa_id) => {

        const option = document.createElement("option");
        option.value = mesa_id;
        option.textContent = mesa_id;

        mesaSelect.appendChild(option);
    });
}


// ================================
// URL CHUNK
// ================================
function construirUrlMesa(mesa_id) {

    const chunk_id = MESA_MAP[mesa_id];

    if (!chunk_id) {
        console.error("Mesa no encontrada en mapa:", mesa_id);
        return null;
    }

    return `${BASE_URL}/mesas_${chunk_id}.json`;
}


// ================================
// CARGAR MESA
// ================================
async function cargarMesa(mesa_id) {

    limpiarResultados();

    const url = construirUrlMesa(mesa_id);
    if (!url) return;

    let data;

    try {

        if (cache[url]) {
            data = cache[url];
        } else {

            const res = await fetch(url + "?t=" + Date.now());

            if (!res.ok) throw new Error("Error cargando chunk");

            data = await res.json();
            cache[url] = data;
        }

        const mesa = data.mesas.find(m => m.mesa_id === mesa_id);

        if (!mesa) {
            console.error("Mesa no encontrada en chunk");
            return;
        }

        renderTabla(mesa.votos);
        renderImagen(mesa.url_image);

    } catch (error) {
        console.error(error);
    }
}


// ================================
// TABLA RESULTADOS
// ================================
function renderTabla(votos) {

    const table = document.getElementById("results-table");
    const tbody = table.querySelector("tbody");

    tbody.innerHTML = "";

    const keys = Object.keys(votos).filter(k =>
        k.startsWith("Votos por") ||
        k === "Votos en Blanco" ||
        k === "Votos Nulos" ||
        k === "Votos No Marcados"
    );

    keys.forEach((k) => {

        const nombre = k.replace("Votos por ", "");
        const valor = votos[k];

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${nombre}</td>
            <td>${valor}</td>
        `;

        tbody.appendChild(tr);
    });

    table.style.display = "table";

    const totalDiv = document.getElementById("total-votos");
    totalDiv.style.display = "block";
    totalDiv.textContent = `Total votos en esta mesa: ${votos["Total votos"]}`;
}


// ================================
// IMAGEN + MODAL + ZOOM
// ================================
function renderImagen(url) {

    const container = document.getElementById("imagen-container");
    const btn = document.getElementById("btn-ver-imagen");

    if (!url) {
        container.style.display = "none";
        return;
    }

    container.style.display = "block";
    btn.style.display = "block";

    // limpiar eventos previos
    btn.replaceWith(btn.cloneNode(true));
    const newBtn = document.getElementById("btn-ver-imagen");

    // comportamiento tipo código antiguo (100% confiable)
    newBtn.addEventListener("click", () => {
        window.open(url, "_blank");
    });
}


// ================================
// LIMPIAR SELECTS
// ================================
function limpiarSelectsDesde(nivel) {

    const orden = [
        "dep-select",
        "mun-select",
        "zona-select",
        "puesto-select",
        "mesa-select"
    ];

    const textos = {
        "dep-select": "Seleccione departamento",
        "mun-select": "Seleccione municipio",
        "zona-select": "Seleccione zona",
        "puesto-select": "Seleccione puesto",
        "mesa-select": "Seleccione mesa"
    };

    const startIndex = orden.indexOf(nivel);

    for (let i = startIndex + 1; i < orden.length; i++) {

        const select = document.getElementById(orden[i]);

        select.innerHTML = `<option value="">${textos[orden[i]]}</option>`;
    }
}


// ================================
// EVENTOS
// ================================
document.getElementById("dep-select").addEventListener("change", (e) => {
    limpiarSelectsDesde("dep-select");
    llenarMunicipios(e.target.value);
    limpiarResultados();
});

document.getElementById("mun-select").addEventListener("change", (e) => {

    const depKey = document.getElementById("dep-select").value;

    limpiarSelectsDesde("mun-select");
    llenarZonas(depKey, e.target.value);
    limpiarResultados();
});

document.getElementById("zona-select").addEventListener("change", (e) => {

    const depKey = document.getElementById("dep-select").value;
    const munKey = document.getElementById("mun-select").value;

    limpiarSelectsDesde("zona-select");
    llenarPuestos(depKey, munKey, e.target.value);
    limpiarResultados();
});

document.getElementById("puesto-select").addEventListener("change", (e) => {

    const depKey = document.getElementById("dep-select").value;
    const munKey = document.getElementById("mun-select").value;
    const zonaKey = document.getElementById("zona-select").value;

    limpiarSelectsDesde("puesto-select");
    llenarMesas(depKey, munKey, zonaKey, e.target.value);
    limpiarResultados();
});

document.getElementById("mesa-select").addEventListener("change", (e) => {

    const mesa_id = e.target.value;

    if (!mesa_id) return;

    cargarMesa(mesa_id);
});


// ================================
init();