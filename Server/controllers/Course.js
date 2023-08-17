
const Course = require("../models/Course")
const Category = require("../models/Category")
const User = require("../models/User")
const { uploadImageToCloudinary } = require("../utils/imageUploader")
require("dotenv").config()


// *createCourse handler func
exports.createCourse = async (req , res)=>{
    try {
        
        // fetch data from body
        let {
            courseName,
            courseDescription,
            whatYouWillLearn,
            price,
            category, // category here is id given by frontend
            tag,
            status,
            instructions,
        } = req.body

        // get thumbnail
        const thumbnail = req.files.thumbnailImage ;

        // validation
        if(!courseName || !courseDescription ||!whatYouWillLearn || !price || !category || !thumbnail ||!tag){
        return res.status(400).json(
            {
                success:false,
                message:`All Fields are Mandatory`
            }
        )
        }

        // check for instructor(user)
        // get the instructor(user) from DB, this is require as in Course model/schema we also need to store the instructor referance
        const userId = req.user.id; // as during the authorisation we have done  req.user = decode; and decode have id,accountType,email
        // !
        if (!status || status === undefined) {
			status = "Draft";
		}

        const instructorDetails = await User.findById(userId, {
			accountType: "Instructor",
		});
        console.log(`instructorDetails->${instructorDetails}`);
        // TODO verify that the userId and instructorDetails are same ?

        if(!instructorDetails){
        return res.status(500).json(
            {
                success:false,
                message:`Instructor Details not found`
            }
        )
        }

        // check given Category is valid or not
        // !doubt-> category is id given by frontend
        const categoryDetails = await Category.findById(category);
        if(!categoryDetails){
            return res.status(404).json(
                {
                    success: false,
                    error:'Category details not found'
                });
        }

        // upload image to cloudinary
        const thumbnailImage = await uploadImageToCloudinary( thumbnail , process.env.FOLDER_NAME)

		console.log(thumbnailImage);

        // create an entry for new course
        const newCourse = await Course.create(
            {
                courseName,
                courseDescription,
                instructor:instructorDetails?._id,
                whatYouWillLearn,
                price,
                tag,
                category:categoryDetails._id,
                thumbnail:thumbnailImage?.secure_url,
                instructions,
                status:status,
            }
        )

        // add the new course id to the user schema of instructor
        await User.findByIdAndUpdate({_id:instructorDetails?._id} , {
            $push:{
                courses : newCourse?._id,
            }
        } , {new:true})


        // update the Category Schema with new course id
        // TODO ->done
        await Category.findByIdAndUpdate({_id:categoryDetails?._id}, {
            $push:{
                courses : newCourse?._id,
            }
        },{new:true} );


        // return res
        return res.status(200).json(
            {
                success:true,
                message:`Course created successfully`,
                data:newCourse,
            }
        )

    } catch (error) {
        console.log(error);
        return res.status(500).json(
            {
                success:false,
                message:`Failed to create course`,
                error:error.message
            }
        )
    }
}



// *getAllCourses handler func
exports.showAllCourses = async(req , res)=>{
    try {
        
        const allCourses = await Course.find({},
            {   courseName:true,
                price:true,
                thumbnail:true,
                instructor:true,
                ratingAndReviews:true,
                studentsEnrolled:true
            }).populate("instructor").exec()


            return res.status(200).json(
                {
                    success:true,
                    message:`Data fetched successfully`,
                    data :allCourses
                }
            )

    } catch (error) {
        console.log(error);
        return res.status(500).json(
            {
                success:false,
                message:`Cannot fetch Courses`,
                error:error.message
            }
        )
    }
}








// *getCourseDetails
exports.getCourseDetails = async ( req , res )=>{
    try {
        // get id
        const { courseId } = req.body;

        // validation
        if(!courseId){
            return res.status(401).json(
                {
                    success:false,
                    message:`CourseId is required`,
                }
            )
        }

        //get course details
        const courseDetails = await Course.find(
            {_id:courseId}
        ).populate(
            {
                path:'instructor',
                populate :{//inside User
                    path:"additonalDetails"
                },
            }
        )
        .populate("category")
        .populate("ratingAndReviews")
        .populate(
            {
                path:"courseContent",
                populate:{
                    path:"subSection"
                }
            }
        )
        .exec();

        if(!courseDetails){
            return res.status(401).json(
                {
                    success:false,
                    message:`Could not find the course with${courseId}`,
                }
            )
        }

        // return res
        return res.status(200).json(
            {
                success:true,
                message:`Course details of ${courseId}`,
                data:courseDetails
            }
        )

    } catch (error) {
        console.log(error);
        return res.status(500).json(
            {
                success:false,
                message:error.message
            }
        )
    }
}
