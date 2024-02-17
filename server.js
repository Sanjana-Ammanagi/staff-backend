// server.js

const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3001;
app.use(cors());


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'sanj@123',
  database: 'leave_management',
});



connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL!');
});

app.post('/login', (req, res) => {
  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
  

  connection.query(sql, [req.body.email,req.body.password], (err, data) => {
    if (err) {
      return res.json("error");

    }

    if (data.length > 0) {
      // User found, login successful
      return res.json("Login Successful");
    } else {
      // No user found, login failed
      return res.json("Login Failed");
    }
  });
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
