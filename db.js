require('dotenv').config();
const mysql = require('mysql2/promise'); // Usamos `promise` para manejar consultas con `async/await`

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "anime",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = db;
