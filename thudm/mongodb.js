const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

exports.init = () => {
    mongoose.connect('mongodb://localhost:27017/danpingmu',{
        useNewUrlParser: true,
        connectTimeoutMS: 10000,
        reconnectInterval: 500
    }).then(() => {
        console.log('Mongodb connected!');
    }).catch(err => {
        console.error(err);
    });

    //function connect() {
    //    mongoose.connect('mongodb://localhost:27017/danpingmu', {useNewUrlParser: true});
    //}

    //connect();

    var db = mongoose.connection;
    //db.on('open', () => { console.log('mongodb connected!'); });
    //db.on('disconnected', connect);
    db.on('error', err => console.error(err));
}
