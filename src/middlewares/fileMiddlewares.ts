import { Request, Response, NextFunction } from 'express';
import fs from 'fs'
import path from 'path';
import sharp from 'sharp';

import { File, Folder } from '@prisma/client';

import fileServices from '@/services/fileServices';
import folderServices from '@/services/folderServices';


const fileMiddlewares = {
  generateThumbnail: async (req: Request, res: Response, next: NextFunction): Promise<any> => { 
    // Generate a low resolution version of the uploaded file, the save it in the thumbnails folder
    const extension = path.parse(req.file!.originalname!).ext.substring(1);
    if (['png', 'webp', 'jpg', 'jpeg'].includes(extension)) {
      const image = sharp(req.file!.path);
      image.metadata() 
      .then((metadata: any) => {
        if ((metadata.width > 256) || (metadata.height > 256)) {
          if (metadata.width > metadata.height) { 
            return image.resize({ width: 256 });
          } else {
            return image.resize({ height: 256 });
          }      
        } else {
          return image;
        }
      })
      .then(resizedImage => {
        resizedImage.toFile('thumbnails/' + req.file!.filename);
        next();
      })
    } else {
      next();
    }
  },

  parseBodyPreUpload: async (req: Request, res: Response, next: NextFunction) : Promise<any> => { 
    // Assemble the request body, in order to use the common middleware without additional parsing
    req.body = {
      userData: { uuid: req.params.userUuid },
      fileData: { parentUuid: req.params.parentUuid },
      driveData: { uuid: req.params.driveUuid },
    };
    next();
  },

  parseBodyPostUpload: async (req: Request, res: Response, next: NextFunction): Promise<any> => { 
    // Assemble the complete body, now with the full file data.
    req.body.fileData = {
      name: req.file!.originalname,
      size: req.file!.size,

      ownerUuid: req.params.userUuid,
      parentUuid: req.params.parentUuid,
      driveUuid: req.params.driveUuid,
    }
    next();
  },

  checkIfNameIsUsed: async (req: Request, res: Response, next: NextFunction): Promise<any> => { 
    // Check whether the handled file name is already used,
    try {
      const isUsed = await fileServices.checkIfNameIsAlreadyUsed(req.body.fileData)

      if (isUsed) {
        return res.sendStatus(409);
      } else {
        next();
      }
    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
    }
  },

  checkIfNameIsUsedPostUpload: async (req: Request, res: Response, next: NextFunction): Promise<any> => { 
    /* Check whether the handled file name is already used, and if it is, 
    delete the previously uploaded file and generated thumbnail from the disk.
    It is only used on file upload, when the request body needs to be assembled after file upload */
    try {
      const isUsed = await fileServices.checkIfNameIsAlreadyUsed(req.body.fileData)

      if (isUsed) {
        fs.unlink(req.file!.path!, async (err) => {
          if (err) {
            console.log(err);
          }
        })
        fs.unlink('thumbnails/' + req.file!.filename, async (err) => {
          if (err) {
            console.log(err);
          }
        })
        return res.sendStatus(409);
      } else {
        next();
      }
    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
    }
  },


  checkFile: async (req: Request, res: Response, next: NextFunction): Promise<any> => { 
    // Check whether the handled file exists
    try {
      if (req.body.fileData) {
        const file: File | null = await fileServices.getFile(req.body.fileData)

        if (file) {
          req.ogFile = file;
          next();
        } else {
          return res.sendStatus(404);
        }
      } else {
        return res.sendStatus(400);
      }
    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
    }
  },

  checkParentFolder: async (req: Request, res: Response, next: NextFunction): Promise<any> => { 
    // Check whether the parentUuid of the handled folder is valid
    try {
      if (req.body.fileData.parentUuid == 'home') {
        req.ogParentFolder = { uuid: req.body.fileData.parentUuid, absolutePath: '/home'}
        next();
      } else if (req.body.fileData.parentUuid == 'trash') {
        req.ogParentFolder = { uuid: req.body.fileData.parentUuid, absolutePath: '/trash'}
        next();
      } else if (req.body.fileData.parentUuid ) {
        const folder: Folder | null = await folderServices.getParentFolder(req.body.fileData)
        
        if (folder) {
          req.ogParentFolder = folder;
          next();
        } else {
          return res.sendStatus(400);
        }
      }
    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
    }
  }
}

export default fileMiddlewares;
