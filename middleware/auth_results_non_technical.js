const jwt = require('jsonwebtoken');
const {User, UserInterest, UserFavourite} = require('../models/userSchema');

const auth_results_non_technical = async(req, res, next)=>{
     
    try {
        
        // verifying the user data...
        var UserData = await User.findById({_id : req.obj._id});
        if(UserData.isProfileSetup === false){
            res.status(400).send({status: false, message: "Set up your profile"});
            next();
        }
        else if(UserData.isVerified === false){
            res.status(400).send({status: false, message: "Please verify your identity"});
            next();
        }

        // finding the user of particular id.
        const UserInterestExistence = await UserInterest.findOne({user_id : req.obj._id})

        // Array of non technical interest to be matched.
        var non_technical_interest = UserInterestExistence.non_technical_interest;
        if(non_technical_interest.length === 0){
            res.status(201).send({status : false, message : "You have no non-technical interest"});
            next();
        }
        else{
            // reponse array of user details.
            const response = [];

            // finding all the document of technical interest and assigning the percentage matched.
            const non_technical_interest_results = await UserInterest.aggregate([
                {
                $match: { "non_technical_interest.0": { $exists: true } },
                },
                {
                $addFields: {
                    matches_non_tech: {
                    $trunc: {
                        $multiply: [
                        {
                            $divide: [
                            {
                                $size: {
                                $setIntersection: [
                                    "$non_technical_interest",
                                    non_technical_interest,
                                ],
                                },
                            },
                            { $size: "$non_technical_interest" },
                            ],
                        },
                        100,
                        ],
                    },
                    },
                },
                },
                {
                $match: { matches_non_tech: { $gt: 0 } },
                },
            ]);

            // set containing all the matched results object id.
            const matched_results = new Set();
            non_technical_interest_results.forEach(function (elements){
                matched_results.add({
                    id: elements.user_id,
                    matches_non_tech: elements.matches_non_tech
                });
            });

            // making call to get all favourites of the user...
            const UserFavouriteExist = await UserFavourite.findOne({user_id : req.obj._id},{favourites : {fav_id : 1, from :1}, _id : 0});

            var favArr = [];
            if(UserFavouriteExist){
                for(let i of UserFavouriteExist.favourites){
                    if(i.from === "non_technical_interest") favArr.push(i);
                }
            }

            for(let i of matched_results){
                if(i.id === req.obj._id) continue;

                const UserExist = await User.findOne({_id : i.id});
                const UserInterestExist = await UserInterest.findOne({user_id : i.id});

                var favourite = false;
                for(let j of favArr){
                    if(j.fav_id === i.id) favourite = true;
                }

                const details = {
                    first_name:UserExist.first_name,
                    last_name:UserExist.last_name,
                    non_technical_interest:UserInterestExist.non_technical_interest,
                    github_url:UserExist.github_url,
                    linkedin_url:UserExist.linkedin_url,
                    bio:UserExist.bio,
                    _id:UserExist._id,
                    year_of_passing:UserExist.year_of_passing,
                    match_percent: i.matches_non_tech,
                    is_favourite : favourite
                }
                response.push(details);
            }
            // this is final response to be sent
            const obj = {
                status : true,
                data : response
            } 
            res.status(201).send(obj);
            next();
        }
    } 
    catch (error) {
        console.log(error);
        res.status(500).send({status: false, message: "Internal Server Error"});
        next();
    }
    
}

module.exports = auth_results_non_technical;