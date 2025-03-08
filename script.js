document.addEventListener("DOMContentLoaded", () => {
    mostrarSeccion("inicio");
    cargarAnimes();
});

function mostrarSeccion(seccionId) {
    document.querySelectorAll(".seccion").forEach(seccion => {
        seccion.classList.remove("activa");
    });
    document.getElementById(seccionId).classList.add("activa");
}

function cargarAnimes() {
    fetch("http://localhost:4000/api/animes")
        .then(response => response.json())
        .then(animes => actualizarSecciones(animes))
        .catch(error => console.error("Error al cargar animes:", error));
}

function actualizarSecciones(animes) {
    const listaVisto = document.getElementById("visto-animes");
    const listaNoVisto = document.getElementById("no-visto-animes");

    listaVisto.innerHTML = "";
    listaNoVisto.innerHTML = "";

    animes.forEach(anime => {
        const card = document.createElement("div");
        card.classList.add("anime-card");
        card.innerHTML = `
            <div class="anime-container" onmouseover="this.classList.add('flipped')" onmouseout="this.classList.remove('flipped')">
                <div class="front">
                    <img src="${anime.imagen_url}" alt="${anime.nombre}">
                </div>
                <div class="back">
                    <h3>${anime.nombre}</h3>
                    <p>Capítulos: ${anime.capitulos}</p>
                    <p>Año: ${anime.anio_emision}</p>
                    <button onclick="cambiarEstado(${anime.id}, '${anime.estado}')">
                        ${anime.estado === "NO VISTO" ? "TERMINADO" : "DESMARCAR"}
                    </button>
                </div>
            </div>
        `;

        if (anime.estado === "VISTO") {
            listaVisto.appendChild(card);
        } else {
            listaNoVisto.appendChild(card);
        }
    });
}

function cambiarEstado(id, estadoActual) {
    console.log("Cambiando estado del anime con ID:", id, "Estado actual:", estadoActual);

    const nuevoEstado = estadoActual === "VISTO" ? "NO VISTO" : "VISTO";

    fetch(`http://localhost:4000/api/animes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Estado cambiado con éxito:", data);
        mostrarMensajeTemporal(`Estado cambiado a ${nuevoEstado}`);
        cargarAnimes(); // 🔄 Recargar la lista de animes
    })
    .catch(error => console.error("Error al cambiar estado:", error));
}

const animeForm = document.getElementById("animeForm");
animeForm.addEventListener("submit", function(event) {
    event.preventDefault();
    
    const animeId = this.dataset.animeId || "";
    const animeData = {
        nombre: document.getElementById("nombre").value,
        imagen_url: document.getElementById("imagen_url").value,
        capitulos: document.getElementById("capitulos").value,
        anio_emision: document.getElementById("anio_emision").value,
        estado: document.getElementById("estado").value
    };

    const url = animeId ? `http://localhost:4000/api/animes/${animeId}` : "http://localhost:4000/api/animes";
    const method = animeId ? "PUT" : "POST";

    fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(animeData)
    })
    .then(response => response.json())
    .then(data => {
        console.log(animeId ? "Anime actualizado:" : "Anime agregado:", data);
        mostrarMensajeTemporal(animeId ? "Anime actualizado correctamente" : "Anime agregado correctamente");
        cargarAnimes();
        limpiarFormulario();
    })
    .catch(error => console.error("Error al procesar anime:", error));
});

document.getElementById("nombre").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        buscarAnimePorNombre(this.value.trim());
    }
});

function buscarAnimePorNombre(nombre) {
    if (!nombre) return;
    
    fetch(`http://localhost:4000/api/animes?nombre=${encodeURIComponent(nombre)}`)
        .then(response => response.json())
        .then(data => {
            if (!data.length) {
                mostrarMensajeTemporal("No hay información");
                limpiarFormulario();
                return;
            }
            
            const anime = data[0];
            document.getElementById("imagen_url").value = anime.imagen_url || "";
            document.getElementById("capitulos").value = anime.capitulos || "";
            document.getElementById("anio_emision").value = anime.anio_emision || "";
            document.getElementById("estado").value = anime.estado || "NO VISTO";
            animeForm.dataset.animeId = anime.id;
            document.querySelector(".submit-btn").textContent = "Actualizar";
        })
        .catch(error => console.error("Error al buscar anime:", error));
}

function mostrarMensajeTemporal(mensaje) {
    const mensajeDiv = document.createElement("div");
    mensajeDiv.className = "mensaje-temporal";
    mensajeDiv.textContent = mensaje;
    document.body.appendChild(mensajeDiv);

    setTimeout(() => mensajeDiv.classList.add("mostrar"), 100);
    setTimeout(() => {
        mensajeDiv.classList.remove("mostrar");
        setTimeout(() => mensajeDiv.remove(), 500);
    }, 3000);
}

function limpiarFormulario() {
    animeForm.reset();
    delete animeForm.dataset.animeId;
    document.querySelector(".submit-btn").textContent = "Agregar Anime";
}
