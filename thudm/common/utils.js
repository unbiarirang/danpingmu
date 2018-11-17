const crypto = require('crypto');
const rp = require('request-promise');
const config = require('../config.json');
const errors = require('./errors');

String.prototype.getNums = () => {
    let rx =/[+-]?((\.\d+)|(\d+(\.\d+)?)([eE][+-]?\d+)?)/g,
    mapN = this.match(rx) || [];

    return mapN.map(Number);
};

class Room {
    constructor(room_id, generated_id=0) {
        this.room_id = room_id;
        this.generated_id = generated_id;
    }

    gen_id(redis) {
        let id = this.generated_id;
        redis.hset('generated_id', this.room_id, id);
        this.generated_id++;
        return id;
    }
}
exports.Room = Room;

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
        .then((res) => {
            req.app.set('access_token', res.access_token);
            req.app.set('access_token_expire',
                Date.now() / 1000 + res.expires_in
            );
            return res.access_token;
        });
};
exports.get_access_token = get_access_token;

const get_session = (req) => {
    let open_id = req.query.openid;
    return req.app.get('cache').get(open_id) || {};
};

// Request and store a user's information
const request_user_info = (req) => {
    //let openid = req.body.xml.fromusername[0];
    let open_id = req.query.openid;
    return get_access_token(req)
        .then((access_token) => {
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
        .then((res) => {
            // Error from wechat
            if (res.errcode)
                throw new errors.WeChatResError(res.errmsg);

            console.log('User info: ', res);
            update_user_info(req, {
                nickname: res.nickname,
                head_img_url: res.headimgurl,
                open_id: res.openid
            });
            return req;
        });
};
exports.request_user_info = request_user_info;

const get_user_info = (req) => {
    let session = get_session(req);
    console.log('wechat session: ', session);
    if (session.nickname === undefined || session.head_img_url === undefined)
        return request_user_info(req).then(get_user_info);

    return Promise.resolve(session);
}
exports.get_user_info = get_user_info;

const update_user_info = (req, options) => {
    let session = get_session(req);
    let open_id = req.query.openid;

    for (let key in options)
        session[key] = options[key];
    req.app.set('cache').set(open_id, session);
}
exports.update_user_info = update_user_info;

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

            throw new errors.TypeError();
        });
}
exports.request_random_nums = request_random_nums;
