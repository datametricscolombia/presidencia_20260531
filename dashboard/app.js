const BASE_URL = "https://datametricscolombia.github.io/presidencia_20260531/presidencia";
const INDEX_FILE = `${BASE_URL}/index_hierarquico.json`;

let INDEX_DATA = {};
const cache = {};


// ================================
// NORMALIZAR KEYS (NUEVO)
// ================================
function extraerCodigoZona(zonaKey) {
    return zonaKey.split("_")[0] + zonaKey.split("_")[2];
}

function extraerCodigoPuesto(puestoKey) {
    return puestoKey.split("_")[0] + puestoKey.split("_")[2];
}

function extraerCodigoMesa(mesaKey) {
    return mesaKey.split("_")[0] + mesaKey.split("_")[2];
}

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

    document.getElementById("breadcrumb").innerHTML = "";
}

// ================================
// CARGAR INDEX
// ================================
async function cargarIndice() {

    try {

        const res = await fetch(INDEX_FILE + "?t=" + Date.now());

        if (!res.ok) throw new Error("No se pudo cargar el índice");

        INDEX_DATA = await res.json();

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

    for (const depKey in INDEX_DATA.departamentos) {

        const dep = INDEX_DATA.departamentos[depKey];

        const option = document.createElement("option");

        option.value = depKey;
        option.textContent = `${depKey} - ${dep.nombre}`;

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

    const dep = INDEX_DATA.departamentos[depKey];

    for (const munKey in dep.municipios) {

        const option = document.createElement("option");

        option.value = munKey;
        option.textContent = `${munKey} - ${dep.municipios[munKey].nombre}`;

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

    const mun = INDEX_DATA.departamentos[depKey].municipios[munKey];

    for (const zonaKey in mun.zonas) {

        const option = document.createElement("option");

        option.value = zonaKey;
        option.textContent = zonaKey;

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

    const zona = INDEX_DATA.departamentos[depKey].municipios[munKey].zonas[zonaKey];

    for (const puestoKey in zona.puestos) {

        const option = document.createElement("option");

        option.value = puestoKey;
        option.textContent = puestoKey;

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

    const puesto = INDEX_DATA.departamentos[depKey]
        .municipios[munKey]
        .zonas[zonaKey]
        .puestos[puestoKey];

    for (const mesaKey in puesto.mesas) {

        const option = document.createElement("option");

        option.value = mesaKey;
        option.textContent = mesaKey;

        mesaSelect.appendChild(option);
    }
}

// ================================
// CONSTRUIR URL
// ================================
function construirUrlMesa(mesaKey) {

    const dep = document.getElementById("dep-select").value;
    const mun = document.getElementById("mun-select").value;
    const zonaKey = document.getElementById("zona-select").value;
    const puestoKey = document.getElementById("puesto-select").value;

    const depNombre = INDEX_DATA.departamentos[dep].nombre;

    // 🔹 Convertir a códigos reales
    const zona = extraerCodigoZona(zonaKey);
    const puesto = extraerCodigoPuesto(puestoKey);
    const mesa = extraerCodigoMesa(mesaKey);

    return `${BASE_URL}/departamento_${dep}_${depNombre}/municipio_${mun}/zona_${zona}/puesto_${puesto}/mesa_${mesa}/mesa_${mesa}.json`;
}
// ================================
// CARGAR MESA
// ================================
async function cargarMesa(url) {

    if (!url) return;

    const table = document.getElementById("results-table");
    const tbody = table.querySelector("tbody");

    tbody.innerHTML = "";

    let data;

    if (cache[url]) {

        data = cache[url];

    } else {

        const res = await fetch(url + "?t=" + Date.now());

        if (!res.ok) {
            console.error("Error cargando JSON:", url);
            return;
        }

        data = await res.json();

        cache[url] = data;
    }

    const partidos = Object.keys(data).filter(k => k !== "Total votos");

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

    if (data.url_image) {

        const btn = document.createElement("a");

        btn.href = data.url_image;
        btn.target = "_blank";
        btn.className = "btn-image";

        btn.textContent = "Ver fotografía E-14";

        totalDiv.appendChild(document.createElement("br"));
        totalDiv.appendChild(btn);
    }

    const breadcrumb = document.getElementById("breadcrumb");

    const path = url.replace(BASE_URL + "/", "").split("/");

    breadcrumb.innerHTML = path.map(p => `<span>${p}</span>`).join(" > ");
}

// ================================
// EVENTOS
// ================================
document.getElementById("dep-select").addEventListener("change", (e) => {

    llenarMunicipios(e.target.value);
    limpiarResultados();

    document.getElementById("zona-select").innerHTML = '<option value="">Seleccione zona</option>';
    document.getElementById("puesto-select").innerHTML = '<option value="">Seleccione puesto</option>';
    document.getElementById("mesa-select").innerHTML = '<option value="">Seleccione mesa</option>';
});

document.getElementById("mun-select").addEventListener("change", (e) => {

    const depKey = document.getElementById("dep-select").value;

    llenarZonas(depKey, e.target.value);
    limpiarResultados();

    document.getElementById("puesto-select").innerHTML = '<option value="">Seleccione puesto</option>';
    document.getElementById("mesa-select").innerHTML = '<option value="">Seleccione mesa</option>';
});

document.getElementById("zona-select").addEventListener("change", (e) => {

    const depKey = document.getElementById("dep-select").value;
    const munKey = document.getElementById("mun-select").value;

    llenarPuestos(depKey, munKey, e.target.value);
    limpiarResultados();

    document.getElementById("mesa-select").innerHTML = '<option value="">Seleccione mesa</option>';
});

document.getElementById("puesto-select").addEventListener("change", (e) => {

    const depKey = document.getElementById("dep-select").value;
    const munKey = document.getElementById("mun-select").value;
    const zonaKey = document.getElementById("zona-select").value;

    llenarMesas(depKey, munKey, zonaKey, e.target.value);
    limpiarResultados();
});

document.getElementById("mesa-select").addEventListener("change", (e) => {

    const mesa = e.target.value;

    const url = construirUrlMesa(mesa);

    cargarMesa(url);
});

// ================================
cargarIndice();