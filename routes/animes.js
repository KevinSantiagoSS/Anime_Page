const express = require('express');
const router = express.Router();

module.exports = (pool) => {

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
        console.log("📢 [POST] Agregando un anime:", new Date().toISOString());
        
        const { nombre, imagen_url, capitulos, anio_emision, estado } = req.body;

        if (!nombre || !imagen_url || !capitulos || !anio_emision || !estado) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        try {
            const [result] = await pool.query(
                'INSERT INTO animes (nombre, imagen_url, capitulos, anio_emision, estado) VALUES (?, ?, ?, ?, ?)', 
                [nombre, imagen_url, capitulos, anio_emision, estado]
            );

            console.log("✅ Anime agregado con ID:", result.insertId);
            res.json({ message: 'Anime agregado', id: result.insertId });

        } catch (error) {
            console.error("🔥 Error en el servidor:", error);
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
        let { nombre, imagen_url, capitulos, anio_emision, estado } = req.body;

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
            estado = estado ?? animeActual.estado;

            const [result] = await pool.query(
                "UPDATE animes SET nombre = ?, imagen_url = ?, capitulos = ?, anio_emision = ?, estado = ? WHERE id = ?",
                [nombre, imagen_url, capitulos, anio_emision, estado, id]
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