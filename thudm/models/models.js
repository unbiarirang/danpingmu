const mongoose = require('mongoose');

const STATUS = ['READY', 'ONGOING', 'OVER'];
const MSG_TYPE = ['text', 'image'];

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
    bullet_color_num: {
        type: Number,
        default: 1,
        required: true,
        validate: {
            validator: Number.isInteger,
            message: '{VALUE} is not an integer value'
        }
    },
    bullet_colors: { type: [String], default: ["white"], required: true },
    bg_img_url: String,
    list_media_id: String,
    blacklist_user: [String],
    blacklist_word: [String],
    status: { type: String, enum: STATUS , default: 'ONGOING' },
});
exports.Activity = mongoose.model('Activity', activity_schema);

const vote_schema = new mongoose.Schema({
    activity_id: { type: String, required: true },
    title: { type: String, required: true },
    sub_title: String,
    option_num: {
        type: Number,
        min: 1,
        required: true,
        validate: {
            validator: Number.isInteger,
            message: '{VALUE} is not an integer value'
        }
    },
    options: { type: [String], required: true },
    pic_urls: { type: [String], required: true },
    status: { type: String, enum: STATUS , default: 'READY' },
});
exports.Vote = mongoose.model('Vote', vote_schema);

const lottery_schema = new mongoose.Schema({
    activity_id: { type: String, required: true },
    title: { type: String, required: true },
    sub_title: String,
    winner_num: {
        type: Number,
        min: 1,
        required: true,
        validate: { // Validate integer
            validator: Number.isInteger,
            message: '{VALUE} is not an integer value'
        }
    },
    status: { type: String, enum: STATUS , default: 'READY' },
    result: { type: Array },
});
exports.Lottery = mongoose.model('Lottery', lottery_schema);

const message_schema = new mongoose.Schema({
    activity_id: { type: String, required: true },
    id: { type: Number, min: 1, required: true },
    type: { type: String, enum: MSG_TYPE, required: true },
    content: { type: String, required: true },
    nickname: { type: String, required: true },
    head_img_url: { type: String, required: true },
    review_flag: { type: Boolean, required: true, default: false },
});
exports.Message = mongoose.model('Message', message_schema);
