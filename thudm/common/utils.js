const crypto = require('crypto');
const fs = require('fs-extra');
require('bluebird').promisifyAll(fs);
const rp = require('request-promise');
const util = require('util');
const multer = require('multer');
const exec = require('child_process').exec;
const request = require('request');
const consts = require('./consts');
const errors = require('./errors');
const models = require('../models/models');
const Activity = models.Activity;
const Vote = models.Vote;
let config;

const init = (cfg) => {
    config = cfg;
};
exports.init = init;

String.prototype.getNums = () => {
    let rx =/[+-]?((\.\d+)|(\d+(\.\d+)?)([eE][+-]?\d+)?)/g,
    map_num = this.match(rx) || [];

    return map_num.map(Number);
};

// In memory Activity model.
class Room {
    constructor(activity_id) {
        this.activity_id = activity_id;
        // The following properties are initialized in init function
        this.activity = {}; // mongodb Activity instance
        this.generated_id = 0;
    }

    init(req) { // Asynchronous db process
        const redis = req.app.get('redis');
        redis.hget("generated_id", this.activity_id, (err, id) => {
            if (err) id = 0;

            console.log('generated_id: ', id);
            this.generated_id = id;
        });

        return Activity.findById(this.activity_id)
            .then(act => {
                if (!act)
                    throw new errors.NotExistError('Activity does not exists.');

                this.activity = act;
            });

    }

    load(req) {
        req.app.get('cache').room_info.set(this.activity_id, this);
        console.log('load_room_info: ', this);
    }

    recover() {
        return Activity.findById(this.activity_id)
            .then(act => {
                if (!act)
                    throw new errors.NotExistError('Activity does not exists.');

                this.activity = act;
            });

    }

    unload(req) {
        req.app.get('cache').room_info.delete(this.activity_id);
        console.log('unload_room_info: ', this);
    }

    destroy(req) {
        const redis = req.app.get('redis');
        this.activity.status = "OVER";
        this.activity.save();

        // Flush redis
        let del_keys = [
            'rsmq:' + this.activity_id,
            'rsmq:' + this.activity_id + ':Q',
        ];
        Vote.find({ activity_id: this.activity_id })
            .then(votes => {
                votes.forEach(vote => {
                    del_keys.push('vote_' + vote._id.toString());
                    del_keys.push('voteuser_' + vote._id.toString());
                });
            })
            .then(() => {
                return redis.delAsync(del_keys);
            })
            .then(() => {
                console.log('flush redis');
            });

        // Remove directory
        const dir_name = 'public/images/activity/' + this.activity_id;
        fs.removeAsync(dir_name)
            .then(() => { console.log('rmdir'); });

        // Delete list image from wechat server
        delete_list_image(req, this.activity.list_media_id);

        // Unload activity
        this.unload(req);
    }

    gen_id(redis) {
        this.generated_id++;
        redis.hset('generated_id', this.activity_id, this.generated_id);
        return this.generated_id;
    }

    is_blocked_user(open_id) {
        let blacklist = this.activity.blacklist_user;
        if (!blacklist || blacklist.length === 0)
            return false;

        if (blacklist.indexOf(open_id) < 0)
            return false;

        return true;
    }

    is_blocked_word(text) {
        let blacklist = this.activity.blacklist_word;
        if (!blacklist || blacklist.length === 0)
            return false;

        let regex = new RegExp(blacklist.join('|'));
        if (!text.match(regex))
            return false;

        return true;
    }
}
exports.Room = Room;

const load_activities = (app) => {
    return Activity.find()
        .then(activities => {
            activities.forEach(activity => {
                // Not load finished activities
                if (activity.status === "OVER")
                    return;

                let act_id = activity._id.toString();
                load_activity({ app: app }, act_id);
            });
        });
}
exports.load_activities = load_activities;

const load_activity = (req, act_id) => {
    let room = new Room(act_id);

    room.init(req)
        .then(() => {
            room.load(req);
        });
}
exports.load_activity = load_activity;

const sign = () => {
    return (req, res, next) => {
        let token = config.WECHAT_TOKEN;

        let q = req.query;
        let signature = q.signature;
        let nonce = q.nonce;
        let timestamp = q.timestamp;
        let echostr = q.echostr;

        let key = [token, timestamp, nonce].sort().join('');
        let sha1 = crypto.createHash('sha1');
        sha1.update(key);

        if (req.method === 'GET') {
            if (sha1.digest('hex') === signature)
                res.send(echostr);
            else
                res.end();
        } else if (req.method === 'POST') {
            if (sha1.digest('hex') !== signature)
                return;
            next();
        }
    }
}
exports.sign = sign;

