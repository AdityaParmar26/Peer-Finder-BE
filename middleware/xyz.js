const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');

const auth = async(req, res, next)=>{
     
    // console.log(req.obj);
    req.obj.message = "Change";
    res.status(201).send(req.obj);
}

module.exports = auth;