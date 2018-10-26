var crypto = require('crypto');

var sign = function(config) {
    return (req, res, next) => {
        config = config || {};
        var token = config.WECHAT_TOKEN;

        var q = req.query;
        var signature = q.signature;
        var nonce = q.nonce;
        var timestamp = q.timestamp;
        var echostr = q.echostr;

        var key = [token, timestamp, nonce].sort().join('');
        var sha1 = crypto.createHash('sha1');
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