const get_access_token = (req) => {
    console.log('get_access_token');
    // access_token is valid
    if (req.app.get('access_token_expire') &&
        Date.now() / 1000 < req.app.get('access_token_expire')) {
        console.log('access_token: ', req.app.get('access_token'));
        return Promise.resolve(req.app.get('access_token'));
    }

    console.log('Get new access token');

    // Request a new access_token
    let options = {
        uri: 'https://api.weixin.qq.com/cgi-bin/token',
        qs: { 
            grant_type: 'client_credential',
            appid: config.WECHAT_APPID,
            secret: config.WECHAT_APPSECRET
        },
        json: true
    };

    return rp(options)
        .then(res => {
            // Error from wechat
            if (res.errcode)
                throw new errors.WeChatResError(res.errmsg);

            req.app.set('access_token', res.access_token);
            req.app.set('access_token_expire',
                Date.now() / 1000 + res.expires_in
            );
            console.log('access_token: ', res.access_token);
            return res.access_token;
        })
        .catch(err => {
            //console.error(err);
        });
};
exports.get_access_token = get_access_token;

const _get_user_info = (req) => {
    let open_id = req.query.openid;
    return req.app.get('cache').user_info.get(open_id) || {};
};

const get_user_info = (req) => {
    let user_info = _get_user_info(req);
    console.log('get_user_info');
    // FIXME: temp
    //return Promise.resolve({ nickname: 'tempnickname', head_img_url: 'headimgurl' });
    if (user_info.nickname === undefined || user_info.head_img_url === undefined)
        return request_user_info(req).then(get_user_info);

    return Promise.resolve(user_info);
}
exports.get_user_info = get_user_info;

// Request and store a user's information
const request_user_info = (req) => {
    let open_id = req.query.openid;
    return get_access_token(req)
        .then(access_token => {
            let options = {
                uri: 'https://api.weixin.qq.com/cgi-bin/user/info',
                qs: { 
                    access_token: access_token,
                    openid: open_id
                },
                json: true
            };
            return rp(options);
        })
        .then(res => {
            // Error from wechat
            if (res.errcode)
                throw new errors.WeChatResError(res.errmsg);

            console.log('request_user_info');
            update_user_info(req, {
                nickname: res.nickname,
                head_img_url: res.headimgurl,
                open_id: res.openid
            });
            return req;
        })
        .catch(err => { console.error(err); });
};
exports.request_user_info = request_user_info;

const update_user_info = (req, options) => {
    let user_info = _get_user_info(req);
    let open_id = req.query.openid;

    for (let key in options)
        user_info[key] = options[key];

    req.app.get('cache').user_info.set(open_id, user_info);
    console.log('update_user_info');
}
exports.update_user_info = update_user_info;

const get_room_info = (req, activity_id) => {
    let room = req.app.get('cache').room_info.get(activity_id);

    if (!room)
        throw new errors.NotExistError('The activity is not exist or is over.');

    return room;
};
exports.get_room_info = get_room_info;

const update_room_info = (req, options) => {
    let activity_id = req.session.activity_id;
    let room_info = get_room_info(req, activity_id);

    for (let key in options)
        room_info[key] = options[key];

    req.app.get('cache').room_info.set(activity_id, room_info);
    console.log('update room_info');
}
exports.update_room_info = update_room_info;

const get_wechat_input = (req, key) => {
    if (!req.body.xml[key] || req.body.xml[key].length <= 0)
        throw new errors.NotExistError('The wechat message does not have the property you required');

    return req.body.xml[key][0];
}
exports.get_wechat_input = get_wechat_input;

const request_random_nums = (amount, min, max) => {
    let options = {
        uri: 'https://www.random.org/integers/',
        qs: {
            num: amount,
            min: min,
            max: max,
            col: amount,
            base: 10,
            format: 'plain',
            rmd: 'new'
        },
        json: true
    };

    return rp(options)
        .then(data => {
            console.log('random data: ', data);

            if (typeof(data) === 'string')
                return data.getNums();

            if (typeof(data) === 'number')
                return [data];

            throw new errors.NotExistError('Random data is wrong or not exist.');
        });
}
exports.request_random_nums = request_random_nums;

// request-promise: STREAMING THE RESPONSE (e.g. .pipe(...)) is DISCOURAGED
// Use request module instead
const download_image = (pic_url, msg_id, activity_id) => {
    const file_name = 'public/images/activity/'
                      + activity_id + '/fromuser/'+ msg_id + '.png';

    return new Promise((resolve, reject) => {
        request.head(pic_url, (err, res, body) => {
            request(pic_url).pipe(fs.createWriteStream(file_name))
                .on('close', resolve);
        });
    });
}
exports.download_image = download_image;

const delete_image = (activity_id) => {
    const dir_name = 'public/images/activity/' + activity_id + '/fromuser';
    const file_list = fs.readdirSync(dir_name);
    if (file_list.length <= consts.MAX_FROMUSER_IMAGE_NUM)
        return;

    // Delete the oldest. Don't need to be synchronous
    console.log('delete filename: ', dir_name + file_list[0]);
    fs.unlink(dir_name + file_list[0], err => {
        if (err)
            throw err;

        console.log('Delete complete');
    });
}
exports.delete_image = delete_image;

