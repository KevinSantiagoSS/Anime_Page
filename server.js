require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');  // 👈 Usamos mysql2 con `promise`
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Configurar conexión a MySQL con pool de conexiones
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'RIOLkelu01.',
    database: 'anime',
    port: 3306
});

// Importar rutas y pasar el pool de conexiones
const animeRoutes = require('./routes/animes')(pool);
app.use('/api', animeRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Servidor funcionando 🚀');
});

// Iniciar servidor
const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

