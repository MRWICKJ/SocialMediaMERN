const express = require('express')
const fs = require('fs')
const app = express()
require('./db/conn')
const userModel = require('./model/user')
const postModel = require('./model/post')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt')
const user = require('./model/user')
const post = require('./model/post')
const path = require('path')
const PORT = process.env.PORT || 3000
app.set('view engine','ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());
app.use(express.static(path.join(__dirname,"public")));
const upload = require('./config/multerconfig')
//~ Middleware
const isLoggedIn = (req,res,next) => {
    if (req.cookies.token === '') {
        return res.redirect("/login")
    }
    else{
        let data = jwt.verify(req.cookies.token,"whoami");
        req.user = data;
    }
    next();
}
//^ Upload page
app.get('/profile/upload', isLoggedIn, (req,res)=>{
    res.render("upload")
})
//* Post Upload Route
app.post('/profile/upload',upload.single("image"), isLoggedIn, async (req,res)=>{
    let dir = path.join(__dirname)
    let user = await userModel.findOne({email:req.user.email});
    if (user.profilepic === "default.png" ) {
        user.profilepic = req.file.filename
    }
    else{
        fs.unlink(`${dir}/public/profile/images/${user.profilepic}`, (err) => {
            if (err) {
              console.error(err);
            } else {
                console.log('Image deleted successfully!');
            }
          });
          user.profilepic = req.file.filename
    }  
    await user.save()
    res.redirect("/profile")
})
//^ Home Route 
app.get('/',(req,res)=>{
    res.render('index')
})
//^ Register Post
app.post('/register', async (req,res)=>{
    // console.log(req.body);
    let {email, username, password, age,name} = req.body
    let user = await userModel.findOne({email})
    if (user) {
        return res.status(500).send("User already Exist")
    }
    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password,salt, async (err,hash)=>{
            let user = await userModel.create({
                email:email,
                name:name,
                username:username,
                age:age,
                password:hash,
            })
            let token = jwt.sign({email:email, userid:user._id},"whoami")
            res.cookie("token",token)
            res.redirect('login')
        })
    })
})
//^ Login Route
app.get('/login',(req,res)=>{
    res.render('login')
})
//~ Login post route
app.post('/login', async (req,res)=>{
    const {email,password} = req.body
    let user = await userModel.findOne({email});
    if(!user){
        return res.status(500).send("Something Went Wrong")
    }
    bcrypt.compare(password,user.password, (err,result)=>{
        if (result) {
            let token = jwt.sign({email:email, userid:user._id},"whoami")
            res.cookie("token",token)
            res.status(200).redirect("/profile")
        }
        else{
            res.status(500).send("Something Went wrong")
        }
    })

})
//* profile route
app.get('/profile',isLoggedIn, async (req,res)=>{
    let {email,userid} = req.user
    
    let user = await userModel.findOne({email}).populate("posts")
    let publicUser = await userModel.findOne({email:"public@gamil.com"}).populate("posts")
    res.render("profile",{publicUser,user})
})
//* Create Post
app.post('/post',isLoggedIn, async (req,res)=>{
    let user = await userModel.findOne({email:req.user.email})
    let publicUser = await userModel.findOne({email:"public@gamil.com"})
    let {content} = req.body
    const post = await postModel.create({
        post:content,
        user:user._id,
        username:user.username
    })
    publicUser.posts.push(post._id)
    await publicUser.save()
    user.posts.push(post._id)
    await user.save()
    res.redirect('/profile')
})
//! Logout Route
app.get('/logout',(req,res)=>{
    res.cookie('token','')
    res.redirect('login')
})
//~ Like Route s post nut get
app.get("/like/:id",isLoggedIn, async (req,res)=>{
    let post = await postModel.findOne({_id:req.params.id}).populate("user")
    if (post.likes.indexOf(req.user.userid) === -1) {
        post.likes.push(req.user.userid)
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid),1)
    }
    await post.save()
    res.redirect("/profile")
})
//& Edit Page
app.get('/edit/:id',isLoggedIn, async (req,res)=>{
    let post = await postModel.findOne({_id:req.params.id}).populate("user")
    let user = await userModel.findOne({email:req.user.email})
    res.render("edit",{user,post})
})
//^ Edit Post
app.post('/edit/:id',isLoggedIn, async (req,res)=>{
    let post = await postModel.findOneAndUpdate({_id:req.params.id},{post: req.body.content})
    res.redirect("/profile")
})
//! Post Delete
app.get('/delete/:id',isLoggedIn, async (req,res)=>{
    let publicUser = await userModel.findOne({email:"public@gamil.com"})
    let user = await userModel.findOne({email:req.user.email})
    publicUser.posts.splice(publicUser.posts.indexOf(req.params.id),1)
    user.posts.splice(user.posts.indexOf(req.params.id),1)
    let post = await postModel.findOneAndDelete({_id:req.params.id})
    await user.save()
    await publicUser.save()
    res.redirect("/profile")
})
//& App Listen
app.listen(PORT,()=>{
    console.log(`Server PORT Running on ${PORT}`);
})