// Synchronize wechat menu with consts.WECHAT_MENU
const update_menu = (req) => {
    let menu = consts.WECHAT_MENU;
    return get_access_token(req)
        .then(access_token => {
            let options = {
                method: 'POST',
                uri: 'https://api.weixin.qq.com/cgi-bin/menu/create',
                body: menu,
                qs: {
                    access_token: access_token,
                },
                json: true
            };

            return rp(options)
                .then(res => {
                    // Error from wechat
                    if (res.errcode)
                        throw new errors.WeChatResError(res.errmsg);

                    console.log('update_menu complete');
                })
                .catch(err => {
                    console.error(err);
                });
        });
}
exports.update_menu = update_menu;

const upload_list_image = (req, file_path) => {
    return get_access_token(req)
        .then(access_token => {
            let command = 'curl -F media=@'
                        + file_path
                        + ' http://file.api.weixin.qq.com/cgi-bin/material/add_material?access_token='
                        + access_token;

            return new Promise((resolve, reject) => {
                exec(command, (err, res) => {
                    if (err)
                        return reject(err);
                    if (JSON.parse(res).errcode)
                        return reject(new errors.WeChatResError(JSON.parse(res).errmsg));

                    console.log('@@@@@@res:', res);
                    let activity_id = req.session.activity_id;
                    let room = get_room_info(req, activity_id);
                    room.activity.list_media_id = JSON.parse(res).media_id;
                    console.log('@@@@@@room:', room);
                    resolve(room.activity.save());
                });
            })
            .catch(err => {
                return err;
            });
        });
}
exports.upload_list_image = upload_list_image;

const delete_list_image = (req, media_id) => {
    return get_access_token(req)
        .then(access_token => {
            console.log('@@@@@media_id: ', media_id);
            let options = {
                method: 'POST',
                uri: 'https://api.weixin.qq.com/cgi-bin/material/del_material',
                body: { media_id: media_id },
                qs: {
                    access_token: access_token,
                },
                json: true
            };

            return rp(options)
                .then(res => {
                    // Error from wechat
                    if (res && res.errcode)
                        throw new errors.WeChatResError(res.errmsg);

                    console.log('@@@@@@@delete list image completed');
                })
                .catch(err => {
                    console.error(err);
                });
        });
}

// Return ongoing vote events
const get_vote_info = (room) => {
    let activity_id = room.activity_id;
    return Vote.find({ activity_id: activity_id })
        .then(votes => {
            let votes_ongoing = [];
            for (let vote of votes) {
                if (vote.status === 'ONGOING')
                    votes_ongoing.push(vote);
            }

            return votes_ongoing;
        });
}
exports.get_vote_info = get_vote_info;

const get_reply_base = (type, data) => {
    const file_name = '/../public/templates/' + type + '.xml';

    let xml = fs.readFileSync(__dirname + file_name, 'utf-8');
    if (type === 'article') return xml;

    xml = xml.replace('[]', '[' + data.to_user_name + ']');
    xml = xml.replace('[]', '[' + data.from_user_name + ']');
    xml = xml.replace('[]', '[' + data.create_time + ']');

    return xml;
}

const get_reply_text = (data) => {
    let xml = get_reply_base('text', data);
    xml = xml.replace('[]', '[' + data.content + ']');

    return Promise.resolve(xml);
}
exports.get_reply_text = get_reply_text;

const get_reply_image = (data) => {
    let xml = get_reply_base('image', data);
    xml = xml.replace('[]', '[' + data.media_id + ']');

    return Promise.resolve(xml);
}
exports.get_reply_image = get_reply_image;

const get_reply_news = (data) => {
    let xml = get_reply_base('news', data);
    xml = xml.replace('[]', '[' + data.article_count+ ']');

    let xml_artcs = '';
    let xml_artc_base = get_reply_base('article', data);
    data.articles.forEach(article => {
        let xml_artc = xml_artc_base;
        xml_artc = xml_artc.replace('[]', '[' + article.title + ']');
        xml_artc = xml_artc.replace('[]', '[' + article.desc + ']');
        xml_artc = xml_artc.replace('[]', '[' + article.pic_url+ ']');
        xml_artc = xml_artc.replace('[]', '[' + article.url + ']');
        xml_artcs += xml_artc;
    });
    xml = xml.replace('[]', xml_artcs);

    return Promise.resolve(xml);
}
exports.get_reply_news = get_reply_news;

const get_url = (path) => {
    return 'http://' + config.SERVER_DOMAIN + path;
}
exports.get_url = get_url;

const get_url_ip = (path) => {
    return 'http://' + config.SERVER_IP + path;
}
exports.get_url_ip = get_url_ip;

const get_multer = (file_name) => {
    const path = '/../public' + consts.STORE_IMG_PATH;
    return multer({
        storage: multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, __dirname + path);
            },
            limits: { fileSize: consts.MAX_IMG_SIZE, files: 1 },
            filename: function (req, file, cb) {
                file_name = req.session.admin_id + '_' + file_name;
                if (req.query.id)
                    file_name += '_' + req.query.id;

                cb(null, file_name + '.' + file.mimetype.split('/')[1]);
            }
        })
    });
};
exports.get_multer = get_multer;
