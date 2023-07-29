const bcrypt = require('bcrypt')
const User = require("../models/User")
const OTP = require("../models/OTP")
const Profile = require("../models/Profile")
const otpGenerator = require("otp-generator")
const jwt = require('jsonwebtoken')
const mailSender = require("../utils/mailSender")
const { passwordUpdated } = require("../mail/templates/passwordUpdate")
const { use } = require('../routes/User')

require('dotenv').config();



// *sendOTP while signup for email verification
exports.sendOTP = async(req , res)=>{

    try {
        // fetch emial from req body
    const {email} = req.body;

    if(!email){
        return res.status(500).json(
            {
                success:false,
                error:"Email is required",
            }
        )
    }

    // check if user already exist in DB
    const checkUserPresent = await User.findOne({email})

    // if user already exist, then return a response
    if(checkUserPresent){
      return  res.status(401).json( //401->unauthorised
        {
            success:false,
            message:`User already registered`
        }
      )
    }

    //   generate OTP
    var otp = otpGenerator.generate(6 , 
        { //6->mean length of otp
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars: false
        })

        console.log(`otp generated->${otp}`);

        // check unique otp or not
        let result = await OTP.findOne({otp:otp})

        while(result){
            otp = otpGenerator.generate(6 , 
                { //6->mean length of otp
                    upperCaseAlphabets:false,
                    lowerCaseAlphabets:false,
                    specialChars: false
                })
                result = await OTP.findOne({otp:otp})
        }

        // *from line number 36 to 45 is a bad practice...in industry level they deal with some special services that gurantee that OTP is unique

        const otpPayload = {email , otp}
        
        // create an entry in DB for OTP
        // before the below code is executed the Pre-middleware is invoked that send otp email
        const otpBody = await OTP.create(otpPayload)
        
        console.log("OTP Body", otpBody);

        // return response successfully
        res.status(200).json(
            {
                success:true,
                message:`OTP sent Successfully`,
                data:otp,
            }
        )


    } catch (error) {
        console.log(error);
        return res.status(500).json(
            {
                success:false,
                message:error.message,
            }
        )
    }

}




// *signup
exports.signUp = async (req , res)=>{

    try {
        
        // data fetch from req body
        const{
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body

        // validate krlo
        if(!firstName || !lastName || !email ||!password || !confirmPassword ||!otp){
            return res.status(403).json(
                {
                    success:false,
                    message:`All fields are required`,
                }
            )
        }

        // Check if password and confirm password match
        if(password !== confirmPassword){
            return res.status(400).json(
                {
                    success:false,
                    message:"passwords and confirmPassword do not match"
                }
            )
        }

        // check user already exist or not
        const existingUser = await User.findOne({email})
        if(existingUser){
            return res.status(400).json(
                {
                    success:false,
                    message:`User already exists. Please sign in to continue`
                }
            )
        }

        // find the most recent OTP stored for that USER 
        const response = await OTP.find({email}).sort({createdAt:-1}).limit(1); //!note
        // validate OTP
        console.log(`recent otp=>${response}`);
        if(response.length === 0){
            // otp not found
            return res.status(400).json(
                {
                        success:false,
                        message:`OTP not found`                
                }
            )
            
        } else if(otp !== response[0].otp){ 
            // invalid otp entered by user
            return res.status(400).json(
                {
                    success:false,
                    message:"Invalid OTP"
                })
        }

        // hash the password
        const hashedPassword = await bcrypt.hash(password , 10);

        // create the user
        // let approved = "";
        // approved ==="Instructor" ? (approved = false) : (approved = true)
        let approved = (accountType === "Instructor") ? false : true;


        // create entry in DB

        const profileDetails =await Profile.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null
        })

         const user = await User.create(
            {
                firstName,
                lastName,
                email,
                contactNumber,
                password:hashedPassword,
                accountType:accountType,
                approved:approved,
                additonalDetails:profileDetails?._id,
                image:`https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`
            }
         );

        // return res
        console.log("User created successfully")
        return res.status(200).json(
            {
                success:true,
                message:`User is registered Successfully`,
                user
            }
        )

    } catch (error) {
        console.log(error);
        return res.status(500).json(
            {
                success:false,
                error:"Internal Server Error",
                message:`User cannot be registerd please try again`
            }
        )
    }
}



// *login
exports.login = async (req , res)=>{
    try {
        // fetch data
        const { email , password } = req.body

        // validation of data
        if(!email || !password){
            return res.status(403).json(
                {
                    success:false,
                    message:`All field are required`
                }
            )
        }

        // check if user exist or not in DB
        const user = await User.findOne({email})
        .populate("additonalDetails")
        .exec();
        if(!user){
            return res.status(401).json(
                {
                    success:false,
                    message:'User is not Registered with us Please SignUp to Continue'
                }
            )
        }

        // generate JWT, after password matching
        if(await bcrypt.compare(password , user?.password)){

            const payload = {
                id : user._id,
                email:user?.email,
                accountType:user?.accountType
            }

            const token = jwt.sign(payload , process.env.JWT_SECRET,{
                expiresIn : '24h',
            })
            user.token = token // this is not done in DB
            user.password = undefined


        // create cookie and send response
        // .cookie(cookieName , data , optoins)
        const options = {
            expires: new Date(Date.now() + 3*24*60*60*1000), //3days
            httpOnly: true,
        }
        res.cookie("token" , token , options).status(200).json(
            {
              success:true,
               user,
               token,
               message:`Logged in Successfully`
            }
        )
        } else{
            return res.status(401).json(
                {
                    success:false,
                    error:"Invalid Password",
                }
            )
        }
        

    } catch (error) {
        console.log(error);
        return res.status(500).json(
            {
                success:false,
                error:"Login Failure, Please try again",
            }
        )
    }
}

// TODO: changePassword
exports.changePassword = async(req , res)=>{
    try {
    // get data from req body
    const { oldPassword , newPassword , confirmNewPassword } = req.body;

    // get the user id
    const userId = req.user.id;

    // fetch userDetails
    const userDetails = await User.findById(userId);

    // validation
    // validate the old password
    const isPasswordMatch = await bcrypt.compare(oldPassword, userDetails.password);

    if(!isPasswordMatch){
        return res.status(401).json(
            {
                success:false,
                message:'Incorrect Password'
            }
        )
    }

    // Match new password and confirm new password
    if(newPassword !== confirmNewPassword){
        return res.status(400).json({
            success: false,
            message: "The password and confirm password does not match",
        });
    }
    // update pwd in DB
    const encryptedPassword = await bcrypt.hash(newPassword , 10);
    const updatedUserDetails = await User.findByIdAndUpdate(
        userId,
        {password:encryptedPassword},
        {new:true}
    );

    // send mail - password updated
    try {
        const emailResponse = await mailSender(
            updatedUserDetails.email,
            passwordUpdated(
                updatedUserDetails.email,
                `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
            )
        );
        console.log("Email sent successfully:", emailResponse.response);
        
    } catch (error) {
        console.error("Error occurred while sending email:", error);
			return res.status(500).json({
				success: false,
				message: "Error occurred while sending email",
				error: error.message,
			});
    }

    // return response
    return res.status(200).json(
        { success: true, message: "Password updated successfully" 
        });

    } catch (error) {
        // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
		console.error("Error occurred while updating password:", error);
		return res.status(500).json({
			success: false,
			message: "Error occurred while updating password",
			error: error.message,
		});
    }
}