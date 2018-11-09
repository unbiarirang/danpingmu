var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var config = require('./config.json');
var mongodb = require('./mongodb');
var indexRouter = require('./routes/index');

// Redis session
var redis = require('redis');
var session = require('express-session');
var redisStore = require('connect-redis')(session);
var redisClient = redis.createClient({
    port: config.REDIS_PORT,
    host: config.REDIS_HOST,
    password: config.REDIS_SECRET
});
redisClient.on('connect', () => { console.log('redis connected'); })
           .on('error', (err) => { console.log(err); });

var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var redisOptions = {
    client: redisClient,
};
app.use(session({
    store: new redisStore(redisOptions),
    saveUninitialized: true, // FIXME: false
    resave: false,
    secret: config.SESSION_SECRET,
    cookie: { maxAge: 24*60*60*1000 } // Expires in 1 day
}));

// Init index router
require('./routes/index').init(app);

// Connect to Mongodb
mongodb.init(config);

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
