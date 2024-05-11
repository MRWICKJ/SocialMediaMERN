const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    email:String,
    name:String,
    username:String,
    password:String,
    age:Number,
    profilepic:{
        type:String,
        default:"default.png"
    },
    posts:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"post",
        }
    ]
})

module.exports =  mongoose.model('user',userSchema)