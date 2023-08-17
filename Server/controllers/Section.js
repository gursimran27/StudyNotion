
const Section = require("../models/Section");
const subSection = require("../models/SubSection");
const Course = require("../models/Course");
const SubSection = require("../models/SubSection");


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
                    path:'subSection'
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
                updatedSection
            }
        )

    } catch (error) {
        console.log(error);
        return res.status(500).json(
            {
                success:false,
                message:`Unable to delete section`,
                error:error.message
            }
        )
    }
}




// *deleteSection handler func
exports.deleteSection = async(req , res)=>{
    try {
        
        // TODO  get ID -> test with req.params
        const { sectionId , courseId } = req.body

        // validation
        if( !sectionId , !courseId ){
            return res.status(400).json(
                {
                    success:false,
                    message:`All fields are required`
                }
            )}

        // get section
        const section = await Section.findById(sectionId);

        // update the course
        await Course.findByIdAndUpdate(
            {_id:courseId},
            {$pull:{courseContent:sectionId}},
            {new:true}
        )

        // remove all the associated sub-sections
        // await SubSection.deleteMany({_id: {$in: section.subSection}});
        // or
        for(subS of section?.subSection){
            await SubSection.findByIdAndDelete(subS)
        }
    
        // now delete section
           await Section.findByIdAndDelete( sectionId )
                

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
                message:`Unable to delete section`,
                error:error.message
            }
        )
    }
}
