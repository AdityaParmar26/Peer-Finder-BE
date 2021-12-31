// Requiring the modules
 
const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const validator = require("validator");
const nodemailer = require('nodemailer');
const authenticate = require('../middleware/authenticate');
const auth_results_cultural = require('../middleware/auth_results_cultural');
const auth_results_technical = require('../middleware/auth_results_technical');
const auth_results_non_technical = require('../middleware/auth_results_non_technical');

require('../database/connection');
const {User, UserInterest, UserFeedback, UserOTP, UserFavourite, UserMessage, UserRating} = require("../models/userSchema");
const { json } = require("body-parser");
const { response } = require("express");

// function for capitalizing first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// for checking the objects to be equal
function isEqual(object1, object2) {
    return object1.from === object2.from && object1.fav_id === object2.fav_id;
}

router.get('/', async(req,res)=>{
    res.send("Health OK!");
})

router.post('/register', async(req, res)=>{

    const {email, password, confirmPassword} = req.body;

    if(!email || !password || !confirmPassword){
        return res.status(422).json({status: false, message : "Please fill all the fields"});
    }

    var check_email = validator.isEmail(email.trim());
    if(!check_email) return res.status(422).json({status: false, message : "Invalid Email Address"});

    try {
        
        const UserExist = await User.findOne({email : email.trim()});

        if(UserExist){
            return res.status(422).json({status: false, message : "Email is already registered"});
        }
        else if(password != confirmPassword){
            return res.status(422).json({status: false, message : "Password are not matching"});
        }
        else if(password.length <= 6){
            return res.status(422).json({status: false, message : "Password too small(Minimum 7 characters long.)"});
        }
        else{
            const user = new User({email: email.trim(), password : password, confirmPassword : confirmPassword});
            user.isProfileSetup = false;
            user.isVerified = false;
            // as soon as User is registered
            // interest schema should have entry of that user.
            const userinterest = new UserInterest({user_id:user._id});
            await userinterest.save();

            // Before saving the user password hashing of password is performed

            await user.save();
            res.status(201).json({status: true, message : "Successfully Registered"});
        }
    } 
    catch (error) {
        return res.status(500).json({status: false, message : "Internal Server Error"});
    }
    
});

router.post('/login', async(req, res)=>{

    const {email, password} = req.body;

    if(!email || !password){
        return res.status(422).json({status: false, message : "Please fill all the fields"});
    }
    
    try {
        const UserExist = await User.findOne({email : email.trim()});

        if(UserExist){
            const matchPassword = await bcrypt.compare(password, UserExist.password);
            
            // Generating Token when the login is successful
            const token = await UserExist.generateAuthToken();

            if(matchPassword){
                
                // if user is not verified yet, send otp to him....
                if(UserExist.isVerified === false){
                    
                    // generating random 6 digit number.....
                    var otp = Math.floor(100000 + Math.random() * 900000);
                    const find_user = await UserOTP.findOne({user_id : UserExist._id});
                    if(find_user){
                        find_user.otp = otp;
                        try{
                            await find_user.save();
                            console.log("OTP saved to User OTP collection"); 
                        }
                        catch (error){
                            console.log(error);
                            return res.status(500).json({status: false, message : "Internal Server Error"});
                        }
                    }
                    else{
                        try {
                            const userOtp = new UserOTP({user_id : UserExist._id, otp : otp});
                            await userOtp.save();
                            console.log("OTP saved to User OTP collection");
                        } 
                        catch (error) {
                            return res.status(500).json({status: false, message : "Internal Server Error"});
                        }
                    }
                    
                    // send an otp email to corresponding user...
                    var transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                        user: process.env.EMAIL,
                        pass: process.env.PASSWORD
                        }
                    });

                    var mailOptions = {
                        from: 'fake.one337711@gmail.com',
                        to: UserExist.email,
                        subject: 'Peer Finder OTP Verification',
                        text: `Your OTP for verification is ${otp}`
                    };

                    try {
                        transporter.sendMail(mailOptions, function(error, info) {
                            if (error) {
                                console.log(error);
                                return res.status(500).json({status: false, message : "Problem in sending OTP"});
                            } 
                            else {
                                console.log('Email sent: ' + info.response);
                            }
                        });
                    } 
                    catch (error) {
                        return res.status(500).json({status: false, message : "Problem in sending OTP"});
                    }
                    
                }

                return res.status(201).json({status: true, id: UserExist._id, isProfileSetup: UserExist.isProfileSetup, token: token, isVerified: UserExist.isVerified});
            }
            else{
                return res.status(422).json({status: false, message : "Invalid Credentials"});
            }
        }
        else{
            return res.status(422).json({status: false, message : "Invalid Credentials"});
        }
    } 
    catch (error) {
        return res.status(500).json({status: false, message : "Internal Server Error"});
    }
});

