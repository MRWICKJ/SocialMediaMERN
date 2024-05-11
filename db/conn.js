const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost:27017/project4',{

}).then((val)=>{
    console.log(`Database Connected ✅`);
}).catch((err)=>{
    console.error(`Database Connected Failed ❌`,err);
})