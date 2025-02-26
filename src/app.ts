import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser'
import http from 'http';
import fs from 'fs';
import dotenv from 'dotenv';

import authRoutes from '@/routes/authRoutes';
import driveRoutes from '@/routes/driveRoutes';
import bookmarkRoutes from '@/routes/bookmarkRoutes'
import fileRoutes from '@/routes/fileRoutes';
import folderRoutes from '@/routes/folderRoutes';


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

app.use('/auth/', authRoutes);
app.use('/drive/', driveRoutes);
app.use('/bookmark/', bookmarkRoutes);
app.use('/file/', fileRoutes);
app.use('/folder/', folderRoutes);


const server = http.createServer(app);
server.listen(process.env.PORT || 4000);
server.on('error', (err: any) => { console.log(err) });


if (!fs.existsSync('uploads/')) { fs.mkdirSync('uploads/') };
if (!fs.existsSync('thumbnails/')) { fs.mkdirSync('thumbnails/') };


export default app;
