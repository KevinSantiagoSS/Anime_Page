require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Configurar conexión a MySQL (una sola vez)
const db = mysql.createConnection({
    host: process.env.MYSQLHOST,  // Usa el nombre que da Railway
    user: process.env.MYSQLUSER,  // Cambia si en Railway es diferente
    password: process.env.MYSQLPASSWORD,  // Cambia si en Railway es diferente
    database: process.env.MYSQLDATABASE
});

db.connect(err => {
    if (err) {
        console.error('❌ Error conectando a MySQL:', err);
        return;
    }
    console.log('✅ Conectado a MySQL');
});

// Importar rutas y pasar la conexión a MySQL
const animeRoutes = require('./routes/animes')(db);
app.use('/api', animeRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Servidor funcionando 🚀');
});

// Iniciar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
