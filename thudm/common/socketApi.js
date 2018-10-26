var socket_io = require('socket.io');
var io = socket_io();
var socketApi = {};

socketApi.io = io;

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

socketApi.sendNotification = (msg) => {
    io.sockets.emit('danmu', {msg: msg});
}

module.exports = socketApi;
