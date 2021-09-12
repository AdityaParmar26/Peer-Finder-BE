const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');

const Authenticate = async(req, res, next)=>{
    try {
        
        // const t = localStorage.getItem('token');
        // console.log("Token value in local storage" + t);
        // console.log("Auth" + token);
        // const verifyToken = jwt.verify(req.body.token, process.env.TOKEN_KEY);
        jwt.verify(req.headers.token, process.env.TOKEN_KEY, (err, decoded) => {
            if (err)
              return res.status(500).send({ auth: false, message: "Token authentication failed." });
            else {
              res.status(201).send({ auth: true, message: "Token hai", _id:decoded._id });
              next();
            }});

        // const user = await User.findOne({_id:verifyToken._id, "tokens.token":token});  
        
        // if(!user){
        //     console.log("User Not Found");
        // }

        // req.token = token;
        // req.user = user;
        // req.userId = user._id;
        // next(); 

    } 
    catch (error) {
        res.status(401).send("No token Provided");
    }
}

module.exports = Authenticate;