router.get('/profile', [authenticate], async(req, res)=>{

    try {
        const UserExist = await User.findOne({_id : req.obj._id});

        if(UserExist){
            return res.status(201).send({ 
                status: true, 
                message: "Authenticated",
                _id: req.obj._id, 
                isProfileSetup: UserExist.isProfileSetup, 
                isVerified : UserExist.isVerified 
            });
        }
        else{
            return res.status(500).send({ status: false, message: "Internal Server Error"});
        }
    } 
    catch (error) {
        return res.status(500).send({ status: false, message: "Internal Server Error"});
    }
});

router.post('/profile', async(req, res)=>{
    const {_id, first_name, last_name, mobile_number, bio, technical_interest, non_technical_interest, cultural_interest, year_of_passing, linkedin_url, github_url} = req.body;
    
    if(!first_name || !last_name || !mobile_number || !bio || !year_of_passing){
        return res.status(422).json({status: false, message : "Please fill all the neccesary fields"});
    }
    // validations on data

    if(mobile_number.trim().length != 10){
        return res.status(422).json({status: false, message : "Mobile number not valid"});
    }

    if(year_of_passing.trim().length != 4){
        return res.status(422).json({status: false, message : "Please provide valid year"});
    }

    if(linkedin_url){
        if(linkedin_url.includes("https://www.linkedin.com/") === false){
            return res.status(422).json({status: false, message : "Not Valid LinkedIn URL"});
        }
    }

    if(github_url){
        if(github_url.includes("https://github.com/") === false){
            return res.status(422).json({status: false, message : "Not Valid GitHub URL"});
        }
    }

    // try to post the data now, all validations are done.....
    try{
        // take the user details from both the schemas.
        const UserExist = await User.findOne({_id : _id});
        const UserExistInterest = await UserInterest.findOne({user_id : _id});

        if(UserExist){
            if(UserExist.isProfileSetup === false){
                UserExist.first_name = capitalizeFirstLetter(first_name).trim();
                UserExist.last_name = capitalizeFirstLetter(last_name).trim();
                UserExist.mobile_number = mobile_number.trim();
                UserExist.bio = bio.trim();
                UserExist.isProfileSetup = true;

                // saving the user deatils in another(interest) schema.
                UserExistInterest.technical_interest = technical_interest.sort();
                UserExistInterest.non_technical_interest = non_technical_interest.sort();
                UserExistInterest.cultural_interest = cultural_interest.sort();

                UserExist.year_of_passing = year_of_passing.trim();
                UserExist.linkedin_url = linkedin_url.trim();
                UserExist.github_url = github_url.trim();
                await UserExist.save();
                await UserExistInterest.save();
                return res.status(201).json({status: true, message : "Details saved successfully"});
            }
            else{
                return res.status(422).json({status: false, message : "Profile is Already Set"});
            }
        }
        else{
            return res.status(500).json({status: false, message : "Internal Server Error"});
        }
    }
    catch{
        return res.status(500).json({status: false, message : "Internal Server Error"});
    }
});

