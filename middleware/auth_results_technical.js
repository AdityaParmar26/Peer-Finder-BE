const jwt = require('jsonwebtoken');
const {User, UserInterest} = require('../models/userSchema');

const auth_results_technical = async(req, res, next)=>{
     
    // finding the user of particular id.
    const UserInterestExistence = await UserInterest.findOne({user_id : req.obj._id})

    // Array of technical interest to be matched.
    var technical_interest = UserInterestExistence.technical_interest;

    if(technical_interest.length === 0){
        res.status(400).send({'msg' : "You have no technical interest"});
        next();
    }
    else{
        // response array of user details.
        const response = [];

        // finding all the document of technical interest and assigning the percentage matched.
        const technical_interest_results = await UserInterest.aggregate([
            {
            $match: { "technical_interest.0": { $exists: true } },
            },
            {
            $addFields: {
                matches_technical: {
                $trunc: {
                    $multiply: [
                    {
                        $divide: [
                        {
                            $size: {
                            $setIntersection: [
                                "$technical_interest",
                                technical_interest,
                            ],
                            },
                        },
                        { $size: "$technical_interest" },
                        ],
                    },
                    100,
                    ],
                },
                },
            },
            },
            {
            $match: { matches_technical: { $gt: 0 } },
            },
        ]);

        // set containing all the matched results object id.
        const matched_results = new Set();
        technical_interest_results.forEach(function (elements){
            matched_results.add({
                id: elements.user_id,
                matches_technical: elements.matches_technical
            });
        });

        for(let i of matched_results){
            if(i.id === req.obj._id) continue;

            const UserExist = await User.findOne({_id : i.id});
            const UserInterestExist = await UserInterest.findOne({user_id : i.id});
            const details = {
                first_name:UserExist.first_name,
                last_name:UserExist.last_name,
                technical_interest:UserInterestExist.technical_interest,
                github_url:UserExist.github_url,
                linkedin_url:UserExist.linkedin_url,
                bio:UserExist.bio,
                _id:UserExist._id,
                year_of_passing:UserExist.year_of_passing,
                match_percent: i.matches_technical
            }
            response.push(details);
        }
        
        res.status(201).send(response);
        next();
    }
}

module.exports = auth_results_technical;