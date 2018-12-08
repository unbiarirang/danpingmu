const mongoose = require('mongoose');

const user_schema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    salt: { type: String, required: true },
});
exports.User = mongoose.model('User', user_schema);

const activity_schema = new mongoose.Schema({
    admin_id: { type: String, required: true },
    title: { type: String, required: true },
    sub_title: String,
    bullet_color_num: Number,
    bullet_colors: [String],
    banned_words_url: String,
    bg_img_url: String,
    end_time: { type: Number, required: true }, // second
    list_media_id: String,
    blacklist_user: [String],
    blacklist_word: [String],
});
exports.Activity = mongoose.model('Activity', activity_schema);

const VOTE_STATUS = ['READY', 'ONGOING', 'OVER'];
const vote_schema = new mongoose.Schema({
    activity_id: { type: String, required: true },
    title: { type: String, required: true },
    sub_title: String,
    option_num:{ type: Number, required: true },
    options: { type: [String], required: true },
    pic_urls: [String],
    status: { type: String, enum: VOTE_STATUS , default: 'READY' },
});
exports.Vote = mongoose.model('Vote', vote_schema);

const lottery_schema = new mongoose.Schema({
    activity_id: { type: String, required: true },
    title: { type: String, required: true },
    sub_title: String,
    winner_num: { type: Number, min: 1, required: true },
});
exports.Lottery = mongoose.model('Lottery', lottery_schema);

const message_schema = new mongoose.Schema({
    activity_id: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    type: { type: String ,required: true },
    content: { type: String, required: true },
    nickname: { type: String, required: true },
    head_img_url: { type: String, required: true },
    review_flag: { type: Boolean, required: true, default: false },
});
exports.Message = mongoose.model('Message', message_schema);
