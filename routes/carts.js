const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const fs = require('fs')
const connection = require('../connection')
const pdfTemplate = require('../middleware/pdf-template');
const pdf = require('html-pdf');

router.use(bodyParser.json())

router.post("/makeCart", async (req, res) => {
    console.log("Incoming request for making cart");

    const products = req.body.products;

    const userID = req.body.user_id;

    // if(!(userID && products && products.length !== 0)) {
    //     console.log(" plzz fill the required details ");
    //     return res.status(400).json({ error:  " plzz fill the required details "})
    // }

    let pros = [];
    for (let i = 0; i < products.length; i++) {
        const pro = JSON.stringify(products[i])
        pros.push(pro)
    }
    let product = pros.join("@");

    let makeQuery = `INSERT INTO hotnot.new_cart (products, user_id) VALUES ('${product}', '${userID}')`

    connection.query(makeQuery, function (err, cart) {
        if (err) {
            return res.status(400).json({ error: 34 })
        }

        console.log(cart);
        return res.status(200).json({ cart: cart })

    })

})

router.get("/viewCart/:id", async (req, res) => {
    console.log("Incoming request for viewing cart");

    const userID = req.params.id;

    const cartQuery = `SELECT * FROM hotnot.new_cart WHERE (user_id = ${userID})`

    connection.query(cartQuery, function (err, data) {
        if (err) {
            return res.status(400).json({ error: err })
        }

        if (data.length === 0) {
            return res.status(400).json({ error: "Data not found" })
        }

        const cart = data[0];

        const pros = cart.products.split("@");

        let products = [];
        for (let i = 0; i < pros.length; i++) {
            products.push(JSON.parse(pros[i]));
        }

        console.log(products);

        return res.status(200).json({ cart: products })

    })

})

router.get("/getSales", async(req, res) => {
    console.log("get total profit of the day");
})

router.post("/checkout/:id", async (req, res) => {
    const cartID = req.params.id;

    const qry = `SELECT * FROM hotnot.new_cart WHERE (cart_id = ${cartID})`

    connection.query(qry, function (err, data) {

        console.log("data from the cart done");
        if (err) {
            return res.status(400).json({ error: err })
        }

        const cartD = data[0].products.split("@");
        const userID = data[0].user_id;

        let cartData = [];
        let total_qty = 0;
        let total_sell = 0;
        let total_cost = 0;
        let total_profit;
        let cartDa = [];

        for (let i = 0; i < cartD.length; i++) {
            const x = JSON.parse(cartD[i]);
            let xpro = x.product_id;
            let xqty = x.quantity;
            let pData;

            try {
                let proQuery = `SELECT * FROM hotnot.product WHERE (product_id = ${xpro})`
                connection.query(proQuery, function (err, proData) {

                    console.log("Product data done");
                    if (err) {
                        return res.status(400).json({ error: err })
                    }

                    if (proData[0].quantity < xqty) {
                        return res.status(400).json({ error: "Insufficent Products" })
                    }

                    total_qty += xqty;
                    total_cost += (xqty * proData[0].cost_price)
                    total_sell += (xqty * proData[0].sell_price)

                    let pro_qty = proData[0].quantity - xqty;

                    let updateQry = `UPDATE hotnot.product set quantity = ${pro_qty} WHERE (product_id = ${xpro})`

                    connection.query(updateQry, function(err, success) {
                        if(err) {
                            console.log(err);
                            return res.status(400).json({ error: err })
                        }
                        console.log(success);
                    })

                    pData = proData;
                    pData = {
                        product_id: proData[0].product_id,
                        title: proData[0].title,
                        description: proData[0].description,
                        qty: xqty,
                        sell_price: proData[0].sell_price,
                        total_sell: (xqty * proData[0].sell_price)
                    }
                    console.log(pData);
                    cartData.push(pData);
                    let xJSON = JSON.stringify(pData)
                    cartDa.push(xJSON);
                })
            } catch (error) {
                console.log(error);
                return res.status(400).json({ error: error })
            }

        }

        let phone;
        let name;
        let address;


        try {
            const userQry = `SELECT * FROM hotnot.user WHERE (user_id = ${userID})`

            connection.query(userQry, function (err, userD) {

                console.log("data from user done");
                if (err) {
                    return res.status(400).json({ error: err })
                }

                phone = userD[0].phone;
                name = userD[0].name
                address = userD[0].address

                setTimeout(() => {
                    total_profit = total_sell - total_cost;
                    console.log(cartData);

                    let cartDat = cartDa.join("@");
                    const sellQry = `INSERT INTO hotnot.checkout (cart_data, total_qty, total_cost, total_sell, total_profit, name, phone, address) values ('${cartDat}', ${total_qty}, ${total_cost}, ${total_sell}, ${total_profit}, '${name}', '${phone}', '${address}')`
                    connection.query(sellQry, function (err, dat) {
                        console.log("data added to checkout");
                        if (err) {
                            console.log(err);
                            res.status(400).json({ error: err })
                        }
                        else {
                            console.log(dat);
                            return res.status(200).json({ reply: dat })
                        }

                    })
                }, 5000)
            })

        } catch (error) {
            return res.status(400).json({ error: error })

        }

    })
})


router.get("/createInvoice/:id", async(req, res) => {
    console.log("Generate Invoice");

    const checkoutID = req.params.id;

    const checkQuery = `SELECT * FROM hotnot.checkout WHERE (checkout_id = ${checkoutID})`

    connection.query(checkQuery, function(err, invoiceDet) {

        if(err) {
            console.log(err);
            return res.status(400).json({ error: err })
        }

        else {

            const arr = invoiceDet[0].cart_data.split("@");
            const receiptId = invoiceDet[0].checkout_id
            const in_date = invoiceDet[0].in_date
            const total_amount = invoiceDet[0].total_sell
            const total_qty = invoiceDet[0].total_qty
            const promo = 5
            const name = invoiceDet[0].name
            const address = invoiceDet[0].address
            const phone = invoiceDet[0].phone

            let a = []
            for (let i = 0; i < arr.length; i++) {
                const data = JSON.parse(arr[0])
                a.push(data)
            }

            pdf.create(pdfTemplate({a, name, phone, address, receiptId, in_date, total_amount, promo}),{})
            .toFile('./routes/invoice.pdf', (err) => {
                if(err) {
                    return res.status(400).json({ error: err })
                }
                res.status(200).sendFile(`${__dirname}/invoice.pdf`)
            })

        }
    })
})

module.exports = router