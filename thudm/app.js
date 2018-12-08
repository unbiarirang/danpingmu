var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var cron = require('cron');
var config = require('./config');
var mongodb = require('./mongodb');
var indexRouter = require('./routes/index');
var utils = require('./common/utils');
var consts = require('./common/consts');

var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Redis store
var session = require('express-session');
var redisStore = require('connect-redis')(session);
var redisClient = require('./redis').redisClient(config);
var rsmq = require('./redis').rsmq(config);

// Admin session
app.use(session({
    store: new redisStore({client: redisClient}),
    saveUninitialized: false,
    resave: false,
    secret: config.SESSION_SECRET,
    cookie: { maxAge: consts.SESSION_EXPIRE_MSEC }
}));

// Connect to Mongodb
mongodb.init(config);
utils.init(config);

/* global variables */
// Redis client
app.set('redis', redisClient);
// Redis message queue
app.set('rsmq', rsmq);
// Wechat cache. All activities share a user info cache
app.set('cache', {
    user_info: new Map(),   // Key: open_id Value: user info
    room_info: new Map()    // Key: room_id Valie: Room()
});

// Load all ongoing activities.
utils.load_activities(app);

// Flush cache every day at 6 a.m
new cron.CronJob('0 0 6 * * *', function() {
    console.log('CRON> Flush cache');

    app.get('cache').user_info.clear();
    app.get('cache').room_info.forEach((room, room_id, map) => {
        // A activity was finished
        if (room.activity.end_time < Date.now()) {
            room.destroy(redisClient);
            map.delete(room_id);
        }
    });
}, null, true, 'Asia/Shanghai');

// Init index router
require('./routes/index').init(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
