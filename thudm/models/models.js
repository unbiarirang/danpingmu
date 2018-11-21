const mongoose = require('mongoose');

const user_schema = new mongoose.Schema({
    id: String,
    password: String,
    email: String,
});

exports.User = mongoose.model('User', user_schema);
