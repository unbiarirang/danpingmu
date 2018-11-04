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
    console.log("===IN!");
    // access_token is valid
    if (req.app.get('access_token_expire') &&
        Date.now() / 1000 < req.app.get('access_token_expire')) {
        return new Promise((resolve, reject) => {
            resolve(req.app.get('access_token'));
        });
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

let get_user_info = (req, openid) => {
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

            return res;
        });
};
exports.get_user_info = get_user_info;
