const jwt = require('jsonwebtoken');
const {User, UserInterest} = require('../models/userSchema');

const auth_user = async(req, res, next)=>{
    try {
        const UserExist = await User.findOne({_id : req.obj._id});
        const UserInterestExist = await UserInterest.findOne({user_id : req.obj._id})

        const response = {
            first_name:UserExist.first_name,
            last_name:UserExist.last_name,
            email : UserExist.email,
            technical_interest:UserInterestExist.technical_interest,
            cultural_interest:UserInterestExist.cultural_interest,
            non_technical_interest:UserInterestExist.non_technical_interest,
            github_url:UserExist.github_url,
            linkedin_url:UserExist.linkedin_url,
            bio:UserExist.bio,
            _id:UserExist._id,
            mobile_number:UserExist.mobile_number,
            year_of_passing:UserExist.year_of_passing,
            isProfileSetup : UserExist.isProfileSetup,
            isVerified : UserExist.isVerified
        }
        // this is final response to be sent
        const obj = {
            status : true,
            message : "Authenticated",
            data : response
        } 
        res.status(201).send(obj);
        next();
        } 
    catch (error) {
        res.status(500).send({status: false, message : "Internal Server Error"});
    }
    
}

module.exports = auth_user;