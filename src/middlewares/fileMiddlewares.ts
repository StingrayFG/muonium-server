import { Request, Response, NextFunction } from 'express';
import fs from 'fs'
import path from 'path';

import { File, Folder } from '@prisma/client';

import fileServices from '@/services/fileServices';
import folderServices from '@/services/folderServices';
import imageUtils from '@/utils/imageUtils';
import videoUtils from '@/utils/videoUtils';

import extensions from '@/extensions.json';


const fileMiddlewares = {
  generateThumbnail: async (req: Request, res: Response, next: NextFunction): Promise<any> => { 
    // Generate a low resolution version of the uploaded file, the save it in the thumbnails folder
    const ext = path.parse(req.file!.originalname!).ext.substring(1).toLowerCase();
    
    const fileNameExtension = path.parse(req.file?.filename!).ext.substring(1);
    const fileName = req.file?.originalname!;

    const initialThumbnailPath = `thumbnails/${path.parse(fileName).name}.png`
    const finalThumbnailPath = `thumbnails/${path.parse(fileName).name}.png.${fileNameExtension}`

    try {
      if (extensions.image.includes(ext)) {
        await imageUtils.generateImageThumbnail(req.file!.path, initialThumbnailPath, finalThumbnailPath);
      } else if (extensions.video.includes(ext)) {
        await videoUtils.generateVideoThumbnail(req.file!.path, initialThumbnailPath, finalThumbnailPath);
      }
      next();

    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
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
