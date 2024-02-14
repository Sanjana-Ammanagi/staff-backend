// db.js

const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'sanj@123', // Empty string for no password
    database: 'leave_management'
  });

  
module.exports = connection;
