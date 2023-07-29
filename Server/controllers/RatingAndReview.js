const { default: mongoose } = require("mongoose");
const Course = require("../models/Course");
const RatingAndReview = require("../models/RatingAndReview");



// *createRating
exports.createRating = async (req ,res )=>{
    try {
        
        // get user id
        const userId  = req.user.id;

        // fetch data from req body
        const { CourseId , rating , review } = req.body;

        // check if user is enrolled in that course or not,if not user cann't rate or review
        const courseDetails = await Course.findOne( { _id:CourseId,
            studentsEnrolled: { $elemMatch :{$eq: userId}, }// searching criteria //$eq->equal
        });//it a way to check ....another way is using .includes() method ..take referance from capturePayment handler func line 43,44
        if(!courseDetails){
            return res.status(404).json(
                {
                    success:false,
                    message:`Student is not enrolled in the Course.`
                }
            )
        }
       

        // check if user alredy reviewes the course
        const alreadyReviewed = await RatingAndReview.findOne(
            {
                user: userId,
                course:CourseId
            }
        )
        if(alreadyReviewed){
            return res.status(400).json(
                {
                    success:false,
                    message:`Course is already reviewed by the user`
                }
            )
        }

        // create the rating and review
        const ratingReview = await RatingAndReview.create(
            {
                user:userId,
                rating:rating,
                review:review,
                course:CourseId
            }
        )

        // update the course with the rating and review
        const updatedCourse = await Course.findByIdAndUpdate(
            CourseId,
            {
                $push:{
                    ratingAndReviews:ratingReview._id,
                }
            },{new:true}
        )
        console.log(updatedCourse);

        // return res
        return res.status(200).json(
            {
                success:true,
                message:`Rating and Review created successfully`,
                ratingReview,
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









// *getAverageRating 
exports.getAverageRating = async ( req, res )=>{
    try {
        
        // get data
        const courseId = req.body.courseId;

        // calculate the average rating
        const result = await RatingAndReview.aggregate( // return array
            [
                {
                    $match:{ //get all the doc that follows this match
                        course: new mongoose.Types.ObjectId(courseId)//convert string to object id
                    },
                    $group:{
                        _id:null, //group all
                        averageRating : { $avg:"$rating" }
                    }
                }
            ]
        );

        // return res
        if(result.length() > 0){
            return res.status(200).json(
                {
                    success:true,
                    averageRating: result[0].averageRating,
                }
            )
        } else{ //if no review exist
            return res.status(200).json(
                {
                    success:true,
                    message:`Average Rating is 0, no rating given till now`,
                    averageRating: 0,
                })
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
}









// *getAllRatingAndReviews
exports.getAllRating = async (req ,res)=>{
    try {
        
        const allReviews = RatingAndReview.find({})
        .sort({rating: "desc"})
        .populate(
            {
                path:"user",
                select:"firstName lastName email image" //mean only populate these fields 
            }
        )
        .populate(
            {
                path:"course",
                select:"courseName"
            }
        )
        .exec();

        // return res
        return res.status(200).json(
            {
                success:true,
                message:`All reviews fetched successfully`,
                data:allReviews,
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