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
    fetch("https://animepage-production.up.railway.app/api/animes")
        .then(response => response.json())
        .then(animes => actualizarSecciones(animes))
        .catch(error => console.error("Error al cargar animes:", error));
        obtenerAnimesOrdenados();
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

    fetch(`https://animepage-production.up.railway.app/api/animes/${id}`, {
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
    obtenerAnimesOrdenados();
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

    const url = animeId ? `https://animepage-production.up.railway.app/api/animes/${animeId}` : "https://animepage-production.up.railway.app/api/animes";
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
    
    fetch(`https://animepage-production.up.railway.app/api/animes?nombre=${encodeURIComponent(nombre)}`)
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

async function obtenerAnimesOrdenados() {
    try {
        console.log("📢 Enviando solicitud a la API...");
        let response = await fetch("https://animepage-production.up.railway.app/api/animes/ordenados");
        console.log("✅ Respuesta recibida:", response);

        let animes = await response.json();
        console.log("📄 Datos obtenidos:", animes);

        mostrarAnimes(animes);
    } catch (error) {
        console.error("❌ Error al obtener animes:", error);
    }
}

function mostrarAnimes(animes) {
    const contenedor = document.getElementById("abecedario-animes");
    contenedor.innerHTML = "";

    animes.forEach(anime => {
        let animeDiv = document.createElement("div");
        animeDiv.classList.add("anime-lista");

        let imagen = document.createElement("img");
        imagen.src = anime.imagen_url;
        imagen.alt = anime.nombre;
        imagen.classList.add("anime-imagen");

        if (anime.estado === "VISTO") {
            imagen.style.filter = "blur(2px) brightness(0.7)";
        }

        let nombre = document.createElement("span");
        nombre.textContent = anime.nombre;
        nombre.classList.add("anime-nombre");

        animeDiv.appendChild(imagen);
        animeDiv.appendChild(nombre);
        contenedor.appendChild(animeDiv);
    });
}

function desplazarALetra(letra) {
    let animes = document.querySelectorAll(".anime-lista");
    for (let anime of animes) {
        if (anime.textContent.trim().toUpperCase().startsWith(letra.toUpperCase())) {
            anime.scrollIntoView({ behavior: "smooth", block: "start" });
            break;
        }
    }
}

function generarAbecedario() {
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const contenedor = document.querySelector(".letras-sidebar");

    letras.split("").forEach(letra => {
        let boton = document.createElement("button");
        boton.textContent = letra;
        boton.classList.add("letra-boton"); // Puedes personalizar este estilo en CSS
        boton.addEventListener("click", () => desplazarALetra(letra));
        contenedor.appendChild(boton);
    });
}

// Inicialización al cargar
document.addEventListener("DOMContentLoaded", () => {
    obtenerAnimesOrdenados();
    generarAbecedario();
});

document.addEventListener("DOMContentLoaded", function () {
    // Vincular el botón de girar con la función
    document.getElementById("girarRuleta").addEventListener("click", girarRuleta);
});

function mostrarSeccion(seccionId) {
    // Ocultar todas las secciones
    let secciones = document.querySelectorAll(".seccion");
    secciones.forEach(seccion => {
        seccion.style.display = "none";
    });

    // Mostrar solo la sección seleccionada
    let seccionActiva = document.getElementById(seccionId);
    if (seccionActiva) {
        seccionActiva.style.display = "block";

        // Si la sección es la ruleta, generamos los colores aleatorios
        if (seccionId === "seccion-ruleta") {
            actualizarRuleta();
        }
    }
}

function generarColoresAleatorios() {
    let colores = [];
    for (let i = 0; i < 10; i++) {
        let color = `hsl(${Math.random() * 360}, 100%, 50%)`; // Colores vibrantes
        colores.push(color);
    }
    return colores;
}

function actualizarRuleta() {
    let ruleta = document.getElementById("ruleta-box");
    let colores = generarColoresAleatorios();

    // Crear el gradiente cónico con los colores aleatorios
    let gradiente = `conic-gradient(
        ${colores[0]} 0% 10%, ${colores[1]} 10% 20%, 
        ${colores[2]} 20% 30%, ${colores[3]} 30% 40%, 
        ${colores[4]} 40% 50%, ${colores[5]} 50% 60%, 
        ${colores[6]} 60% 70%, ${colores[7]} 70% 80%, 
        ${colores[8]} 80% 90%, ${colores[9]} 90% 100%
    )`;

    ruleta.style.background = gradiente;
}

async function girarRuleta() {
    actualizarRuleta(); // Cambiar colores antes de girar

    let ruleta = document.getElementById("ruleta-box");
    let giros = Math.floor(Math.random() * 5) + 5; // Entre 5 y 9 vueltas completas
    let anguloFinal = giros * 360 + Math.floor(Math.random() * 360); // Giro aleatorio

    ruleta.style.transition = "transform 3s ease-out";
    ruleta.style.transform = `rotate(${anguloFinal}deg)`;

    // Esperar a que termine la animación
    setTimeout(async () => {
        let animeElegido = await obtenerAnimeAleatorio();
        if (animeElegido) {
            mostrarAnimeSeleccionado(animeElegido);
        }
    }, 3100);
}

async function obtenerAnimeAleatorio() {
    try {
        let response = await fetch("https://animepage-production.up.railway.app/api/animes/no-visto");
        let animes = await response.json();

        if (animes.length === 0) {
            return null;
        }

        let indiceAleatorio = Math.floor(Math.random() * animes.length);
        return animes[indiceAleatorio];
    } catch (error) {
        console.error("❌ Error al obtener animes:", error);
        return null;
    }
}

function mostrarAnimeSeleccionado(anime) {
    let resultadoDiv = document.getElementById("resultado-ruleta");
    resultadoDiv.innerHTML = `
        <h3>${anime.nombre}</h3>
        <img src="${anime.imagen_url}" alt="${anime.nombre}" class="anime-imagen-seleccionado">
    `;
    resultadoDiv.style.display = "block";
}