router.put('/profile', async(req, res)=>{

    const {_id, first_name, last_name, mobile_number, bio, technical_interest, non_technical_interest, cultural_interest, year_of_passing, linkedin_url, github_url} = req.body;
    
    if(!first_name || !last_name || !mobile_number || !bio || !year_of_passing){
        return res.status(422).json({status: false, message : "Please fill all the neccesary fields"});
    }
    // validations on data

    if(mobile_number.trim().length != 10){
        return res.status(422).json({status: false, message : "Mobile number not valid"});
    }

    if(year_of_passing.trim().length != 4){
        return res.status(422).json({status: false, message : "Please provide valid year"});
    }

    if(linkedin_url){
        if(linkedin_url.includes("https://www.linkedin.com/") === false){
            return res.status(422).json({status: false, message : "Not Valid LinkedIn URL"});
        }
    }

    if(github_url){
        if(github_url.includes("https://github.com/") === false){
            return res.status(422).json({status: false, message : "Not Valid GitHub URL"});
        }
    }

    // try to update data when all validations are done..
    try {
        var UserUpdateBody = {
            first_name : capitalizeFirstLetter(first_name).trim(),
            last_name : capitalizeFirstLetter(last_name).trim(),
            mobile_number : mobile_number.trim(),
            bio : bio.trim(),
            year_of_passing : year_of_passing.trim(),
            linkedin_url : linkedin_url.trim(),
            github_url : github_url.trim()
        }

        var InterestUpdateBody = {
            technical_interest : technical_interest.sort(),
            non_technical_interest : non_technical_interest.sort(),
            cultural_interest : cultural_interest.sort()
        }

        const UserUpdate = await User.findByIdAndUpdate(_id, UserUpdateBody);
        const UserInterestUpdate = await UserInterest.findOneAndUpdate({user_id : _id}, InterestUpdateBody);

        if(UserUpdate && UserInterestUpdate){
            return res.status(201).json({status: true, message : "Profile Updated"});
        }
        else{
            return res.status(400).json({status: false, message : "Problem in Updating the data"});
        }
    } 
    catch (error) {
        return res.status(500).json({status: false, message : "Internal Server Error"});
    }

})

