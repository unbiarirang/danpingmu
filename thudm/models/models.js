const mongoose = require('mongoose');

const user_schema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
});
exports.User = mongoose.model('User', user_schema);

const activity_schema = new mongoose.Schema({
    user_id: { type: String, required: true },
    title: { type: String, required: true },
    sub_title: String,
    bullet_color_num: Number,
    bullet_colors: mongoose.Mixed,
    banned_words_url: String,
    background_img_url: String,
});
exports.Activity = mongoose.model('Activity', activity_schema);

const vote_schema = new mongoose.Schema({
    activity_id: { type: String, required: true },
    title: { type: String, required: true },
    sub_title: String,
    option_num: Number,
    options: mongoose.Mixed,
    start_time: Date,
    end_time: Date,
});
exports.Vote = mongoose.model('Vote', vote_schema);

const lottery_schema = new mongoose.Schema({
    activity_id: { type: String, required: true },
    title: { type: String, required: true },
    sub_title: String,
    winner_num: Number,
});
exports.Lottery= mongoose.model('Lottery', lottery_schema);
