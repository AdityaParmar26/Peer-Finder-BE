// Requiring the modules

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({

    email:{
        type : String,
        required : true
    },
    password :{
        type : String,
        required : true
    },
    confirmPassword :{
        type : String,
        required : true
    },
    isProfileSetup :{
        type : Boolean
    },
    tokens:{
        type: String
    }
});

// Hashing the password before saving into the database
userSchema.pre('save', async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password, 10);
        this.confirmPassword = await bcrypt.hash(this.confirmPassword, 10);
    }
    next();
});

//Generating Token function
userSchema.methods.generateAuthToken = async function(){
    try {
        let token = jwt.sign({_id:this._id}, process.env.TOKEN_KEY);
        this.tokens = token;
        await this.save();
        return token;
    } catch (error) {
        console.log(error);
    }
}

const User = mongoose.model("User", userSchema);

module.exports = User;