var socket_io = require('socket.io');
var io = socket_io();
var socketApi = {};

socketApi.io = io;

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinActivity', (data) => {
        let activity_id = data.activity_id;
        socket.activity_id = data.activity_id;
        socket.join(activity_id);
        socket.broadcast.to(socket.activity_id).emit('event', 'User joined an activity');
    });

    socket.on('passReview', (data) => {
        socket.broadcast.to(socket.activity_id).emit('danmu', data);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

socketApi.reviewMessage = (activity_id, msg) => {
    console.log('socketAPI reviewMessage msg: ', msg);
    io.sockets.in(activity_id).emit('review', {msg: msg});
}

socketApi.displayMessage = (activity_id, msg) => {
    console.log('msg: ', msg);
    io.sockets.in(activity_id).emit('danmu', {msg: msg});
}

module.exports = socketApi;
