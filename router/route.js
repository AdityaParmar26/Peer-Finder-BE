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
            console.log(token);
            // After Successful generation of token store value of token in cookie
            res.cookie("jwtoken", token, {
                expires : new Date(Date.now() + 25892000000),
                httpOnly : false
            });

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



// router.get('/about', authenticate ,(req, res)=>{
//     res.send(req.user);
// });

router.get('/getData', authenticate ,(req, res)=>{
    res.send(req.user);
});


module.exports = router;