const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const passport = require('./src/config/passport');

const indexRouter = require('./src/routes/index');
const usersRouter = require('./src/routes/users');
const contactsRouter = require('./src/routes/contacts');
const testRouter = require('./src/routes/test');

const app = express();

app.use(logger('dev'));
app.use(passport.initialize());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors())

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/contacts', contactsRouter);
app.use('/test', testRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {

    // set error status
    res.status(err.status || 500);

    // set error JSON object
    const errorJson = {};
    errorJson.success = false;
    errorJson.code = res.statusCode;
    errorJson.message = err.message;
    errorJson.data = err.data;
    req.app.get('env') === 'development' && (errorJson.error = err);

    // send the error JSON
    res.json(errorJson);
});

module.exports = app;
