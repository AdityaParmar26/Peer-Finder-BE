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

    // boolean variable for checking otp is verified or not......
    isVerified:{
        type: Boolean,
        default: false
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
        type: String,
        index: { 
            unique: true
        }
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

// schema for feedbacks
const feedbackSchema = new mongoose.Schema({
    name:{
        type: String
    },
    email:{
        type: String
    },
    message:{
        type: String
    }
});

// schema for stroring the user OTP
const userOtpSchema = new mongoose.Schema({
    user_id :{
        type : String
    },
    otp :{
        type : Number
    },
    created_on:{
        type : Date,
        default: Date.now()
    }
})

// schema for user favourite people
const userFavouriteSchema = new mongoose.Schema({
    user_id :{
        type : String
    },
    favourites :[
        {
            fav_id : {
                type : String
            },
            from : {
                type : String,
                default : "technical_interest"
            },
            _id: false,
        }
    ]
})

const userMessageSchema = new mongoose.Schema({
    user_id : {
        type : String
    },
    messages :[
        {
            from:{
                type : String
            },
            message: {
                type: String
            },
            sent_on:{
                type : Date,
                default: Date.now()
            }
        }
    ]
})

const userRatingSchema = new mongoose.Schema({
    to:{
        type : String
    },
    from :{
        type : String
    },
    technical_interest :{
        type: Number,
        default : 0
    },
    non_technical_interest :{
        type: Number,
        default : 0
    },
    cultural_interest :{
        type: Number,
        default : 0
    },
})

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

//defining the index
userFavouriteSchema.index(
    {
        user_id : 1
    },
    {
        unique : true
    }
);

//defining the index
userOtpSchema.index(
    {
        user_id : 1
    },
    {
        unique : true
    }
);

//defining the index
userMessageSchema.index(
    {
        user_id : 1
    },
    {
        unique : true
    }
);

//defining the index
userRatingSchema.index(
    {
        to : 1,
        from : 1
    },
    {
        unique : true
    }
);

const User = mongoose.model("User", userSchema);
const UserInterest = mongoose.model("UserInterest", userSchemaNew);
const UserFeedback = mongoose.model("UserFeedbacks", feedbackSchema);
const UserOTP = mongoose.model("UserOtp", userOtpSchema);
const UserFavourite = mongoose.model("UserFavourites", userFavouriteSchema);
const UserMessage = mongoose.model("UserMessage", userMessageSchema);
const UserRating = mongoose.model("UserRating", userRatingSchema)

// exporting the models
module.exports = {User, UserInterest, UserFeedback, UserOTP, UserFavourite, UserMessage, UserRating};