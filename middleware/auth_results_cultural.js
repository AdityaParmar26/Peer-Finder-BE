const jwt = require('jsonwebtoken');
const {User, UserInterest} = require('../models/userSchema');

const auth_results_cultural = async(req, res, next)=>{
     
    // finding the user of particular id.
    const UserInterestExistence = await UserInterest.findOne({user_id : req.obj._id})

    // Array of cultural interest to be matched.
    var cultural_interest = UserInterestExistence.cultural_interest;

    if(cultural_interest.length === 0){
        res.status(201).send({msg : "You have no cultural interest", auth: true});
        next();
    }
    else{
        // reponse array of user details.
        const response = [];

        // finding all the document of cultural interest and assigning the percentage matched.
        const cultural_interest_results = await UserInterest.aggregate([
            {
            $match: { "cultural_interest.0": { $exists: true } },
            },
            {
            $addFields: {
                matches_cultural: {
                $trunc: {
                    $multiply: [
                    {
                        $divide: [
                        {
                            $size: {
                            $setIntersection: [
                                "$cultural_interest",
                                cultural_interest,
                            ],
                            },
                        },
                        { $size: "$cultural_interest" },
                        ],
                    },
                    100,
                    ],
                },
                },
            },
            },
            {
            $match: { matches_cultural: { $gt: 0 } },
            },
        ]);

        // set containing all the matched results object id.
        const matched_results = new Set();
        cultural_interest_results.forEach(function (elements){
            matched_results.add({
                id: elements.user_id,
                matches_cultural: elements.matches_cultural
            });
        });
        
        for(let i of matched_results){
            if(i.id === req.obj._id) continue;

            const UserExist = await User.findOne({_id : i.id});
            const UserInterestExist = await UserInterest.findOne({user_id : i.id});
            
            const details = {
                first_name:UserExist.first_name,
                last_name:UserExist.last_name,
                cultural_interest:UserInterestExist.cultural_interest,
                github_url:UserExist.github_url,
                linkedin_url:UserExist.linkedin_url,
                bio:UserExist.bio,
                _id:UserExist._id,
                year_of_passing:UserExist.year_of_passing,
                match_percent: i.matches_cultural
            }
            response.push(details);
        }
        // this is final response to be sent
        const obj = {
            auth : true,
            msg : "Authenticated",
            data : response
        } 
        res.status(201).send(obj);
        next();
    }
    
}

module.exports = auth_results_cultural;