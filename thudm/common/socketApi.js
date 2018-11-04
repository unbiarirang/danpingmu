var socket_io = require('socket.io');
var io = socket_io();
var socketApi = {};

socketApi.io = io;

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinRoom', (data) => {
        var room_id = data.room_id;
        socket.join(room_id);
        io.sockets.in(room_id).emit('event','User joined a room');
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

socketApi.sendNotification = (room_id, msg) => {
    console.log('msg: ', msg);
    io.sockets.in(room_id).emit('danmu', {msg: msg});
}

module.exports = socketApi;
