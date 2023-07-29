// refer to https://razorpay.com/docs/partners/aggregators/partner-auth/payment-gateway/


const Razorpay = require('razorpay')
require("dotenv").config()


exports.instance = new Razorpay(
    {
        key_id: process.env.RAZORPAY_KEY,
        key_secret: process.env.RAZORPAY_SECRET,
    }
);