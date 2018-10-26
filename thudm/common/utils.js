var crypto = require('crypto');

var sign = function(config) {
    return (req, res, next) => {
        config = config || {};
        var token = config.WECHAT_TOKEN;

        console.log(req.params, req.query);
        var p = req.params;
        var signature = p.signature;
        var nonce = p.nonce;
        var timestamp = p.timestamp;
        var echostr = p.echostr;

        var key = [token, timestamp, nonce].sort().join('');
        var sha1 = crypto.createHash('sha1');
        sha1.update(key);
        console.log(sha1.digest('hex'), signature);

        if (req.method === 'GET') {
            if (sha1.digest('hex') === signature)
                res.send(echostr);
            else
                res.send('err');
        } else if (req.method === 'POST') {
            if (sha1.digest('hex') !== signature)
                return;
            next();
        }
    }
}
exports.sign = sign;
