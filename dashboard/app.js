const BASE_URL = "https://datametricscolombia.github.io/presidencia_20260531/presidencia";

const INDEX_FILE = `${BASE_URL}/index.json`;
const MAP_FILE = `${BASE_URL}/mesa_chunk_map.json`;

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
}


// ================================
// CARGAR INDEX + MAPA
// ================================
async function cargarIndice() {

    try {

        const [resIndex, resMap] = await Promise.all([
            fetch(INDEX_FILE + "?t=" + Date.now()),
            fetch(MAP_FILE + "?t=" + Date.now())
        ]);

        if (!resIndex.ok || !resMap.ok) {
            throw new Error("Error cargando index o mapa");
        }

        INDEX_DATA = await resIndex.json();
        MESA_MAP = await resMap.json();

        llenarDepartamentos();

    } catch (error) {
        console.error(error);
    }
}


// ================================
// DEPARTAMENTOS
// ================================
function llenarDepartamentos() {

    const depSelect = document.getElementById("dep-select");

    depSelect.innerHTML = '<option value="">Seleccione departamento</option>';

    const index = INDEX_DATA.index;

    for (const depKey in index) {

        const dep = index[depKey];

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

    const municipios = INDEX_DATA.index[depKey].municipios;

    for (const munKey in municipios) {

        const mun = municipios[munKey];

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

    const zonas = INDEX_DATA.index[depKey].municipios[munKey].zonas;

    for (const zonaKey in zonas) {

        const zona = zonas[zonaKey];

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

    const puestos = INDEX_DATA.index[depKey]
        .municipios[munKey]
        .zonas[zonaKey]
        .puestos;

    for (const puestoKey in puestos) {

        const puesto = puestos[puestoKey];

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

    const mesas = INDEX_DATA.index[depKey]
        .municipios[munKey]
        .zonas[zonaKey]
        .puestos[puestoKey]
        .mesas;

    mesas.forEach(m => {

        const option = document.createElement("option");

        option.value = m.mesa_id;
        option.textContent = m.mesa_id;

        mesaSelect.appendChild(option);
    });
}


// ================================
// CARGAR MESA (DESDE CHUNK)
// ================================
async function cargarMesa(mesa_id) {

    if (!mesa_id) return;

    const chunk_id = MESA_MAP[mesa_id];

    if (!chunk_id) {
        console.error("Mesa no encontrada en mapa");
        return;
    }

    const url = `${BASE_URL}/mesas_${chunk_id}.json`;

    let data;

    if (cache[url]) {

        data = cache[url];

    } else {

        const res = await fetch(url + "?t=" + Date.now());

        if (!res.ok) {
            console.error("Error cargando chunk:", url);
            return;
        }

        data = await res.json();

        cache[url] = data;
    }

    const mesa = data.mesas.find(m => m.mesa_id === mesa_id);

    if (!mesa) {
        console.error("Mesa no encontrada en chunk");
        return;
    }

    renderResultados(mesa.votos);
}


// ================================
// RENDER RESULTADOS
// ================================
function renderResultados(data) {

    const table = document.getElementById("results-table");
    const tbody = table.querySelector("tbody");

    tbody.innerHTML = "";

    const partidos = Object.keys(data).filter(k =>
        k.startsWith("Votos por") ||
        k === "Votos en Blanco" ||
        k === "Votos Nulos" ||
        k === "Votos No Marcados"
    );

    partidos.forEach((p) => {

        const nombre = p.replace("Votos por ", "");
        const votos = parseInt(data[p]);

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${nombre}</td>
            <td>${votos}</td>
        `;

        tbody.appendChild(tr);
    });

    table.style.display = "table";

    const totalDiv = document.getElementById("total-votos");

    totalDiv.style.display = "block";
    totalDiv.textContent = `Total votos en esta mesa: ${data["Total votos"]}`;
}


// ================================
// LIMPIAR SELECTS EN CASCADA
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

    cargarMesa(mesa_id);
});


// ================================
cargarIndice();