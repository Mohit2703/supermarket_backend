const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const Jimp = require('jimp')
const multer = require('multer');
const upload = multer({ dest: "files" });
var QrCode = require('qrcode-reader');
const fs = require('fs')
const { promisify } = require('util')
const unlinkAsync = promisify(fs.unlink)

const connection = require('../connection')

const { printQR, base64QR } = require('../middleware/qrcode');
router.use(bodyParser.json())

//api for adding exsisting product from product_id from: localhost:5000/inventory/addexsisting/:id
router.post('/addexsisting/:id', async (req, res) => {
    console.log("Incoming request for add product to exsisting products");

    //getting product_id from req.params.id
    const product_id = req.params.id;

    //query for getting quantity from db
    const qtyquery = `SELECT quantity FROM hotnot.product WHERE (product_id = ${product_id})`

    //fetching data from query
    connection.query(qtyquery, function (err, qty) {
        if (err) {
            //error in getting quantity of products from product_id
            console.log(err);
            return res.status(400).json({ error: err })
        }

        //getting new quantity
        let nqty = qty[0].quantity + req.body.quantity;

        //query for updating quantity from db
        let updatequery = `UPDATE hotnot.product SET quantity = ${nqty} WHERE (product_id = ${product_id}) `

        //query for updating the db
        connection.query(updatequery, function (err, data) {
            if (err) {
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

router.post('/add', async (req, res) => {
    console.log("Icoming request for add products");

    if (!(req.body.title && req.body.sell_price && req.body.cost_price && req.body.description)) {
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

    connection.query(query, function (err, row) {
        if (err) {
            console.log(err);
            return res.status(400).status({ error: err })
        }
        else {
            console.log(row);
            return res.status(200).json({ msg: printQR })
        }
    })

})

//api for getting exsisting products from: localhost:5000/inventory/allProducts
router.get('/allProducts', async (req, res) => {
    console.log("Incomig request for getting all Products");

    //query for getting all the product
    const query = `SELECT * FROM hotnot.product`

    //getting all the product from db
    connection.query(query, function (err, data) {
        if (err) {
            //returning error
            return res.status(400).json({ error: err })
        }
        //returning success
        return res.status(200).json({ data: data })
    })
})

router.delete('/deleteProduct/:id', async(req, res) => {
    console.log("Incomig request for deleting product");

    const proID = req.params.id

    const delQuery = `DELETE FROM hotnot.product WHERE (product_id = '${proID}')`

    connection.query(delQuery, function(err, success) {
        if(err) {
            return res.status(400).json({ error: err })
        }
        
        return res.status(200).json({ success: success })
    })
})

router.get('/fetchProduct', upload.single('qrcode'), async (req, res) => {
    // const proNum = req.body.proNum;

    //address for storing qr code photo
    // var buffer = fs.readFileSync('./qrcodes' + `/${proNum}.png`);
    var buffer = req.file
    console.log(buffer);


    Jimp.read(buffer.path, function (err, image) {
        if (err) {
            //returning error
            console.error(err);
            return res.status(400).json({ error: err })
        }
        // Creating an instance of qrcode-reader module
        let qrcode = new QrCode();
        qrcode.callback = (err, value) => {
            if (err) {
                //returning error
                console.error(err);
                return res.status(400).json({ error: err })
            }
            // Printing the decrypted value
            console.log(value.result);

            let query = `SELECT * FROM hotnot.product WHERE (product_id = ${value.result})`;

            connection.query(query, async (err, data) => {
                if (err) {
                    res.status(400).json({ error: err })
                }

                await unlinkAsync(buffer.path)

                return res.status(200).json({ data: data })
            })

        };
        // Decoding the QR code
        qrcode.decode(image.bitmap);
    })

})

    module.exports = router