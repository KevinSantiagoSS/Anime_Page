const express = require('express');
const router = express.Router();
const axios = require('axios');

module.exports = (pool) => {

    // 🔍 Buscar sinopsis desde Jikan
    async function buscarSinopsis(nombre) {
        try {
            const res = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(nombre)}&limit=1`);
            const anime = res.data.data[0];
            return anime?.synopsis || null;
        } catch (err) {
            console.error('❌ Error buscando sinopsis:', err.message);
            return null;
        }
    }

    // 🌐 Traducir sinopsis al español
    async function traducirSinopsis(texto) {
        try {
            const res = await axios.post('https://libretranslate.de/translate', {
                q: texto,
                source: 'en',
                target: 'es',
                format: 'text'
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            return res.data.translatedText;
        } catch (err) {
            console.error('❌ Error al traducir la sinopsis:', err.message);
            return texto; // Si falla, se deja en inglés
        }
    }

    // 🟢 Obtener todos los animes o buscar por nombre
    router.get('/animes', async (req, res) => {
        const nombre = req.query.nombre;
        
        try {
            let query;
            let params = [];
            
            if (nombre) {
                query = 'SELECT * FROM animes WHERE nombre = ?';
                params = [nombre];
            } else {
                query = 'SELECT * FROM animes';
            }
            
            const [results] = await pool.query(query, params);
            res.json(results.length ? results : { message: "No hay información" });

        } catch (error) {
            console.error("❌ Error al obtener animes:", error);
            res.status(500).json({ error: "Error en el servidor" });
        }
    });

    // 🟢 Obtener animes ordenados alfabéticamente
    router.get('/animes/ordenados', async (req, res) => {
        console.log("📢 Se recibió una solicitud en /animes/ordenados");

        try {
            const [results] = await pool.query('SELECT * FROM animes ORDER BY nombre ASC');
            console.log("✅ Animes obtenidos:", results.length);
            res.json(results);

        } catch (error) {
            console.error("❌ Error al obtener animes ordenados:", error);
            res.status(500).json({ error: "Error en el servidor" });
        }
    });

    // 🟢 Obtener animes de la sección 'NO VISTO'
    router.get('/animes/no-visto', async (req, res) => {
        try {
            const [results] = await pool.query("SELECT * FROM animes WHERE estado = 'NO VISTO'");
            res.json(results);
        } catch (error) {
            console.error("❌ Error al obtener animes NO VISTO:", error);
            res.status(500).json({ error: "Error en el servidor" });
        }
    });

    // 🟢 Agregar un anime nuevo
    router.post('/animes', async (req, res) => {
    const { nombre, imagen_url, capitulos, anio_emision, sinopsis, estado } = req.body;

    // Validar solo campos obligatorios excepto sinopsis
    if (!nombre || !imagen_url || !capitulos || !anio_emision || !estado) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    try {
        let sinopsisFinal = sinopsis?.trim();

        if (!sinopsisFinal) {
            // Aquí llamas a la función que trae la sinopsis y la traduce
            const sinopsisEnIngles = await buscarSinopsis(nombre);
            sinopsisFinal = sinopsisEnIngles ? await traducirSinopsis(sinopsisEnIngles) : "Sin sinopsis disponible.";
        }

        // Ahora sí insertas en la base de datos con sinopsisFinal
        const [result] = await pool.query(
            'INSERT INTO animes (nombre, imagen_url, capitulos, anio_emision, sinopsis, estado) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, imagen_url, capitulos, anio_emision, sinopsisFinal, estado]
        );

        res.json({ message: 'Anime agregado', id: result.insertId });

    } catch (error) {
        console.error("Error al agregar anime:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
    });

    // 🟢 Eliminar un anime por ID
    router.delete('/animes/:id', async (req, res) => {
        const { id } = req.params;

        try {
            const [result] = await pool.query('DELETE FROM animes WHERE id = ?', [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Anime no encontrado" });
            }

            res.json({ message: 'Anime eliminado correctamente' });

        } catch (error) {
            console.error("🔥 Error al eliminar anime:", error);
            res.status(500).json({ error: "Error en el servidor" });
        }
    });

    // 🟢 Actualizar solo el estado de un anime
    router.put("/animes/:id/estado", async (req, res) => {
        console.log("📢 Se recibió una solicitud para cambiar el estado de un anime");

        const { id } = req.params;
        const { estado } = req.body;

        if (!estado) {
            return res.status(400).json({ error: "El estado es obligatorio" });
        }

        try {
            const [result] = await pool.query(
                "UPDATE animes SET estado = ? WHERE id = ?",
                [estado, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Anime no encontrado" });
            }

            console.log("✅ Estado cambiado:", id, "→", estado);
            res.json({ message: "Estado cambiado correctamente" });

        } catch (error) {
            console.error("🔥 Error al actualizar estado:", error);
            res.status(500).json({ error: "Error en el servidor" });
        }
    });

    // 🟢 Actualizar un anime por ID
    router.put("/animes/:id", async (req, res) => {
        console.log("📢 Se recibió una solicitud para actualizar un anime");

        const { id } = req.params;
        let { nombre, imagen_url, capitulos, anio_emision, sinopsis, estado } = req.body;

        try {
            const [animeData] = await pool.query("SELECT * FROM animes WHERE id = ?", [id]);

            if (animeData.length === 0) {
                return res.status(404).json({ message: "Anime no encontrado" });
            }

            const animeActual = animeData[0];

            nombre = nombre ?? animeActual.nombre;
            imagen_url = imagen_url ?? animeActual.imagen_url;
            capitulos = capitulos ?? animeActual.capitulos;
            anio_emision = anio_emision ?? animeActual.anio_emision;
            sinopsis = sinopsis ?? animeActual.sinopsis;
            estado = estado ?? animeActual.estado;

            const [result] = await pool.query(
                "UPDATE animes SET nombre = ?, imagen_url = ?, capitulos = ?, anio_emision = ?, sinopsis = ?, estado = ? WHERE id = ?",
                [nombre, imagen_url, capitulos, anio_emision, sinopsis, estado, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Anime no encontrado" });
            }

            console.log("✅ Anime actualizado:", id);
            res.json({ message: "Anime actualizado correctamente" });

        } catch (error) {
            console.error("🔥 Error al actualizar anime:", error);
            res.status(500).json({ error: "Error en el servidor" });
        }
    });

    return router;
};