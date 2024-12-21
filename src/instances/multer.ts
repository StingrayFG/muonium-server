import { Request } from 'express';
import multer from 'multer'


export const instance = multer({ 
  storage: multer.diskStorage({
    destination: function (req: Request, file: any, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req: Request, file: any, cb) {
      cb(null, file.originalname + '.' + Date.now())  
    }
  }), 
  limits: { 
    fileSize: 1024 * 1024 * parseInt(process.env.MAX_FILE_SIZE, 10)
  } 
});
