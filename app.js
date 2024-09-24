const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const authRouter = require('./routes/auth');
const driveRouter = require('./routes/drive');
const bookmarkRouter = require('./routes/bookmark');
const fileRouter = require('./routes/file');
const folderRouter = require('./routes/folder');

require('dotenv').config()

const app = express();

app.use(cors({ 
  cors: {
    origin: [
      process.env.CLIENT_URL,
      process.env.ADDITIONAL_CORS_URL,
    ]
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('tiny'));
app.use(cookieParser());

app.use('/auth/', authRouter);
app.use('/drive/', driveRouter);
app.use('/bookmark', bookmarkRouter);
app.use('/file/', fileRouter);
app.use('/folder/', folderRouter);

module.exports = app;
