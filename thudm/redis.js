const redis = require('redis');
const bluebird = require('bluebird');
const RSMQPromise = require('rsmq-promise');
bluebird.promisifyAll(redis);

const options = (config) => {
    return {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        password: config.REDIS_SECRET
    };
};

let redisClient = (config) => {
    var redisClient = redis.createClient(options(config));
    redisClient.on('connect', () => { console.log('redis connected'); })
               .on('error', (err) => { console.error(err); });
    return redisClient
};
exports.redisClient = redisClient;

let rsmq = (config) => {
    return new RSMQPromise({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        ns: "rsmq",
        options: options(config)
    });
};
exports.rsmq = rsmq;
