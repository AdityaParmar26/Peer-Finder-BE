const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');

const auth_profile = async(req, res, next)=>{
    res.status(201).send(req.obj);
    next();
}

module.exports = auth_profile;