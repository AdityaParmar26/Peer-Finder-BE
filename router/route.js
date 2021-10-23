// Requiring the modules
 
const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const validator = require("validator");
const authenticate = require('../middleware/authenticate');
const auth_profile = require('../middleware/auth_profile');
const auth_user = require('../middleware/auth_user');
const auth_results_cultural = require('../middleware/auth_results_cultural');
const auth_results_technical = require('../middleware/auth_results_technical');
const auth_results_non_technical = require('../middleware/auth_results_non_technical');

require('../database/connection');
const {User, UserInterest} = require("../models/userSchema");
const { json } = require("body-parser");

router.get('/', async(req,res)=>{
    res.send("Health OK!");
})

router.post('/register', async(req, res)=>{

    const {email, password, confirmPassword} = req.body;

    if(!email || !password || !confirmPassword){
        return res.status(422).json({error : "Please fill all the neccesary fields"});
    }

    var check_email = validator.isEmail(email);
    if(!check_email) return res.status(422).json({error : "Invalid Email Address"});

    try {
        
        const UserExist = await User.findOne({email : email});

        if(UserExist){
            return res.status(422).json({error : "Email is already registered"});
        }
        else if(password != confirmPassword){
            return res.status(422).json({error : "Password are not matching"});
        }
        else{
            const user = new User({email, password, confirmPassword});
            user.isProfileSetup = false;

            // as soon as User is registered
            // interest schema should have entry of that user.
            const userinterest = new UserInterest({user_id:user._id});
            await userinterest.save();

            // Before saving the user password hashing of password is performed

            await user.save();
            res.status(201).json({message : "Successfully Registered"});
        }
    } 
    catch (error) {
        console.log(error);
    }
    
});

router.post('/login', async(req, res)=>{

    const {email, password} = req.body;

    if(!email || !password){
        return res.status(422).json({error : "Please fill all the neccesary fields"});
    }
    
    try {
        const UserExist = await User.findOne({email : email});

        if(UserExist){
            const matchPassword = await bcrypt.compare(password, UserExist.password);
            
            // Generating Token when the login is successful
            const token = await UserExist.generateAuthToken();

            if(matchPassword){
                
                res.status(201).json(UserExist);
            }
            else{
                res.status(400).json({error : "Invalid Credentials"});
            }
        }
        else{
            res.status(400).json({error : "Invalid Credentials"});
        }
    } 
    catch (error) {
        console.log(error);
    }
});

router.get('/profile', [authenticate, auth_profile], async(req, res)=>{
    res.send(req._id);
});

router.post('/profile', async(req, res)=>{
    const {_id, first_name, last_name, mobile_number, bio, technical_interest, non_technical_interest, cultural_interest, year_of_passing, linkedin_url, github_url} = req.body;
    
    if(!first_name || !last_name || !mobile_number || !bio || !year_of_passing){
        return res.status(422).json({error : "Please fill all the neccesary fields"});
    }

    try{
        // take the user details from both the schemas.
        const UserExist = await User.findOne({_id : _id});
        const UserExistInterest = await UserInterest.findOne({user_id : _id});

        if(UserExist){
            if(UserExist.isProfileSetup === false){
                UserExist.first_name = first_name;
                UserExist.last_name = last_name;
                UserExist.mobile_number = mobile_number;
                UserExist.bio = bio;
                UserExist.isProfileSetup = true;

                // saving the user deatils in another(interest) schema.
                UserExistInterest.technical_interest = technical_interest.sort();
                UserExistInterest.non_technical_interest = non_technical_interest.sort();
                UserExistInterest.cultural_interest = cultural_interest.sort();

                UserExist.year_of_passing = year_of_passing;
                UserExist.linkedin_url = linkedin_url;
                UserExist.github_url = github_url;
                await UserExist.save();
                await UserExistInterest.save();
                return res.status(201).json({msg : "Profile Set Up Complete"});
            }
            else{
                return res.status(422).json({error : "Profile Set Up Already Complete"});
            }
        }
    }
    catch{
        console.log(error);
    }
});

// user detail route...
router.get('/user', [authenticate, auth_user], async(req, res)=>{
});

// search cultural interest
router.get('/search/cultural', [authenticate, auth_results_cultural], async(req, res)=>{
});

// search technical interest
router.get('/search/technical', [authenticate, auth_results_technical], async(req, res)=>{
});

// search non technical interest
router.get('/search/non-technical', [authenticate, auth_results_non_technical], async(req, res)=>{
});

module.exports = router;