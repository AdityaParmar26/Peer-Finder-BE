const jwt = require('jsonwebtoken');
const {User, UserInterest} = require('../models/userSchema');

const auth_user = async(req, res, next)=>{
     
    const UserExist = await User.findOne({_id : req.obj._id});
    const UserInterestExist = await UserInterest.findOne({user_id : req.obj._id})

    const response = {
        first_name:UserExist.first_name,
        last_name:UserExist.last_name,
        technical_interest:UserInterestExist.technical_interest,
        cultural_interest:UserInterestExist.cultural_interest,
        non_technical_interest:UserInterestExist.non_technical_interest,
        github_url:UserExist.github_url,
        linkedin_url:UserExist.linkedin_url,
        bio:UserExist.bio,
        _id:UserExist._id,
        mobile_number:UserExist.mobile_number,
        year_of_passing:UserExist.year_of_passing,
    }
    
    res.status(201).send(response);
    next();
}

module.exports = auth_user;