const crypto = require('crypto');
const rp = require('request-promise');
const config = require('../config.json');
const errors = require('./errors');

let sign = () => {
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

let get_access_token = (req) => {
    console.log('get_access_token');
    // access_token is valid
    if (req.app.get('access_token_expire') &&
        Date.now() / 1000 < req.app.get('access_token_expire')) {
        return Promise.resolve(req.app.get('access_token'));
        //return new Promise((resolve, reject) => {
        //    resolve(req.app.get('access_token'));
        //});
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
            console.log('0 get_access_token:', res.access_token);
            req.app.set('access_token', res.access_token);
            req.app.set('access_token_expire',
                Date.now() / 1000 + res.expires_in
            );
            return res.access_token;
        });
};
exports.get_access_token = get_access_token;

// Request and store a user's information
let request_user_info = (req) => {
    let openid = req.body.xml.fromusername[0];
    return get_access_token(req)
        .then((access_token) => {
            let options = {
                uri: 'https://api.weixin.qq.com/cgi-bin/user/info',
                qs: { 
                    access_token: access_token,
                    openid: openid
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
            req.session.nickname = res.nickname;
            req.session.head_img_url = res.headimgurl;
            req.session.open_id = res.openid;
            req.session.save();
            return req;
        });
};
exports.request_user_info = request_user_info;

let get_sess_info = (req) => {
    if (req.session.nickname === undefined || req.session.head_img_url === undefined)
        return request_user_info(req).then(get_sess_info);

    return Promise.resolve({
        room_id: req.session.room_id,
        nickname: req.session.nickname,
        head_img_url: req.session.head_img_url
    });
}
exports.get_sess_info = get_sess_info;

let get_input = (req, key) => {
    return req.body.xml[key][0];
}
exports.get_input = get_input;
