
const Section = require("../models/Section");
const Course = require("../models/Course");


// *create section handler func
exports.createSection = async (req , res)=>{
    try {

        // data fetch
        const { name , courseId }= req.body

        // validation
        if(!name || !courseId){
        return res.status(400).json(
            {
                success:false,
                message:`All fields are required`
            }
        )}

        // create section
            const newSection = await Section.create({
                sectoinName :  name,
            })
            console.log(`new section->${newSection}`);

        // update the Course schema with obj_id of section
        const updatedCourseDetails = await Course.findByIdAndUpdate( {_id:courseId},
            {
                $push:{
                    courseContent:newSection?._id
                }
            }, {new:true}).populate({
                path:'courseContent',
                populate:{
                    path:'subSections'
                },
            }).exec()
            // TODO use populate to replace section and subSection in the updatedCourseDetails?

        // return res
        return res.status(200).json(
            {
                success:true,
                message:"section created successfully",
                updatedCourseDetails
            }
        )

        
    } catch (error) {
        console.log(error);
        return res.status(500).json(
            {
                success:false,
                message:`Unable to create section`,
                error:error.message
            }
        )
    }
}



// *updateSection handler function
exports.updateSection = async (req,res)=>{
    try {
        
        // data fetch
        const { sectionName, sectionId } = req.body

        // validation
        if(!sectionId || !sectionName){
            return res.status(400).json(
                {
                    success:false,
                    message:`All fields are required`
                }
            )}
    
        // update krdo
                const updatedSection = await Section.findByIdAndUpdate( sectionId , {
                    sectoinName:sectionName
                } , {new:true})

        // return res
        return res.status(200).json(
            {
                success:true,
                message:"section updated successfully",
                updatedCourseDetails
            }
        )

    } catch (error) {
        console.log(error);
        return res.status(500).json(
            {
                success:false,
                message:`Unable to create section`,
                error:error.message
            }
        )
    }
}




// *deleteSection handler func
exports.deleteSection = async(req , res)=>{
    try {
        
        // get ID -> assuming that we are sending id in params
        const { sectionId } = req.params

        // validation
        if( !sectionId ){
            return res.status(400).json(
                {
                    success:false,
                    message:`All fields are required`
                }
            )}

    
        // update krdo
           await Section.findByIdAndDelete( sectionId )
                
        // TODO : do we need to delete the entry(id) from the course schema or not

        // return res
        return res.status(200).json(
            {
                success:true,
                message:"section deleted successfully",
            }
        )
    } catch (error) {
        console.log(error);
        return res.status(500).json(
            {
                success:false,
                message:`Unable to create section`,
                error:error.message
            }
        )
    }
}
