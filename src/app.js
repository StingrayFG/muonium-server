const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const http = require('http');

const authRouter = require('./routes/auth.routes');
const driveRouter = require('./routes/drive.routes');
const bookmarkRouter = require('./routes/bookmark.routes');
const fileRouter = require('./routes/file.routes');
const folderRouter = require('./routes/folder.routes');

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
app.use(morgan('dev'));
app.use(cookieParser());

app.use('/auth/', authRouter);
app.use('/drive/', driveRouter);
app.use('/bookmark/', bookmarkRouter);
app.use('/file/', fileRouter);
app.use('/folder/', folderRouter);


const server = http.createServer(app);
server.listen(process.env.PORT || 4000);
server.on('error', (err) => { console.log(err) });


module.exports = app;