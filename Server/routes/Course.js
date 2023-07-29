// import the required modules
const express = require("express");
const router = express.Router()

// import the controllers

// Course controller import
const {
    createCourse,
    showAllCourses,
    getCourseDetails
} = require("../controllers/Course")



// Categories Controller import
const {
    createCategory,
    showAllCategory,
    categoryPageDetails
} = require("../controllers/Category")


// Section Controller import
const {
    createSection,
    updateSection,
    deleteSection
} = require("../controllers/Section")


// Sub-Section Controller import
const {
    createSubSection,
    updatedSubSection,
    deleteSubsection
} = require("../controllers/Subsection")


// Rating Controller import
const {
    createRating,
    getAverageRating,
    getAllRating
} = require("../controllers/RatingAndReview")


// Import Middlerwares
const {
    auth,
    isStudent,
    isInstructor,
    isAdmin
} = require("../middleware/auth");
const Section = require("../models/Section");

// *******************************************************************************************************
//                                      Course routes
// ********************************************************************************************************

// Course can only be created by Instructor
router.post("/createCourse" , auth , isInstructor , createCourse)
// Add a section to a Course
router.post("/addSection" , auth , isInstructor , createSection)
// Update a Section
router.post("/updateSection" , auth , isInstructor , updateSection)
// Delete a Section
router.post("/deleteSection" , auth , isInstructor , deleteSection)
// Edit Sub Section
router.post("/updateSubSection", auth , isInstructor , updatedSubSection)
// Delete Sub Section
router.post("/deleteSubSection" , auth , isInstructor , deleteSubsection)
// Add a Sub Section to a Section
router.post('/addSubSection', auth ,isInstructor , createSubSection )
// Get all Register Courses
router.get("/getAllCourses" , showAllCourses)
// Get Details for a Specific Courses
router.post("/getCourseDetails" , getCourseDetails)

// ********************************************************************************************************
//                                      Category routes (Only by Admin)
// ********************************************************************************************************
// Category can Only be Created by Admin
// TODO: Put IsAdmin Middleware here
router.post("/createCategory", auth, isAdmin, createCategory)
router.get("/showAllCategories", showAllCategory)
router.post("/getCategoryPageDetails", categoryPageDetails)

// ********************************************************************************************************
//                                      Rating and Review
// ********************************************************************************************************
router.post("/createRating", auth, isStudent, createRating)
router.get("/getAverageRating", getAverageRating)
router.get("/getReviews", getAllRating)

module.exports = router