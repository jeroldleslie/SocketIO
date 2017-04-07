'use strict'
var express = require("express")
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var nspChat = io.of('/chat');
var nspDefault = io.nsps['/'];

var messageList = [];
var userList = [];

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

io.on('connection', function(socket) {
    console.log('User Connected');
    socket.emit('connected', "Welcom")
    var addedUser = false;
    socket.on('add user', function(data) {
        if (addedUser) return;
        addedUser = true;
        socket.username = data.username;
        userList.push({ username: data.username });
        socket.emit('login', { userList: userList })
        socket.broadcast.emit('user joined', {
            username: data.username
        })
    })

    socket.on('new message', function(data, cb) {
        cb(true);
        console.log(data)
        messageList.push(data);
        socket.broadcast.emit('new message', data);
    })

    socket.on('getUsers', function() {
        socket.emit('getUsers', userList);
    })
    socket.on('user count', function() {
        socket.emit('user count', userList.length);
    })
    socket.on('getMessages', function() {
        socket.emit('getMessages', messageList);
    })


    socket.on('disconnect', function() {
        console.log('User Disconnected');
        if (addedUser) {
            for (var i = 0; i < userList.length; i++) {
                if (socket.username === userList[i].username) {
                    userList.splice(i, 1);
                }
            }
            socket.broadcast.emit('user left', {
                username: socket.username
            })
        }
    });
});

nspDefault.on('connect', (socket) => {
    console.log('Joined Namespace: /');

    socket.on('disconnect', () => {
        console.log('Left Namespace: /');
    });
})

nspChat.on('connect', (socket) => {
    console.log('Joined Namespace: /chat');

    socket.on('disconnect', () => {
        console.log('Left Namespace: /chat');
    });
});

io.set('origins', '*:*');
server.listen(3001)