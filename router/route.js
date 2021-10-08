// Requiring the modules
 
const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const validator = require("validator");
const authenticate = require('../middleware/authenticate');

require('../database/connection');
const User = require("../models/userSchema");
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

router.get('/profile', authenticate, async(req, res)=>{
    res.send(req._id);
    // res.send(req.user);
});

router.post('/profile', async(req, res)=>{
    const {_id, first_name, last_name, mobile_number, bio, technical_interest, non_technical_interest, cultural_interest, year_of_passing, linkedin_url, github_url} = req.body;
    
    if(!first_name || !last_name || !mobile_number || !bio || !year_of_passing){
        return res.status(422).json({error : "Please fill all the neccesary fields"});
    }

    try{
        const UserExist = await User.findOne({_id : _id});
        // console.log(UserExist);
        if(UserExist){
            if(UserExist.isProfileSetup === false){
                UserExist.first_name = first_name;
                UserExist.last_name = last_name;
                UserExist.mobile_number = mobile_number;
                UserExist.bio = bio;
                UserExist.isProfileSetup = true;
                UserExist.technical_interest = technical_interest;
                UserExist.non_technical_interest = non_technical_interest;
                UserExist.cultural_interest = cultural_interest;
                UserExist.year_of_passing = year_of_passing;
                UserExist.linkedin_url = linkedin_url;
                UserExist.github_url = github_url;
                await UserExist.save();
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


// router.get('/about', authenticate ,(req, res)=>{
//     res.send(req.user);
// });

router.get('/getData', authenticate ,(req, res)=>{
    res.send(req.user);
});


module.exports = router;