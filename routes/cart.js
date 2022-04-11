const express = require('express')
const router = express.Router();
const bodyParser = require('body-parser')
const fs = require('fs');
const { getDataQR } = require('../middleware/qrcode');
const connection = require('../connection');
const Jimp = require('jimp')
var QrCode = require('qrcode-reader');
const pdf = require('html-pdf');
// const pdf = require('pdf-creator-node');
const pdfTemplate = require('../middleware/pdf-template');

router.use(bodyParser.json())

router.post('/makeCart', async (req, res) => {
    console.log("Incoming req for adding cart");

    let products = req.body.products;
    let phone = req.body.phone;
    let name = req.body.name;
    let address = req.body.address;

    let user_id;
    let user;
    try {

        //query for searching user using phone number from user table
        let findUser = `SELECT * FROM hotnot.user WHERE (phone = '${phone}')`

        //running findUser query in db
        connection.query(findUser, function (err, data) {

            if (err) {
                //returning error
                return res.status(400).json({ error: err })
            }
            console.log("user details");
            console.log(data);
            user = data;

            //if user is not present create user in db
            if (user.length === 0) {
                try {
                    console.log("user not found");
                    //converting address from JSON to text
                    let addJSON = JSON.stringify(address);

                    //query to insert user in db
                    let addUser = `INSERT INTO hotnot.user (name, phone, address) VALUES ('${name}', '${phone}', '${addJSON}');`

                    //running addUser query in db
                    connection.query(addUser, function (err, data) {

                        if (err) {
                            //returning error
                            return res.status(400).json({ error: err })
                        }

                        console.log(data);
                        user_id = data.insertId
                    })

                } catch (error) {
                    //returning error
                    return res.status(400).json({ error: error })
                }
            }
            else {
                user_id = data[0].user_id
            }

            //empty array for storing products text
            let pros = [];
            let total_cost = 0;
            let total_sell = 0;
            let total_profit = 0;

            //running loop for pushing data
            try {
                for (let i = 0; i < products.length; i++) {
                    //storing products[i] data in ele
                    const ele = products[i];
                    const title = ele.title;
                    const description = ele.description;
                    const cost_price = ele.cost_price;
                    const sell_price = ele.sell_price;
                    const qty = ele.qty;
                    const sell = sell_price * qty;
                    const cost = cost_price * qty;
                    const profit = sell - cost;
                    total_cost += cost;
                    total_sell += sell;
                    total_profit += profit;
    
                    //product JSON
                    let pro = {
                        id: ele.product_id,
                        title: title,
                        description: description,
                        qty: qty,
                        cost_price: cost_price,
                        sell_price: sell_price,
                        total: sell,
                        cost: cost,
                        profit: profit
                    }
    
                    // try {
                        console.log(pro.id);
                        let proQty = `SELECT quantity FROM hotnot.product WHERE (product_id = ${pro.id})`
    
                        connection.query(proQty, function(err, qty) {
                            if(err) {
                                return res.status(400).json({ error: err })
                            }
    
                            console.log(qty);
    
                            if(pro.qty > qty.quantity) {
                                return res.status(400).json({ error: "Insufficent product" })
                            }
    
                            
                            try {
                                console.log("Update products in product table");
                                
                                let newQty = qty.quantity - pro.qty;
    
                                let updatequery = `UPDATE hotnot.product SET quantity = ${newQty} WHERE (product_id = ${pro.id}) `
    
                                connection.query(updatequery, function(err, data) {
                                    if(err) {
                                        console.log(err);
                                    }
                                    console.log(data                                                                                                                            );
                                })
    
                            } catch (error) {
                                return res.status(400).json({ error: error })
                            }
                        })
    
                    // } catch (error) {
                    //     return res.status(400).json({ error: error })
                    // }
    
                    //converting JSON to String
                    let proST = JSON.stringify(pro)
    
                    //pushing String into array
                    pros.push(proST);
                }
                
            } catch (error) {
                console.log(error);
            }

            //converting array into String
            // let prosST = pros.toString();
            let prosST = pros.join("@")

            //defining promo code
            let promo;
            if (total_sell < 1000) {
                promo = 2.5
            }
            else if (total_sell >= 1000 && total_sell < 2000) {
                promo = 5
            }
            else if (total_sell >= 2000 && total_sell < 3000) {
                promo = 10
            }
            else {
                promo = 15
            }

            //query for inserting into cart
            const addQuery = `INSERT INTO hotnot.cart (products, total_sell, total_cost, total_profit, user_id, promo) VALUES ('${prosST}', '${total_sell}', '${total_cost}', '${total_profit}', '${user_id}', '${promo}')`

            //running query into db
            connection.query(addQuery, function (err, cart) {
                if (err) {

                    //returning error
                    return res.status(400).json({ error: err })
                }
                console.log(cart);

                //returning success response
                return res.status(200).json({ cart: cart, promo: promo })

            })
        })

    } catch (error) {

        //returning error
        return res.status(400).json({ error: error })
    }

})

router.get('/fetchProduct', async (req, res) => {
    const proNum = req.body.proNum;

    //address for storing qr code photo
    var buffer = fs.readFileSync('./qrcodes' + `/${proNum}.png`);

    Jimp.read(buffer, function (err, image) {
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

            connection.query(query, function (err, data) {
                if (err) {
                    res.status(400).json({ error: err })
                }

                return res.status(200).json({ data: data })
            })

        };
        // Decoding the QR code
        qrcode.decode(image.bitmap);
    })

})

router.get('/getCartFromDate', async (req, res) => {
    //getting date
    const date = req.body.date;
    console.log(`GET cart data of date: ${date}`);

    //query for getting cart/sell of that date
    const cartDate = `SELECT * FROM hotnot.cart WHERE (in_date = '${date}')`

    //running query
    connection.query(cartDate, function (err, cart) {
        if (err) {
            //returning error
            return res.status(400).json({ error: err })
        }

        let total_profit = 0;
        for (let i = 0; i < cart.length; i++) {
            total_profit += cart[0].total_profit;
        }

        //returning success
        return res.status(200).json({ cart: cart, total_profit: total_profit })
    })

})

router.post('/fetchInvoice', async(req, res) => {
    console.log(" fetching invoice pdf ");

    const cart_id = req.body.cart_id;

    try {
        //query for getting cart data from cart_id
        const cartQuery = `SELECT * FROM hotnot.cart WHERE (cart_id = ${cart_id})`

        //running query
        connection.query(cartQuery, function(err, cart) {
            const arr = cart[0].products.split("@");
            const receiptId = cart[0].cart_id
            const in_date = cart[0].in_date
            const total_amount = cart[0].total_sell
            const promo = cart[0].promo

            let a = []
            for (let i = 0; i < arr.length; i++) {
                const data = JSON.parse(arr[0])
                a.push(data)
            }

            pdf.create(pdfTemplate({a, receiptId, in_date, total_amount, promo}),{})
            .toFile('invoice.pdf', (err) => {
                if(err) {
                    return res.status(400).json({ error: err })
                }
                res.status(200).sendFile(`${__dirname}/invoice.pdf`)
            })

        })
    } catch (error) {
        
    }
})

module.exports = router