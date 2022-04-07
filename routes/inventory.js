const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')

const connection = require('../connection')

const { printQR, base64QR } = require('../middleware/qrcode')

router.use(bodyParser.json())

//api for adding exsisting product from product_id from: localhost:5000/inventory/addexsisting/:id
router.post('/addexsisting/:id', async(req, res) => {
    console.log("Incoming request for add product to exsisting products");
    
    //getting product_id from req.params.id
    const product_id = req.params.id;

    //query for getting quantity from db
    const qtyquery = `SELECT quantity FROM hotnot.product WHERE (product_id = ${product_id})`
    
    //fetching data from query
    connection.query(qtyquery, function(err, qty) {
        if(err) {
            //error in getting quantity of products from product_id
            console.log(err);
            return res.status(400).json({ error: err })
        }
        
        //getting new quantity
        let nqty = qty[0].quantity + req.body.quantity;
        
        //query for updating quantity from db
        let updatequery = `UPDATE hotnot.product SET quantity = ${nqty} WHERE (product_id = ${product_id}) `
        
        //query for updating the db
        connection.query(updatequery, function(err, data) {
            if(err) {
                //error
                console.log(err);
                return res.status(400).json({ error: err })
            }
            //returning success response
            console.log(data);
            return res.status(200).json({ data: data })
        })
    })

})

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