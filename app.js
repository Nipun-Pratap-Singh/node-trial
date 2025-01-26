require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Create a connection to MySQL without specifying the database initially
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
});

// Connect to MySQL to create the database if it doesn't exist
db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err.message);
  } else {
    console.log('Connected to MySQL');
    
    // Create the node_app database if it doesn't exist
    db.query(`CREATE DATABASE IF NOT EXISTS node_app;`, (err) => {
      if (err) {
        console.error('Error creating database:', err.message);
        return;
      }

      // Now that the database is created, create a new connection using the node_app database
      const dbWithDatabase = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: 'node_app',
      });

      // Connect to the node_app database
      dbWithDatabase.connect(err => {
        if (err) {
          console.error('Error connecting to the node_app database:', err.message);
        } else {
          console.log('Connected to node_app database');
          
          // Create the students table if it doesn't exist
          dbWithDatabase.query(`
            CREATE TABLE IF NOT EXISTS students (
              id INT AUTO_INCREMENT PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              roll_no INT NOT NULL
            );
          `, (err) => {
            if (err) {
              console.error('Error creating students table:', err.message);
            } else {
              console.log('Students table created or already exists.');
            }
          });
        }
      });

      // Assign the new db connection to the global db object
      app.set('db', dbWithDatabase);
    });
  }
});

// POST endpoint to add a student
app.post('/add', (req, res) => {
  const { name, roll_no } = req.body;
  const dbWithDatabase = app.get('db'); // Retrieve the db connection with the database
  dbWithDatabase.query('INSERT INTO students (name, roll_no) VALUES (?, ?)', [name, roll_no], (err) => {
    if (err) return res.status(500).send(err.message);
    res.send('Student added successfully!');
  });
});

// GET endpoint to fetch all students
app.get('/students', (req, res) => {
  const dbWithDatabase = app.get('db'); // Retrieve the db connection with the database
  dbWithDatabase.query('SELECT * FROM students', (err, results) => {
    if (err) return res.status(500).send(err.message);
    res.json(results);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Node.js app running on port ${PORT}`);
});