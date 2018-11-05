var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const fileUpload = require('express-fileupload');
const cors = require('cors');

require('./lib/connectMongoose');
require('./models/Exercise');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(fileUpload({ safeFileNames: true, preserveExtension: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/',            require('./routes/index'));
app.use('/users',       require('./routes/users'));
app.use('/api/getList', require('./routes/api'));
app.use('/upload',      require('./routes/upload'));
app.use('/exercise',    require('./routes/exercise'));
app.use('/api',         require('./routes/api'));

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
    if(isAPI(req)) {
        res.json({ success: false, error: err.message });
        return;
    }
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.render('error');
});

function isAPI( req ) {
    return req.originalUrl.indexOf('/api') === 0;
}

module.exports = app;