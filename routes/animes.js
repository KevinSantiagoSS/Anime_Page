const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

// Configurar conexión a MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "anime"
});

// Obtener todos los animes o buscar por nombre
router.get('/animes', (req, res) => {
    const nombre = req.query.nombre; // Obtener el parámetro 'nombre' de la URL

    if (nombre) {
        // Buscar el anime con ese nombre
        db.query('SELECT * FROM animes WHERE nombre = ?', [nombre], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (results.length === 0) {
                return res.json({ message: "No hay información" });
            }
            res.json(results); // Devolver el anime encontrado
        });
    } else {
        // Si no hay parámetro, devolver todos los animes
        db.query('SELECT * FROM animes', (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        });
    }
});

// Agregar un anime nuevo
router.post('/animes', (req, res) => {
    const { nombre, imagen_url, capitulos, anio_emision, estado } = req.body;

    if (!nombre || !imagen_url || !capitulos || !anio_emision || !estado) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    db.query('INSERT INTO animes (nombre, imagen_url, capitulos, anio_emision, estado) VALUES (?, ?, ?, ?, ?)', 
    [nombre, imagen_url, capitulos, anio_emision, estado], 
    (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Anime agregado', id: result.insertId });
    });
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

// Actualizar el estado de un anime
router.put('/animes/:id', (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    db.query('UPDATE animes SET estado = ? WHERE id = ?', [estado, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Estado actualizado' });
    });
});

module.exports = router;
