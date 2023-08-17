const mongoose = require('mongoose')
const mailSender = require("../utils/mailSender")
const emailTemplate = require("../mail/templates/emailVerificationTemplate")

const OTPSchema =new  mongoose.Schema(
    {
       email:{
        type:String,
        required:true
       },
       otp:{
           type:String,
           required:true,
       },
       createdAt:{
        type:Date,
        default:Date.now(),
        expires:60*5,// The document will be automatically deleted after 5 minutes of its creation time
       }
    }
);

// functoin to send mail
async function sendVerificationEmail(email , otp){
    try {
        const mailResponse =  await mailSender(
            email ,
            "verification Email From StudyNotoin",
            emailTemplate(otp)
        );
        console.log(`Email sent successfully${mailResponse.response}`);
    } catch (error) {
        console.log("error occur while sending mail",error.message);
        throw error;
    }
}

// PRE-Middleware before save i.e before OTP.create() method
OTPSchema.pre("save", async function(next){
	console.log("New document saved to database");
    
    // Only send an email when a new document is created
	if (this.isNew) {
		await sendVerificationEmail(this.email, this.otp);
    }
    next();
})

// module.exports = mongoose.model("OTP",OTPSchema) 

const OTP = mongoose.model("OTP", OTPSchema);
module.exports = OTP;