import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import { File } from '@prisma/client';

import driveServices from '@/services/driveServices';
import fileServices from '@/services/fileServices';
import folderServices from '@/services/folderServices';
import diskServices from '@/services/diskServices';


const fileController = {

  getFileDownloadToken: async (req: Request, res: Response): Promise<any> => {
    const downloadToken = jwt.sign({ uuid: req.body.fileData.uuid }, process.env.ACCESS_TOKEN_SECRET);
    return res.send({ downloadToken });
  },

  downloadFile: async (req: Request, res: Response): Promise<any> => {
    /* Verify the download token and send the file if the token is valid */
    try {
      jwt.verify(req.params.token, process.env.ACCESS_TOKEN_SECRET, async (err: any, file: any) => {
        console.log(err, file)
        if (err) { 
          return res.sendStatus(403); 
        } else if (file.uuid != req.params.uuid) { 
          return res.sendStatus(403); 
        } else if ((Math.floor(Date.now() / 1000) - file.iat) > parseInt(process.env.DOWNLOAD_LINK_VALID_FOR, 10)) { 
          return res.sendStatus(410); 
        } else {
          const fileData: File | null = await fileServices.getFile({ uuid: req.params.uuid })
          if (fileData) {
            res.set('Content-Disposition', `attachment; filename=${ fileData.name }`);
            return res.sendFile(fileData.name + '.' + fileData.nameExtension, { root: 'uploads/' });
          } else {
            return res.status(404);
          }
        } 
      })
    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
    }
  },

  uploadFile: async (req: Request, res: Response): Promise<any> => {
    try {
      const fileData: File = await fileServices.createFile({
        ...req.body.fileData,
  
        uuid: crypto.randomUUID(),
  
        nameExtension: req.file!.filename.split('.').pop(),
  
        isRemoved: false,
      })

      await driveServices.updateDriveUsedSpace(req.ogDrive!, req.file!.size)

      await folderServices.incrementFolderSize({ uuid: req.body.fileData.parentUuid })

      return res.send({ fileData });

    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
    }
  },

  copyFile: async (req: Request, res: Response): Promise<any> => {
    try {
      /* req.ogFile is the original file object from the database, and it is used instead of the file object sent in the request */
      const originalFile: File = req.ogFile!;

      const modificationDate = Date.now();

      if ((originalFile!.parentUuid === req.body.fileData.parentUuid) && (originalFile!.name === req.body.fileData.name)) {
        return res.sendStatus(409);
      } else {
        req.body.fileData.uuid = crypto.randomUUID();
        req.body.fileData.nameExtension = modificationDate + '';
        req.body.fileData.modificationDate = new Date(modificationDate);    
        req.body.fileData.creationDate = new Date(modificationDate);  
        delete req.body.fileData.type;  
      }

      await diskServices.copyFileOnDisk(originalFile!, req.body.fileData)

      const fileData: File = await fileServices.createFile(req.body.fileData) 
  
      await driveServices.updateDriveUsedSpace(req.ogDrive!, originalFile!.size)

      await folderServices.incrementFolderSize({ uuid: req.body.fileData.parentUuid });

      return res.send({ fileData });

    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
    }
  },

  renameFile: async (req: Request, res: Response): Promise<any> => {
    try {
      const originalFile: File = req.ogFile!;

      const modificationDate = Date.now();
      req.body.fileData.nameExtension = modificationDate + '';
      req.body.fileData.modificationDate = new Date(modificationDate);

      await diskServices.copyFileOnDisk(originalFile!, req.body.fileData)

      const fileData: File = await fileServices.updateFileName(req.body.fileData)

      await diskServices.deleteFileOnDisk(originalFile!)

      return res.send({ fileData });

    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
    }
  },

  moveFile: async (req: Request, res: Response): Promise<any> => {
    try {
      const originalFile: File = req.ogFile!;

      const fileData: File = await fileServices.updateFileParent(req.body.fileData)

      await folderServices.decrementFolderSize({ uuid: originalFile!.parentUuid! });

      await folderServices.incrementFolderSize({ uuid: req.body.fileData.parentUuid });

      return res.send({ fileData });

    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
    }
  },

  removeFile: async (req: Request, res: Response): Promise<any> => {
    try {
      const fileData: File = await fileServices.updateFileIsRemoved({ ...req.body.fileData, isRemoved: true })

      await folderServices.decrementFolderSize({ uuid: req.body.fileData.parentUuid });

      return res.send({ fileData });
      
    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
    }
  },

  recoverFile: async (req: Request, res: Response): Promise<any> => {
    try {
      const fileData: File = await fileServices.updateFileIsRemoved({ ...req.body.fileData, isRemoved: false })

      await folderServices.incrementFolderSize({ uuid: req.body.fileData.parentUuid });

      return res.send({ fileData });
      
    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
    }
  },

  deleteFile: async (req: Request, res: Response): Promise<any> => {
    try {
      const fileData: File = await fileServices.deleteFile(req.ogFile!) 

      await driveServices.updateDriveUsedSpace(req.ogDrive!, -req.ogFile!.size) 

      await diskServices.deleteFileOnDisk(req.ogFile!)

      return res.send({ fileData });
      
    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
    }
  },

}


export default fileController;
