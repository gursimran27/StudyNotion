
const Category = require("../models/Category")



// *create Category ka handler function
exports.createCategory = async(req , res)=>{
    try {
        // fetch date
        const {name , description } = req.body

        // validation
        if(!name || !description){
            return res.status(400).json(
                {
                    success:false,
                    message:`All fields are required`
                }
            )
        }

        // create entry in DB
        const categoryDetails = await Category.create({
            name:name,
            description:description
        });
        console.log(`categoryDetails = ${categoryDetails}`);

        // return res
        return res.status(200).json(
            {
                success:true,
                message:`Category created successfully`
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



// *getAllCategory handler func
exports.showAllCategory = async(req, res)=>{
    try {
        
        const allCategory = await Category.find({}, {name:true , description:true});
        // name:true , description:true means that fetch all category that are having name and description

        return res.status(200).json(
            {
                success:true,
                message:`Category Successfully fetched`,
                allCategory
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








// *categoryPageDetails
exports.categoryPageDetails = async (req ,res)=>{
    try {
        
        // get category id
        const { CategoryId } = req.body;
        
        // get courses for specified category id
        const selectedCategory = await Category.findById(
            {_id:CategoryId})
            .populate("courses")
            .exec();

        // validation
        if(!selectedCategory){
            return res.status(404).json(
                {
                    success:false,
                    message:`Data not Found`
                }
            )
        }

        // get courses for diffrent course
        let diffrentCategories = await Category.find( 
            {_id: {$ne: CategoryId}}//$ne->not equal
        )
        .populate("courses")
        .exec();

        //  TODO : get top 10 selling courses
            

        // return res
        return res.status(200).json(
            {
                success:true,
                data:{
                    selectedCategory,
                    diffrentCategories,
                    //topSellingsCourses
                }
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