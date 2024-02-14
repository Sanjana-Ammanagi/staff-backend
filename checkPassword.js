// checkPassword.js

const bcrypt = require('bcrypt');

const storedHash = '...'; // Replace with the hashed password from the database
const enteredPassword = '...'; // Replace with the password entered during login

bcrypt.compare(enteredPassword, storedHash, (err, result) => {
  if (result) {
    console.log('Passwords match!');
  } else {
    console.log('Passwords do not match.');
  }
});
