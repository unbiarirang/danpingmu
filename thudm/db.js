const mongoose = require('mongoose');

exports.init = () => {
    mongoose.connect('mongodb://localhost:27017/danpingmu',
        {useNewUrlParser: true})
        .then(() => { console.log('WOWOW'); })
        .catch((err) => { console.error(err); })

    //function connect() {
    //    mongoose.connect('mongodb://localhost:27017/danpingmu', {useNewUrlParser: true});
    //}

    //connect();

    var db = mongoose.connection;
    db.on('open', () => { console.log('mongodb connected!'); });
    //db.on('disconnected', connect);
    db.on('error', console.error);
}
