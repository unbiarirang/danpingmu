var socket_io = require('socket.io');
const models = require('../models/models');
const errors = require('./errors');
const Message = models.Message;
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
        if (!data) return;

        Message.findOne({ activity_id: data.activity_id, id: data.id })
            .then(msg => {
                if (!msg)
                    throw new errors.NotExistError('Message not exist');

                socket.broadcast.to(socket.activity_id).emit('danmu', { data: data });

                msg.review_flag = true;
                msg.save();
            })
            .catch(err => {
                console.error(err);
            });
    });

    socket.on('drawWinner', (data) => {
        socket.activity_id = data.activity_id;
        socket.broadcast.to(socket.activity_id).emit('lottery', data );
    });

    socket.on('quitLottery', (data) => {
        socket.activity_id = data.activity_id;
        socket.broadcast.to(socket.activity_id).emit('quitLottery', data );
    });

    socket.on('displayVote', (data) => {
        socket.activity_id = data.activity_id;
        socket.broadcast.to(socket.activity_id).emit('vote', data );
    });

    socket.on('quitVote', (data) => {
        socket.activity_id = data.activity_id;
        socket.broadcast.to(socket.activity_id).emit('quitVote', data );
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

socketApi.displayMessage = (activity_id, data) => {
    console.log('msg: ', data);
    io.sockets.in(activity_id).emit('danmu', { 'data': data });
};

module.exports = socketApi;
