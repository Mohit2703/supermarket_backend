const mysql = require('mysql')

let connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'password',
    database: 'hotnot',
    port: '3306'
})

connection.connect((err) => {
    if(err) {
        throw err
    }
    else {
        console.log("Connected");
        // connection.query("SELECT * FROM product", function(err, res) {
        //     if(err) throw err;
        //     console.log(res);
        // })
    }
})

module.exports = connection