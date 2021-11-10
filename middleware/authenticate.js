const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');

const Authenticate = async(req, res, next)=>{
    try {
      
      // verifying the the token passed from header. 
      jwt.verify(req.headers.token, process.env.TOKEN_KEY, (err, decoded) => {
        if (err){
          return res.status(401).send({ auth: false, msg: "Authentication failed." });
        }
        else {
          var obj = { auth: true, message: "Authenticated", _id:decoded._id };
          req.obj = obj;
          next();
        }
      });
    } 
    catch (error) {
      res.status(401).send("No token Provided");
    }
}

module.exports = Authenticate;