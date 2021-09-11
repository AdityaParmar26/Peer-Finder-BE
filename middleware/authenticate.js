const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');

const Authenticate = async(req, res, next)=>{
    res.setHeader('Access-Control-Allow-Credentials', true);
    try {
        const token = req.cookies.jwtoken;
        const verifyToken = jwt.verify(token, process.env.TOKEN_KEY);

        const user = await User.findOne({_id:verifyToken._id, "tokens.token":token});  
        
        if(!user){
            console.log("User Not Found");
        }

        req.token = token;
        req.user = user;
        req.userId = user._id;
        next(); 

    } 
    catch (error) {
        res.status(401).send("No token Provided");
    }
}

module.exports = Authenticate;