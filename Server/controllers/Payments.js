
const mongoose = require('mongoose')
const { instance } = require('../config/razorpay')
const Course = require("../models/Course")
const User = require("../models/User")
const mailSender = require("../utils/mailSender")
const { courseEnrollmentEmail } = require("../mail/templates/courseEnrollmentEmail")



// *capture Payment and initiate the Razorpay order (creation)
exports.capturePayment = async( req , res )=>{
        
        // get course id and user id
        const { course_id } = req.body;
        const userId  = req.user.id;

        // validation
        // valid courseID
        if(!course_id){
            return res.json(
                {
                    success:false,
                    message:`Please provide the vaild course ID`
                }
            )
        }
        // valid courseDetails
        let course;
        try {
        course = await Course.findById(course_id);
            if(!course){
                return res.json(
                    {
                        success:false,
                        message:`Could not find the course`
                    }
                ) 
            }

        // check whether User already pay for the same course
        // as userId is in form of string and in course model studentsEnrolled contain objectId so..
        const uid = new mongoose.Types.ObjectId(userId); // converted to object_id
        if(course.studentsEnrolled.includes(uid)){
            return res.status(200).json(
                {
                    success:false,
                    message:"You are already enrolled in this course"
                }
            )
        }

        } catch (error) {
            console.log(error);
            return res.status(500).json(
                {
                    success:false,
                    message:error.message,
                }
            )
        }

        // create order 
        // refer https://razorpay.com/docs/partners/aggregators/partner-auth/payment-gateway/
        const amount = course?.price;
        const curency = "INR";

        const options = {
            amount: amount * 100,
            curency:curency,
            receipt: Math.random(Date.now()).toString(),
            notes:{//important
                courseId:course_id,
                userId
            }

        }

        try {     
            // initiate the payment using Razorpay
            const paymentResponse = await instance.orders.create(options);
            console.log(paymentResponse);

             // return res
            return res.status(200).json(
                {
                    success:true,
                    courseName:course.courseName,
                    courseDescription: course.courseDescription,
                    thumbnail: course.thumbnail,
                    orderId: paymentResponse.id,
                    currency: paymentResponse.currency,
                    amount:paymentResponse.amount,
                }
            )

        } catch (error) {
            console.log(error);
            return res.json(
                {
                    success:false,
                    message:`Could not initiate the order`
                }
            )
        }
};








// *verify Signature of Razorpay and Server
// the below handler will be hit by the webHook by Razorpay 
exports.verifySignature = async(req,res)=>{
    // the req here is from Razorpay webhook not from frontend
    const webhookSecret = "12345678";

    const signature = req.headers["x-razorpay-signature"]; // it is the syntax done by razorpay 
    // the signature we received is hashed...so it cannot be decrypted back...so we need to hash our webhookSecret in the same way the signature was hashed..

    const shasum = crypto.createHmac("sha256" , webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if(signature === digest){
        console.log("Payment is Authorized");

        // since the request is not from frontend ..so now we use notes in its req ...as while creating the order we have also passed notes having userid and courseid in options object

        const { courseId , userId } = req.body.payload.payment.entity.notes;//see by log

        try {
            
            // find the course and enroll the userid in it
            const enrolledCourse = await Course.findByIdAndUpdate( {_id:courseId} , {
                $push : {
                    studentsEnrolled:userId
                }
            } ,{new:true})

            if(!enrolledCourse){
                return res.status(500).json(
                    {
                        success:false,
                        message:`Course not found`
                    }
                );
            }
            console.log(enrolledCourse);

            // find the User and enroll the course id in it
            const enrolledStudent = await User.findByIdAndUpdate( {_id: userId},{
                $push:{
                    courses:courseId
                }
            } , {new:true})

            console.log(enrolledCourse);

            // send mail
            const emailResponse = await mailSender(enrolledStudent.email ,
                courseEnrollmentEmail(enrolledCourse.courseName , enrolledStudent.firstName));

                console.log(emailResponse);
                return res.status(200).json(
                    {
                        success:true,
                        message:`Signature verified and Course added`
                    }
                )

        } catch (error) {
            console.log(error);
            return res.status(500).json(
                {
                    success:false,
                    message:error.message
                }
            );
        }

    } else{
        return res.status(500).json(
            {
                success:false,
                message:`Invalid request`
            }
        )
    }

     
};
