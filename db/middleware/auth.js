//middleware for user auth
const router = require("../../routes/auth.js");

const { User } = require("../index.js");



function UserMiddleware(req,res,next){

    const username = req.headers.username;
    const password = req.headers.password
    User.findOne({
        username: username,
        password: password
    })
    .then (function(value){
        if(value){
            next();
        }else{
            res.json({
                msg:"No User found"
            })
        }
    })
} 
module.exports = UserMiddleware;