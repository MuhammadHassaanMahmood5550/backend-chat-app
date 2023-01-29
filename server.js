const express = require('express');
const app = express();
const userRoutes = require('./routes/UserRoutes');
const User = require('./models/User');
const Message = require('./models/Message');
const rooms = ['general', 'tech', 'finance', 'crypto'];
const cors = require('cors');

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors());


require('./connection');
app.use('/user', userRoutes);


const server = require('http').createServer(app);
const port = 5001;
const io = require('socket.io')(server, {
    cors: {
        // origin: 'https://chat-app-eight-sepia.vercel.app',
        origin: "*",
        methods: ['GET', 'POST']

    }
})

app.get('/rooms', (req, res) => {
    res.json(rooms);
})

//functions fOR db and sockets.io
async function getLastMessagesFromRoom(room){
    //aggregate is function inmongodb = i means to query(get) specific message by date.
    let roomMessages = await Message.aggregate([
        {$match: {to: room}},
        //this will group all the messages by that date
        {$group: {_id: '$date', messageByDate: {$push: '$$ROOT'}}}
    ])
    return roomMessages;
}

//function for sort msg by date

function sortRoomMessagesByDate(messages){
    //from the earlier messages to the latest messages
  return messages.sort(function(a, b){
    let date1 = a._id.split('/');
    let date2 = b._id.split('/');
     
  // from this 02/11/2022
  // to this  20220211
    date1 = date1[2] + date1[0] + date1[1];
    date2 = date2[2] + date2[0] + date2[1];

    return date1 < date2 ? -1 : 1

  })
}

// socket connection

//socket comming from frontend
io.on('connection', (socket) => {

    //if new user
    socket.on('new-user', async () => {
        //io.emit means send all the users that are connected to socket But socket.emit means only send specific user to frontend
        const members = await User.find();
        io.emit('new-user', members);
    })

    //all our socket logic will be here
    socket.on('join-room', async(newRoom, previousRoom) => {
        socket.join(newRoom);
        socket.leave(previousRoom)
        //get the message of that specific room we need database so we create another model.
        let roomMessages = await getLastMessagesFromRoom(newRoom);
        //sort messages
        roomMessages = sortRoomMessagesByDate(roomMessages);
        socket.emit('room-messages', roomMessages);
    })

    //for message
    socket.on('message-room', async(room, content, sender, time, date) => {
        console.log("new message", content);
        const newMessage = await Message.create({content, from: sender, time, date, to: room});
        let roomMessages = await getLastMessagesFromRoom(room);
        roomMessages = sortRoomMessagesByDate(roomMessages);
        //sending message to room
        io.to(room).emit('room-messages', roomMessages);

        //users that are not in the room get notification
        socket.broadcast.emit('notifications', room)
    })

    app.delete('/logout', async(req, res) => {
        try{
            const {_id, newMessage} = req.body;
            const user = await User.findById(_id);
            user.status = "offline";
            user.newMessage = newMessage;
            await user.save();
            const members = await User.find();
            socket.broadcast.emit('new-user', members);
            res.status(200).send();
        }catch (err) {
          console.log("logout catch err", err);
          res.status(400).send();
        }
    })

})

server.listen(port, ()=> {
    console.log("server running on port", port);
})

module.exports = app;

