module.exports = ({ a, name, phone, receiptId, in_date, total_amount, promo }) => {
    let html1 = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
        <style>
            .invoice_body{
                padding: 0 2%;
            }
            h2 {
                text-align: center;
            }
            .general_detail {
                border-top: solid #000 1px;
                display: flex;
                justify-content: space-between;
                border-bottom: solid #000 1px;
            }
            ul {
                list-style: none;
            }
            .billing_detail {
                width: 500px;
            }
            span{
                color: rgb(51, 51, 51);
                font-size: 1.2rem;
                font-weight: bolder;
            }
            li{
                margin: 2px 0;
            }
            .table_detail {
                width: 100%;
            }
            table {
                width: 100%;
                text-align: center;
                margin: 10px 0;
            }
            .head_row{
                background: #aaa;
            }
            th{
                margin: 0;
                padding: 0;
                border-bottom: #000 solid 1px;
                border-top: #000 solid 1px;
            }
            td{
                padding: 10px 0;
                border-bottom: #aaa solid 1px;
                /* border-top: #222 solid 1px; */
            }
            .last_row {
                background: #aaa;
            }
            .last_col {
                border-bottom: #000 solid 1px;
                border-top: #000 solid 1px;
            }
        </style>
    </head>
    <body>
        <div class="invoice_body">
            <h2>Tax Invoice</h4>
            <div class="general_detail">
                <div class="invoice_detail">
                    <ul class="in_detail">
                    <li class="in_d"><h3>HotNot pvt. ltd.</h3></li>
                        <li class="in_d"><span>Receipt Id:</span> ${receiptId}</li>
                        <li class="in_d"><span>Order Date:</span> ${in_date}</li>
                    </ul>
                </div>
                <div class="billing_detail">
                    <div class="bill_detail">
                        <h4>Billed To:</h4>
                        <h5>${name}</h5>
                        <p>Phone: ${phone}</p>
                    </div>
                </div>
            </div>
            <div class="table_detail">
                <table>
                    <tr class="head_row">
                        <th>Title</th>
                        <th >Description</th>
                        <th >Qty</th>
                        <th >Price</th>
                        <th >Total</th>
                    </tr>`

    const createRow = (item) => {
        html1 +=
        `<tr>
        <td>${item.title}</td>
        <td>${item.description}</td>
        <td>${item.qty}</td>
        <td>${item.sell_price}</td>
        <td>${item.sell_price * item.qty}</td>
    </tr>`
    }

    a.forEach(createRow);

    const htmlLast = `<tr class="last_row">
    <td class="last_col"></td>
    <td class="last_col"></td>
    <td class="last_col"></td>
    <td class="last_col"></td>
    <td class="last_col">${total_amount}</td>
    </tr>
    </table>
    </div>
    </div>
    </body>
    </html>`

    html1 += htmlLast

    return html1;
}