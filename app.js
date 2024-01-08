var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors')

//var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
var fileRouter = require('./routes/file');
var folderRouter = require('./routes/folder');

var app = express();

app.use(cors({
  origin: [,
    'http://localhost:3000',
  ]
}))

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/', fileRouter);
app.use('/', folderRouter);

module.exports = app;
