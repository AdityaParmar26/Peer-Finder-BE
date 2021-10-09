// Requiring the modules

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({

    // register schema....
    email:{
        type : String,
        required : true
    },
    password :{
        type : String,
        required : true
    },

    // boolean variable for letting us know whether profile is set up or not...
    isProfileSetup :{
        type : Boolean
    },

    // for storing token while logging in...
    tokens:{
        type: String
    },

    // user profile schema...
    first_name:{
        type: String
    },
    last_name:{
        type: String
    },
    mobile_number:{
        type: String
    },
    bio:{
        type: String
    },
    year_of_passing:{
        type: String
    },
    linkedin_url:{
        type: String
    },
    github_url:{
        type: String
    }
});

// Its a user Schema for only interest of user.
const userSchemaNew = new mongoose.Schema({

    user_id:{
        type: String
    },
    technical_interest:{
        type: [String]
    },
    non_technical_interest:{
      type: [String]
    },
    cultural_interest:{
        type: [String]
    },
});

// Hashing the password before saving into the database
userSchema.pre('save', async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password, 10);
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
const UserInterest = mongoose.model("UserInterest", userSchemaNew);

// exporting the models
module.exports = {User, UserInterest};