import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser'
import http from 'http';
import fs from 'fs';
import dotenv from 'dotenv';

import authRouter from '@/routes/authRoute';
import driveRouter from './routes/driveRoute';
import bookmarkRouter from '@/routes/bookmarkRoute'
import fileRouter from './routes/fileRoute';
import folderRouter from './routes/folderRoute';


dotenv.config();

const app = express();

const options = {
  origin: [ 
    process.env.CLIENT_URL ? process.env.CLIENT_URL : '',
    process.env.ADDITIONAL_CORS_URL ? process.env.ADDITIONAL_CORS_URL : '',
  ]
};
app.use(cors(options));

app.use(express.json({ 
  limit: parseInt(process.env.MAX_BODY_SIZE, 10) + 'mb' 
}));
app.use(express.urlencoded({ 
  limit: parseInt(process.env.MAX_BODY_SIZE, 10) + 'mb', 
  extended: true, 
  parameterLimit: 50000 
}));

app.use(morgan('dev'));
app.use(cookieParser());

app.use('/auth/', authRouter);
app.use('/drive/', driveRouter);
app.use('/bookmark/', bookmarkRouter);
app.use('/file/', fileRouter);
app.use('/folder/', folderRouter);


const server = http.createServer(app);
server.listen(process.env.PORT || 4000);
server.on('error', (err: any) => { console.log(err) });


if (!fs.existsSync('uploads/')) { fs.mkdirSync('uploads/') };
if (!fs.existsSync('thumbnails/')) { fs.mkdirSync('thumbnails/') };


export default app;
