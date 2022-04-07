const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')

const connection = require('../connection')

const { printQR, base64QR } = require('../middleware/qrcode')

router.use(bodyParser.json())

router.post('/add', async(req, res) => {
    console.log("Icoming request for add products");

    if(!(req.body.title && req.body.sell_price && req.body.cost_price && req.body.description)) {
        return res.status(422).json({ error: "Ivalid Data" })
    }

    const currentDate = new Date();
    
    
    let currDate = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()} ${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`
    
    const data = {
        title: req.body.title,
        description: req.body.description,
        sell_price: req.body.sell_price,
        cost_price: req.body.cost_price,
        created: currDate
    }
    
    const qrdata = JSON.stringify(data);

    const qr_code_hash = printQR(qrdata);

    let query = `insert into product (title, description, cost_price, sell_price, qr_code_hash, created) values ('${req.body.title}', '${req.body.description}', '${req.body.cost_price}', '${req.body.sell_price}', '${qr_code_hash}', '${currDate}');`

    connection.query(query, function(err, row) {
        if(err) {
            console.log(err);
            return res.status(400).status({ error: err })
        }
        else {
            console.log(row);
            return res.status(200).json({ msg: printQR })
        }
    })

})

module.exports = router