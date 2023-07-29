
const SubSection = require("../models/SubSection")
const Section = require("../models/Section")
const {uploadImageToCloudianry} = require("../utils/imageUploader")
require("dotenv").config()


// * createSubSection handler function
exports.createSubSection = async(req, res)=>{
    try {
        
        // data fetch
        const { title , timeDuration , description , sectionId }= req.body;
        
        // extract video 
        const video = req.files.videoFile;

        // validation
        if(!title || !timeDuration ||! description || !sectionId || !video){
            return res.status(400).json(
                {
                    success:false,
                    message:`All fields are required`
                }
            )}

        // upload video to cloudinary
        const uploadDetails = await uploadImageToCloudianry( video , process.env.FOLDER_NAME);
 
        // create subSection
        const subSectionDetails = await SubSection.create(
            {
                title:title,
                timeDuration:timeDuration,
                description:description,
                videoUrl:uploadDetails?.secure_url,
            }
        )
        // store the id of subSection in Section Schema
        const updatedSection = await Section.findByIdAndUpdate( sectionId , {
            $push:{
                "subSections":subSectionDetails._id
            }
        } , {new:true}).populate("subSection").exec()

        //  return res
        return res.status(200).json(
            {
                success:true,
                message:"subSection created successfully",
                data:updatedSection
            }
        )

    } catch (error) {
        console.log(error);
        return res.status(500).json(
            {
                success:false,
                message:`Unable to create subSection`,
                error:error.message
            }
        )
    }
}



// TODO UpdateSubsection handler func
exports.updatedSubSection = async (req , res)=>{
    try {

        const { sectionId , title , description } = req.body;

        const subSection = await SubSection.findById(sectionId);

        if(!subSection){
            return res.status(404).json(
                {
                    success:false,
                    message:'subsection not found',
                }
            )
        };

        if(title !== undefined){
            subSection.title = title
        }

        if(subSection.description !== undefined){
            subSection.description  = description
        }

        if(req.files && req.files.video !== undefined){
            const video = req.files.video;
            const uploadDetails = await uploadImageToCloudianry(
                video,
                process.env.FOLDER_NAME,
            )
            SubSection.videoUrl = uploadDetails.secure_url;
            SubSection.timeDuration = uploadDetails?.duration;
        }

        // DB save
        await subSection.save();

        return res.status(200).json(
            {
                success:true,
                message:`Section updated successfully`,
            }
        )


        
    } catch (error) {
        console.error(error)
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating the section",
      })
    }
}






// TODO deleteSubSection handler func
exports.deleteSubsection = async (req , res)=>{
    try {
        const { subSectionId , sectionId } = req.body;

        // !test
        await Section.findOneAndUpdate(
            {_id:sectionId},
            {
                $pull:{
                    subSection: subSectionId,
                },
            }
        )

        const subSection = await SubSection.findByIdAndDelete( subSectionId );

        if(!subSection){
            return res.status(404).json(
                { 
                    success: false,
                     message: "SubSection not found"
                 })
        }

        return res.status(200).json(
            {
                success:true,
                message:`SubSection deleted successfully`,
            }
        )

    } catch (error) {
        console.error(error)
      return res.status(500).json({
        success: false,
        message: "An error occurred while deleting the SubSection",
      })
    }
}
