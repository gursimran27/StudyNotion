
// Import the required modules
const express = require("express");
const router = express.Router();

const { capturePayment , verifySignature } = require("../controllers/Payments");

// Import middlewares
const { auth , isStudent , isInstructor , isAdmin}= require("../middleware/auth");

router.post("/capturePayment", auth , isStudent , capturePayment)
router.post("/verifySignature" , verifySignature)


module.exports = router