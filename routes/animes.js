const express = require('express');
const router = express.Router();

module.exports = (db) => {

    // Obtener todos los animes o buscar por nombre
    router.get('/animes', (req, res) => {
        const nombre = req.query.nombre;

        if (nombre) {
            db.query('SELECT * FROM animes WHERE nombre = ?', [nombre], (err, results) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                if (results.length === 0) {
                    return res.json({ message: "No hay información" });
                }
                res.json(results);
            });
        } else {
            db.query('SELECT * FROM animes', (err, results) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json(results);
            });
        }
    });

    // Agregar un anime nuevo
    router.post('/animes', async (req, res) => {
        console.log("📢 [POST] Se recibió una solicitud para agregar un anime en:", new Date().toISOString());
        const { nombre, imagen_url, capitulos, anio_emision, estado } = req.body;

        if (!nombre || !imagen_url || !capitulos || !anio_emision || !estado) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        try {
            const [result] = await db.promise().query(
                'INSERT INTO animes (nombre, imagen_url, capitulos, anio_emision, estado) VALUES (?, ?, ?, ?, ?)', 
                [nombre, imagen_url, capitulos, anio_emision, estado]
            );

            console.log("✅ Anime agregado:", result.insertId);
            res.json({ message: 'Anime agregado', id: result.insertId });

        } catch (error) {
            console.error("🔥 Error en el servidor:", error);
            res.status(500).json({ error: "Error en el servidor" });
        }
    });

    // Eliminar un anime
    router.delete('/animes/:id', (req, res) => {
        const { id } = req.params;
        db.query('DELETE FROM animes WHERE id = ?', [id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Anime eliminado' });
        });
    });

    // 🔄 Ruta específica para cambiar solo el estado de un anime
    router.put("/animes/:id/estado", async (req, res) => {
        console.log("📢 Se recibió una solicitud para cambiar el estado de un anime");
    
        const { id } = req.params;
        const { estado } = req.body;
    
        if (!estado) {
            return res.status(400).json({ error: "El estado es obligatorio" });
        }
    
        try {
            const [result] = await db.promise().query(
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
            res.status(500).json({ error: "Error al actualizar estado" });
        }
    });    

    // Actualizar un anime por ID
    router.put("/animes/:id", async (req, res) => {
        console.log("📢 Se recibió una solicitud para actualizar un anime");
    
        const { id } = req.params;
        let { nombre, imagen_url, capitulos, anio_emision, estado } = req.body;
    
        // 🛠️ Verifica si los valores son undefined o null antes de actualizar
        try {
            // Obtener valores actuales del anime en la base de datos
            const [animeData] = await db.promise().query("SELECT * FROM animes WHERE id = ?", [id]);
    
            if (animeData.length === 0) {
                return res.status(404).json({ message: "Anime no encontrado" });
            }
    
            // Si algún campo es `undefined` o `null`, mantenemos el valor actual
            const animeActual = animeData[0];
    
            nombre = nombre ?? animeActual.nombre;
            imagen_url = imagen_url ?? animeActual.imagen_url;
            capitulos = capitulos ?? animeActual.capitulos;
            anio_emision = anio_emision ?? animeActual.anio_emision;
            estado = estado ?? animeActual.estado;
    
            // Actualizar solo con los valores correctos
            const [result] = await db.promise().query(
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
            res.status(500).json({ error: "Error al actualizar anime" });
        }
    });
    

    return router;
};
