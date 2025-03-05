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
    fetch("http://localhost:4000/api/animes") // ✅ Con la URL correcta
        .then(response => response.json())
        .then(animes => {
            actualizarSecciones(animes);
        })
        .catch(error => console.error("Error al cargar animes:", error));
}

function actualizarSecciones(animes) {
    const listaInicio = document.getElementById("inicio-animes");
    const listaVisto = document.getElementById("visto-animes");
    const listaNoVisto = document.getElementById("no-visto-animes");

    listaInicio.innerHTML = "";
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

        //listaInicio.appendChild(card.cloneNode(true));

        if (anime.estado === "VISTO") {
            listaVisto.appendChild(card);
        } else {
            listaNoVisto.appendChild(card);
        }
    });
}

function cambiarEstado(id, estadoActual) {
    console.log("Botón presionado para el anime con ID:", id, "Estado actual:", estadoActual);
    
    const nuevoEstado = estadoActual === "VISTO" ? "NO VISTO" : "VISTO";

    fetch(`http://localhost:4000/api/animes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Respuesta del servidor:", data);
        cargarAnimes(); // Recargar la lista de animes
    })
    .catch(error => console.error("Error al actualizar estado:", error));
}

document.getElementById("animeForm").addEventListener("submit", function(event) { // ✅ Usa el ID correcto
    event.preventDefault(); // Evita que la página se recargue

    const nombre = document.getElementById("nombre").value;
    const imagen_url = document.getElementById("imagen_url").value;
    const capitulos = document.getElementById("capitulos").value;
    const anio_emision = document.getElementById("anio_emision").value;
    const estado = document.getElementById("estado").value;

    if (!nombre || !imagen_url || !capitulos || !anio_emision) {
        console.error("Todos los campos son obligatorios.");
        return;
    }

    const nuevoAnime = { nombre, imagen_url, capitulos, anio_emision, estado };

    fetch("http://localhost:4000/api/animes", { // ✅ Asegúrate de que la URL es correcta
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoAnime)
    })
    .then(response => response.json())
    .then(data => {
        console.log("Anime agregado:", data);
        document.getElementById("animeForm").reset(); // ✅ Limpia el formulario después de agregar
        cargarAnimes(); // ✅ Recarga la lista de animes
    })
    .catch(error => console.error("Error al agregar anime:", error));
});

document.getElementById("nombre").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Evitar que el formulario se envíe

        const nombre = this.value.trim();
        if (nombre === "") return;

        fetch(`http://localhost:4000/api/animes?nombre=${encodeURIComponent(nombre)}`)
            .then(response => response.json())
            .then(data => {
                console.log("Datos recibidos:", data); // 🔍 Verificar la respuesta

                if (!data || data.message) {
                    mostrarMensajeTemporal("No hay información");
                    limpiarFormulario();
                    return;
                } else {
                    const anime = data[0]; // Acceder al primer objeto del array

                    document.getElementById("imagen_url").value = anime.imagen_url || "";
                    document.getElementById("capitulos").value = anime.capitulos || "";
                    document.getElementById("anio_emision").value = anime.anio_emision || "";
                    document.getElementById("estado").value = anime.estado || "NO VISTO";

                    // Cambiar el botón a "Actualizar"
                    const submitBtn = document.querySelector(".submit-btn");
                    submitBtn.textContent = "Actualizar";
                    submitBtn.dataset.id = anime.id || "";
                }
            })
            .catch(error => console.error("Error al buscar anime:", error));
    }
});

function mostrarMensajeTemporal(mensaje) {
    const mensajeDiv = document.createElement("div");
    mensajeDiv.className = "mensaje-temporal";
    mensajeDiv.textContent = mensaje;
    document.body.appendChild(mensajeDiv);

    // 🔥 Pequeño retraso para activar la animación después de agregar el elemento
    setTimeout(() => mensajeDiv.classList.add("mostrar"), 100);

    // ⏳ Remover después de 3 segundos
    setTimeout(() => {
        mensajeDiv.classList.remove("mostrar");
        setTimeout(() => mensajeDiv.remove(), 500); // Espera la animación antes de eliminar
    }, 3000);
}


function limpiarFormulario() {
    document.getElementById("imagen_url").value = "";
    document.getElementById("capitulos").value = "";
    document.getElementById("anio_emision").value = "";
    document.getElementById("estado").value = "NO VISTO";
    
    const submitBtn = document.querySelector(".submit-btn");
    submitBtn.textContent = "Agregar Anime";
    delete submitBtn.dataset.id;
}

// Modificar la lógica del envío del formulario
document.getElementById("animeForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const animeId = this.dataset.animeId;
    const animeData = {
        nombre: document.getElementById("nombre").value,
        imagen_url: document.getElementById("imagen_url").value,
        capitulos: document.getElementById("capitulos").value,
        anio_emision: document.getElementById("anio_emision").value,
        estado: document.getElementById("estado").value
    };

    if (animeId) {
        // Si hay un ID, significa que el anime ya existe y se actualizará
        fetch(`http://localhost:4000/api/animes/${animeId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(animeData)
        })
        .then(response => response.json())
        .then(data => {
            console.log("Anime actualizado:", data);
            cargarAnimes();
        })
        .catch(error => console.error("Error al actualizar anime:", error));
    } else {
        // Si no hay ID, es un nuevo anime y se agrega
        fetch("http://localhost:4000/api/animes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(animeData)
        })
        .then(response => response.json())
        .then(data => {
            console.log("Anime agregado:", data);
            cargarAnimes();
        })
        .catch(error => console.error("Error al agregar anime:", error));
    }
});
