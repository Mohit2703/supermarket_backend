// Require the package
const QRCode = require('qrcode')
var Jimp = require("jimp");
var fs = require('fs')
var QrCode = require('qrcode-reader');
const { path } = require('express/lib/application');
const res = require('express/lib/response');

// var buffer = fs.readFileSync(__dirname + '/image.png');

// Print the QR code to terminal
const printQR = (stringdata) => {
    QRCode.toString(stringdata, { type: 'terminal' },
        function (err, QRcode) {

            if (err) return console.log("error occurred")

            // Printing the generated code
            console.log(QRcode)
        })
}

// Converting the data into base64
const base64QR = (stringdata) => {
    QRCode.toDataURL(stringdata, function (err, code) {
        if (err) return console.log("error occurred")

        // Printing the code
        console.log(code)
        return code;
    })
}

const getDataQR = async (buffer, res) => {
    console.log(buffer);
    Jimp.read(buffer, function (err, image) {
        if (err) {
            console.error(err);
        }
        // Creating an instance of qrcode-reader module
        let qrcode =  new QrCode();
        let data;
        qrcode.callback = (err, value) => {
            if (err) {
                console.error(err);
            }
            // Printing the decrypted value
            console.log(value.result);
            return res.status(200).json({ msg: value.result })
            
            // data = value.result;
        };
        // Decoding the QR code
        qrcode.decode(image.bitmap);
    })
}

const saveQrcode2Loval = async(string) => {
    // const filename = path.join(process.cwd(), `${string}.png`)
    
    try {
        await QRCode.toFile(`./qrcodes/${string}.png`, string)
   }
   catch(err) {
       console.log(err);
   }
}

module.exports = { printQR, base64QR, getDataQR, saveQrcode2Loval }