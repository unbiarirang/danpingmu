const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

exports.init = (config) => {
    mongoose.connect('mongodb://'+config.DB_HOST+':'
        +config.DB_PORT+'/'+config.DB_NAME, {
        useNewUrlParser: true,
        connectTimeoutMS: 10000,
        reconnectInterval: 500
    })
    .then(() => {
        console.log('Mongodb connected!');
    })
    .catch(err => {
        console.error(err);
    });

    var db = mongoose.connection;
    db.on('error', err => console.error(err));
}
