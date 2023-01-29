const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(`mongodb://mern-chat-user3:${process.env.DB_PW}@ac-ivbael8-shard-00-00.vfjvxqf.mongodb.net:27017,ac-ivbael8-shard-00-01.vfjvxqf.mongodb.net:27017,ac-ivbael8-shard-00-02.vfjvxqf.mongodb.net:27017/kkk0?ssl=true&replicaSet=atlas-eggx5d-shard-0&authSource=admin&retryWrites=true&w=majority`, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true
}, (err)=>{
    if(err){console.log("connect err is =", err);}
    else{console.log("connected to mongodb");}
});