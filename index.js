const express = require('express')
const mysql = require('mysql')
const connection = require('./connection')

const app = express();
require('dotenv').config()

connection.query("SELECT * FROM product", function (err, res) {
    if (err) throw err;
    console.log(res);
})

app.use('/inventory', require('./routes/inventory'))



const PORT = 5000;
app.listen(PORT)

console.log(`App running at: ${PORT}`);