// user detail route...
router.get('/user', [authenticate], async(req, res)=>{
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
        return res.status(201).send(obj);
    } 
    catch (error) {
        return res.status(500).send({status: false, message : "Internal Server Error"});
    }
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

// storing the user feedbacks.
router.post('/contact', async(req, res)=>{
    const {name, email, message} = req.body;

    if(!email || !name || !message){
        return res.status(422).json({status: false, message : "Please fill all the fields"});
    }

    var check_email = validator.isEmail(email.trim());
    if(!check_email) return res.status(422).json({status: false, message : "Invalid Email Address"});

    if(message.trim().length < 3) return res.status(422).json({status: false, message : "Please provide the appropriate message"});

    try {
        const feedBack = new UserFeedback({name : name.trim(), email : email.trim(), message: message.trim()});
        await feedBack.save();
        res.status(201).json({status: true, message : "Thanks for the Feedback!"});
    } 
    catch (error) {
        return res.status(500).json({status: false, message : "Internal Server Error"});
    }
})

// otp verification
router.post('/otp', async(req, res)=>{
    const {_id, otp} = req.body;

    if(!otp){
        return res.status(422).json({status: false, message : "Please fill all the neccesary fields"});
    }

    try{
        const userOtp = await UserOTP.findOne({user_id : _id});
        const user = await User.findById({_id : _id});

        if(userOtp){
            if(userOtp.otp === parseInt(req.body.otp)){
                
                user.isVerified = true;
                try{
                    const deleteUserOtp = await UserOTP.findByIdAndDelete({_id : userOtp._id});
                    user.save();
                }
                catch(error){
                    console.log(error);
                    return res.status(500).json({status: false, message : "Something went wrong"});
                }

                return res.status(201).json({status: true, message : "Verified"});
            }
            else return res.status(400).json({status: false, message : "Enter Valid OTP"});
        }
        else{
            return res.status(500).json({status: false, message : "Something went wrong"});
        }
    }
    catch(error){
        return res.status(500).json({status: false, message : "Internal Server Error"});
    }
})

// search users by name
router.get('/users', [authenticate], async(req,res)=>{

    const username = req.query.name.trim();

    if(!username){
        return res.status(422).send({ status: false, message: "Please provide name" });
    }

    const splittedName = username.split(" ");
    var UserExist;

    // searching user by query in database
    if(splittedName.length == 2){

        let first_name = capitalizeFirstLetter(splittedName[0]);
        let last_name = capitalizeFirstLetter(splittedName[1]);

        try {
            UserExist = await User.find({first_name : first_name, last_name : last_name});
        } 
        catch (error) {
            console.log(error);
            return res.status(500).send({ status: false, message: "Internal Server Error" });
        }
    }
    else if(splittedName.length == 1){
        let first_name = capitalizeFirstLetter(splittedName[0]);
        try {
            UserExist = await User.find({first_name : first_name});
        } 
        catch (error) {
            console.log(error);
            return res.status(500).send({ status: false, message: "Internal Server Error" });
        }
    }
    else{
        return res.status(400).send({ status: false, message: "Something went wrong" });
    }

    // Querying with the user details...
    if(UserExist && UserExist.length >= 1){
        var response = [];
        for(let user in UserExist){
            const details = {
                first_name:UserExist[user].first_name,
                last_name:UserExist[user].last_name,
                email : UserExist[user].email,
                bio:UserExist[user].bio,
                _id:UserExist[user]._id,
                year_of_passing:UserExist[user].year_of_passing
            }
            response.push(details);
        }

        // this is final response to be sent
        const obj = {
            status : true,
            message : "Authenticated",
            data : response
        } 
        res.status(201).send(obj);
    }
    else{
        return res.status(201).send({ status: false, message: "No User Found" });
    }
});

// get the users favourite lists
router.get('/favourite', [authenticate], async(req, res)=>{
    try {

        var user = await User.findById({_id : req.obj._id}, {_id : 0, isProfileSetup : 1, isVerified : 1});

        if(user.isProfileSetup === false){
            return res.status(401).send({ status: false, message: "Set up your profile" });
        }
        else if(user.isVerified === false){
            return res.status(401).send({ status: false, message: "Please verify your identity" });
        }

        var UserFavouriteExist = await UserFavourite.findOne({user_id : req.obj._id}, {favourites : {fav_id : 1, from :1}, _id : 0});
        if(UserFavouriteExist && UserFavouriteExist.favourites.length > 0){
            var details = [];

            for(let i of UserFavouriteExist.favourites){
                var UserData = await User.findById({_id : i.fav_id}, 
                    { 
                        email:0, 
                        password:0, 
                        mobile_number : 0, 
                        isProfileSetup :0,
                        isVerified : 0,
                        tokens : 0,
                        __v :0
                    }
                );
                
                var UserInterestData = await UserInterest.findOne({user_id : i.fav_id}, {_id : 0, [i.from] : 1})
                UserData.set(i.from, UserInterestData[i.from], {strict: false});
                UserData.set('from', i.from, {strict: false});

                var isRated = false;
                const UserRatingExist = await UserRating.findOne({to : i.fav_id, from : req.obj._id});  
                if(UserRatingExist && UserRatingExist[i.from] > 0) isRated = true;

                UserData.set('is_rated', isRated, {strict: false});

                details.push(UserData);
            }

            var obj = {
                status : true,
                message : "Successfully fetched data",
                data : details
            }
            
            return res.status(201).send(obj);
        }
        else{
            return res.status(201).send({ status: false, message: "No Favourites found" });
        }
    } 
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// post the user to favourite group
router.post('/favourite', [authenticate], async(req, res)=>{
    var {id, from} = req.body;
 
    try {
        let favBody = {
            from : from,
            fav_id : id
        }

        var UserFavouriteExist = await UserFavourite.findOne({user_id : req.obj._id}, {favourites : {fav_id : 1, from :1}});

        if(UserFavouriteExist){
            if(UserFavouriteExist.favourites.length === 10){
                return res.status(400).send({ status: false, message: "Cannot add more than 10 users" });
            }
            else{

                for(let userfav of UserFavouriteExist.favourites){
                    if(isEqual(userfav, favBody)){
                        return res.status(200).send({ status: false, message: "User already added" });
                    }
                }
                
                UserFavouriteExist.favourites.push(favBody);
                await UserFavouriteExist.save();
                return res.status(201).send({ status: true, message: "User added to favourites" });
                
            }
        }
        else {
            var userFavourite = new UserFavourite({user_id : req.obj._id, favourites : [favBody]});
            await userFavourite.save();
            return res.status(201).send({ status: true, message: "User added to favourites" });
        }
    } 
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// remove user from favourite group
router.delete('/favourite', [authenticate], async(req,res)=>{

    const {id, from} = req.body;
    try {
        await UserFavourite.findOneAndUpdate(
            {user_id : req.obj._id},
            {$pull : {favourites : {$and : [{fav_id : id}, {from : from}]}}},
            { safe: true, multi: false }
        )
        return res.status(201).json({ status: true, message: "User removed from favourites" });
    } 
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// get the messages
router.get('/message', [authenticate], async(req, res)=>{
    try {

        var user = await User.findById({_id : req.obj._id}, {_id : 0, isProfileSetup : 1, isVerified : 1});

        if(user.isProfileSetup === false){
            return res.status(401).send({ status: false, message: "Set up your profile" });
        }
        else if(user.isVerified === false){
            return res.status(401).send({ status: false, message: "Please verify your identity" });
        }

        var UserMessageExist = await UserMessage.findOne({user_id : req.obj._id});

        if(UserMessageExist && UserMessageExist.messages.length > 0){
            var details = [];

            for(let i of UserMessageExist.messages){
                var UserData = await User.findById({_id : i.from}, 
                    { 
                        first_name :1,
                        last_name : 1,
                        mobile_number :1,
                        email : 1,
                    }
                );
                
                UserData.set('message_id', i._id, {strict: false});
                
                var sent_time = new Date(i.sent_on);
                var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                var year = sent_time.getFullYear();
                var month = months[sent_time.getMonth()];
                var date = sent_time.getDate();
                var sent_on_time= sent_time.getHours() + ":" + sent_time.getMinutes() + " on " + date + " " + month + " " + year;

                UserData.set('sent_on', sent_on_time, {strict: false});
                UserData.set('message', i.message, {strict: false});
                details.push(UserData);
            }

            var obj = {
                status : true,
                message : "Successfully fetched data",
                data : details
            }
            
            return res.status(201).send(obj);
        }
        else{
            return res.status(201).send({ status: true, message: "No Messages Found", data : [] });
        }
    } 
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// post the message
router.post('/message', [authenticate], async(req, res)=>{

    var {to, message} = req.body;

    if(!message.trim()){
        return res.status(422).send({status : false, message : "Please provide the message"})
    }
 
    try {
        let favBody = {
            // from is person sending the message i.e. is the person logged in.
            from : req.obj._id,
            message : message.trim()
        }

        // posting the message to the corresponding user_id.
        var UserMessageExist = await UserMessage.findOne({user_id : to}, {messages : {message : 1, from :1}});

        if(UserMessageExist){
            UserMessageExist.messages.push(favBody);
            await UserMessageExist.save();
            return res.status(201).send({ status: true, message: "Message sent." });
        }
        else {
            var userMessage = new UserMessage({user_id : to, messages : [favBody]});
            await userMessage.save();
            return res.status(201).send({ status: true, message: "Message sent." });
        }
    } 
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// delete the message
router.delete('/message', [authenticate], async(req, res)=>{

    const {message_id} = req.body;

    try {
        await UserMessage.findOneAndUpdate(
            {user_id : req.obj._id},
            {$pull : {messages : {_id : message_id}}},
            { safe: true, multi: false }
        )
        return res.status(201).json({ status: true, message: "Message deleted" });
    } 
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// rate the user
router.post('/rate', [authenticate], async(req, res)=>{

    const {to, rate, interest} = req.body;
    try {
        var UserRatingExist = await UserRating.findOne({to : to, from : req.obj._id});

        if(UserRatingExist){
            if(UserRatingExist[interest] > 0){
                return res.status(400).send({status : false, message : "You can't rate more than once"})
            }
            else{
                UserRatingExist[interest] = rate;
                await UserRatingExist.save();
                return res.status(201).send({status : true, message : "Rated Successfully"})
            }
        }
        else{
            var userRating = await new UserRating({to : to, from : req.obj._id });
            userRating[interest] = rate;

            await userRating.save();
            return res.status(201).send({status : true, message : "Rated Successfully"})
        }
    } 
    catch (error) {
        console.log(error);
        return res.status(500).send({status : false, message : "Internal Server Error"});
    }
    

});

module.exports = router;