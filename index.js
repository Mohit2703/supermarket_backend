const express = require('express')
const mysql = require('mysql')
const connection = require('./connection')

const app = express();
require('dotenv').config()

app.use('/inventory', require('./routes/inventory'))



const PORT = 5000;
app.listen(PORT)

console.log(`App running at: ${PORT}`);
