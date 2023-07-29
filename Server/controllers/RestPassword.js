
const User = require("../models/User")
const mailSender = require("../utils/mailSender")
const bcrypt = require('bcrypt')
const crypto = require("crypto")

// *resetPassword Token -> this will send a frontend mail to user
exports.resetPasswordToken = async (req, res)=>{
    try {
        // get email from req body
        const {email}= req.body
        // check user for this email, email validation
        const user = await User.findOne({email})
        if(!user){
            return res.json(
                {
                    success:false,
                    message:`Your Email is not registered with us`
                }
            )
        }
        // generate token here token refers to a string-value
        const token = crypto.randomBytes(20).toString("hex")
        console.log("token",token);

        // update user by adding token and expiratio time
        const updatedDetails = await User.findOneAndUpdate({email:email} , {
                        token:token,
                        resetPasswordExpires:Date.now() + 5*60*1000, // 5minutes
                    } ,
                    {new:true});

            console.log("DETAILS", updatedDetails);

        // create URL
        const url = `http://localhost:3000/update-password/${token}`; //frontend url

        // send mail with url
        await mailSender(
            email,
            "Password Reset",
            `Your Link for email verification is ${url}. Please click this url to reset your password.`
        )


        // return response
        return res.json(
            {
                success:true,
                message:`Email Sent Successfully, Please Check Your Email to Continue Further`
            }
        )

    } catch (error) {
        console.log(error);
        return res.status(500).json(
            {
                success:false,
                message:`Some Error in Sending the Reset Message`
            }
        )
    }
}




// *resetPassword->update the password in DB.
exports.resetPassword = async (req ,res)=>{
    try {
        // data fetch
        const { password , confirmPassword , token} = req.body
        // token is required to search the document with the help of token

        // validation
        if(password !== confirmPassword){
            return res.json(
                {
                    success:false,
                    message:`Password and confirmPassword doesn't match`
                }
            )
        }

        // get user details from DB using token
        const userDetails = await User.findOne({token:token});
        
        // if no entry-> invalid token || token time expire
        if(!userDetails){
            return res.json(
                {
                    success:false,
                    message:`Token is invalid`
                }
            )
        }

        if(userDetails?.resetPasswordExpires < Date.now()){ //token expires
            return res.json(
                {
                    success:false,
                    message:`Token expires, please regenerate token again`
                }
            )
        }

        // hash the pwd 
        const hashedPassword = await bcrypt.hash(password , 10)

        // update the pwd in db
       const updatedUser = await User.findOneAndUpdate( {token:token} , 
            {
                password:hashedPassword
            } ,
            {new:true})

        // return response
        updatedUser.password = undefined;
        return res.status(200).json(
            {
                success:true,
                message:`Pwd reset successfully`,
            }
        )
    } catch (error) {
        console.log(error);
        return res.status(500).json(
            {
			    error: error.message,
                success:false,
                message:`Some Error in Updating the Password `
            }
        )
    }

};