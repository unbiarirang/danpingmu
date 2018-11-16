var socket_io = require('socket.io');
var io = socket_io();
var socketApi = {};

socketApi.io = io;

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinRoom', (data) => {
        let room_id = data.room_id;
        socket.room_id = data.room_id;
        socket.join(room_id);
        socket.broadcast.to(socket.room_id).emit('event','User joined a room');
    });

    socket.on('passReview', (data) => {
        socket.broadcast.to(socket.room_id).emit('danmu', data);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

socketApi.reviewMessage = (room_id, msg) => {
    console.log('socketAPI reviewMessage msg: ', msg);
    io.sockets.in(room_id).emit('review', {msg: msg});
}

socketApi.displayMessage = (room_id, msg) => {
    console.log('msg: ', msg);
    io.sockets.in(room_id).emit('danmu', {msg: msg});
}

module.exports = socketApi;
