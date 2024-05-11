const mongoose = require('mongoose')

const postSchema = mongoose.Schema({
    post:String,
    user:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"user",
        }
    ],
    username:String,
    date:{        
            type:Date,
            default:Date.now
        },    
    likes:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"user",
        }
    ]
})

module.exports =  mongoose.model('post',postSchema)