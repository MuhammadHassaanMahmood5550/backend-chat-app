const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Can't be blank"] 
  },
  email: {
    type: String,
    lowercase: true,
    unique: true,
    required: [true, "Can't be blank"],
    index: true,
    validate: [isEmail, "invalid email"] 
  },
  password: {
    type: String,
    required: [true, "Can't be blank"],
  },
  picture: {
    type: String,
  },
  newMessage: {
    type: Object,
    default: {}
  },
  status: {
    type: String,
    default: 'online'
  }
  //bcz of minimize: false we can have default: {} objects other wise won't. 
}, {minimize: false});

//here we can create our own function

//a middleware, run before save();, save() is used in UserRouter.js, this fun will hash user pass
UserSchema.pre('save', function(next){
    const user = this;
     //return next(); go to the next middleware
     //for example if pasword is already hashed or cannot be modify or update, go to next middle ware is our case UserSchema.methods.toJSON.   
    if(!user.isModified('password')) return next();

    bcrypt.genSalt(10, function(err, salt){
        if(err) return next(err);

        //converting pass in hash
        bcrypt.hash(user.password, salt, function(err, hash){
            if(err) return next(err);
            
            user.password = hash;
            //go to the next middleware
            next();
        })
    })
})


//a middleware, execute before sent json to user 
UserSchema.methods.toJSON = function(){
    const user = this;
    const userObject = user.toObject();
    delete userObject.password;
    return userObject;
} 

UserSchema.statics.findByCredentials = async function(email, password){

    //this find user exists or not
    const user  = await User.findOne({email});
    if(!user) throw new Error('invalid email or password');

    //this finds that ok user exists throug email but maybe password would be wrong so is match that finded user password is same as entered from frontend.  
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) throw new Error('invalid email or password');
    return user;
}



const User = mongoose.model('User', UserSchema);

module.exports = User;
