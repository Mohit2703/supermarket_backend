const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const fs = require('fs')
const connection = require('../connection')
const pdf = require('html-pdf');
//getting the pdf template
const pdfTemplate = require('../middleware/pdf-template');

router.use(bodyParser.json())

//api for making cart/ adding product to cart
router.post("/makeCart", async (req, res) => {
    //getting products from body
    const products = req.body.products;

    //getting user_id from body
    const userID = req.body.user_id;

    //checking for required data
    if (!(userID && products && products.length !== 0)) {
        console.log(" plzz fill the required details ");
        return res.status(400).json({ error: " plzz fill the required details " })
    }

    let pros = [];
    for (let i = 0; i < products.length; i++) {
        const pro = JSON.stringify(products[i])
        pros.push(pro)
    }
    //converting array to string
    let product = pros.join("@");

    //query for making cart
    let makeQuery = `INSERT INTO hotnot.new_cart (products, user_id) VALUES ('${product}', '${userID}')`

    //running query
    connection.query(makeQuery, function (err, cart) {
        if (err) {
            //returning error if any
            return res.status(400).json({ error: 34 })
        }

        //returning success status
        return res.status(200).json({ cart: cart })

    })

})

//api for getting cart details from 
router.get("/viewCart/:id", async (req, res) => {
    console.log("Incoming request for viewing cart");

    const cartID = req.params.id;

    const cartQuery = `SELECT * FROM hotnot.new_cart WHERE (cart_id = ${cartID})`

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

//api for getting sales of a particular date
router.get("/getSales", async (req, res) => {
    console.log("get total profit of the day");
    const date = req.body.date;

    if (!date) {
        return res.status(400).json({ error: "Plzz enter date" })
    }

    const saleQry = `SELECT * FROM hotnot.checkout WHERE (in_date = '${date}')`

    connection.query(saleQry, function (err, data) {

        if (err) {
            return res.status(400).json({ error: err })
        }
        const sales = data;
        let total_cost = 0;
        let total_profit = 0;
        let total_sell = 0;
        let total_qty = 0;

        for (let i = 0; i < sales.length; i++) {
            const x = array[i];
            total_cost += x.total_cost;
            total_profit += x.total_profit
            total_qty += x.total_qty
            total_sell += x.total_sell
        }

        let saleData = {
            profit: total_profit,
            sell: total_sell,
            cost: total_cost,
            qty: total_qty
        }

        return res.status(200).json({ saleData: saleData })
    })
})

//api for checkout/purchase of cart using cart_id running at: localhoost:5000/cart/checkout/:cart_id
router.post("/checkout/:id", async (req, res) => {

    //getting cartID from parameters
    const cartID = req.params.id;
    const userName = req.body.name
    const phone = req.body.phone

    //query for getting cart
    const qry = `SELECT * FROM hotnot.new_cart WHERE (cart_id = ${cartID})`

    //runing qry
    connection.query(qry, function (err, data) {

        if (err) {
            //retuning error in getting cart info
            return res.status(400).json({ error: err })
        }

        //canverting string to array
        const cartD = data[0].products.split("@");
        const userID = data[0].user_id;

        let cartData = [];
        let total_qty = 0;
        let total_sell = 0;
        let total_cost = 0;
        let total_profit;
        let cartDa = [];

        const currentDate = new Date();

        let currDate = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`

        //iterate through cart Data/ products in cart
        for (let i = 0; i < cartD.length; i++) {
            const x = JSON.parse(cartD[i]);
            let xpro = x.product_id;
            let xqty = x.quantity;
            let pData;

            try {
                //query for getting data of product from product_id
                let proQuery = `SELECT * FROM hotnot.product WHERE (product_id = ${xpro})`

                //running query for getting product data
                connection.query(proQuery, function (err, proData) {

                    if (err) {
                        //returning error if any in getting product data
                        return res.status(400).json({ error: err })
                    }

                    //checking the availablity of product
                    if (proData[0].quantity < xqty) {
                        //returning error if insufficent product
                        return res.status(400).json({ error: "Insufficent Products" })
                    }

                    total_qty += xqty;
                    total_cost += (xqty * proData[0].cost_price)
                    total_sell += (xqty * proData[0].sell_price)

                    let pro_qty = proData[0].quantity - xqty;

                    //updation query to update the qty of product in product table
                    let updateQry = `UPDATE hotnot.product set quantity = ${pro_qty} WHERE (product_id = ${xpro})`

                    //running updation query
                    connection.query(updateQry, function (err, success) {
                        if (err) {
                            //returning error if any
                            return res.status(400).json({ error: err })
                        }
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

                    //pushing json pData in array cartData
                    cartData.push(pData);
                    //converting JSON pData into string and pushing it in array cartDa
                    let xJSON = JSON.stringify(pData)
                    cartDa.push(xJSON);
                })
            } catch (error) {

                return res.status(400).json({ error: error })
            }

        }


        try {
            //setting Timeout as some time is required for getting data to be inserted
            setTimeout(() => {
                total_profit = total_sell - total_cost;
                let address;

                //converting array cartDa into string
                let cartDat = cartDa.join("@");

                //query for inserting data into checkout table
                const sellQry = `INSERT INTO hotnot.checkout (cart_data, total_qty, total_cost, total_sell, total_profit, name, phone, address, in_date) values ('${cartDat}', ${total_qty}, ${total_cost}, ${total_sell}, ${total_profit}, '${userName}', '${phone}', '${address}', '${currDate}')`

                //running query to insert data in checkout table
                connection.query(sellQry, function (err, dat) {
                    if (err) {
                        res.status(400).json({ error: err })
                    }
                    else {
                        return res.status(200).json({ reply: dat })
                    }

                })
            }, 4000)

        } catch (error) {
            return res.status(400).json({ error: error })
        }

    })
})

//api for generating invoice from checkout_id running at: localhoost:5000/cart/createInvoice/:checkout_id
router.get("/createInvoice/:id", async (req, res) => {
    console.log("Generate Invoice");

    //getting checkout Id from params
    const checkoutID = req.params.id;

    //query for finding info 
    const checkQuery = `SELECT * FROM hotnot.checkout WHERE (checkout_id = ${checkoutID})`

    //running query
    connection.query(checkQuery, function (err, invoiceDet) {

        if (err) {
            //returning error if any
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

            //passing params for creating pdf and instance of pdf at routes/invoice.pdf
            pdf.create(pdfTemplate({ a, name, phone, receiptId, in_date, total_amount, promo }), {})
                .toFile('./routes/invoice.pdf', (err) => {
                    if (err) {
                        //returning error if any
                        return res.status(400).json({ error: err })
                    }
                    //return success status
                    res.status(200).sendFile(`${__dirname}/invoice.pdf`)
                })

        }
    })
})

module.exports = router