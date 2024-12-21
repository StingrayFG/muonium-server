import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import { File } from '@prisma/client';

import driveService from '@/services/driveService';
import fileService from '@/services/fileService';
import folderService from '@/services/folderService';
import diskService from '@/services/diskService';


const fileController = {

  getFileDownloadToken: async (req: Request, res: Response): Promise<any> => {
    const downloadToken = jwt.sign({ uuid: req.body.fileData.uuid }, process.env.ACCESS_TOKEN_SECRET);
    return res.send({ downloadToken });
  },

  downloadFile: async (req: Request, res: Response) => {
    /* Verify the download token and send the file if the token is valid */
    jwt.verify(req.params.token, process.env.ACCESS_TOKEN_SECRET, async (err: any, file: any) => {
      console.log(err, file)
      if (err) { 
        return res.sendStatus(403); 
      } else if (file.uuid != req.params.uuid) { 
        return res.sendStatus(403); 
      } else if ((Math.floor(Date.now() / 1000) - file.iat) > parseInt(process.env.DOWNLOAD_LINK_VALID_FOR, 10)) { 
        return res.sendStatus(410); 
      } else {
        await fileService.getFile({ uuid: req.params.uuid })
        .then((fileData: (File | null)) => {
          if (fileData) {
            res.set('Content-Disposition', `attachment; filename='${ fileData.name }'`);
            return res.sendFile(fileData.name + '.' + fileData.nameExtension, { root: 'uploads/' });
          } else {
            return res.status(404);
          }
        })
        .catch((err: any) => {
          console.log(err);
          return res.sendStatus(500);
        })
      } 
    })
  },

  uploadFile: async (req: Request, res: Response): Promise<any> => {
    await fileService.createFile({
      ...req.body.fileData,

      uuid: crypto.randomUUID(),

      nameExtension: Date.now(),

      isRemoved: false,
    })
    .then(async (fileData: File) => {
      await driveService.updateDriveUsedSpace(req.ogDrive!, req.ogFile!.size)
      .then(async () => {
        await folderService.incrementFolderSize({ uuid: req.body.fileData.parentUuid });
        return res.send({ fileData });
      })
    }) 
    .catch((err: any) => {
      console.log(err);
      return res.sendStatus(500);
    }) 
  },

  copyFile: async (req: Request, res: Response): Promise<any> => {
    /* req.ogFile is the original file object from the database, and it is used to prevent spoofing */
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

    await diskService.copyFileOnDisk(originalFile!, req.body.fileData)
    .then(async () => {
      await fileService.createFile(req.body.fileData) 
      .then(async (fileData: File) => {
        await driveService.updateDriveUsedSpace(req.ogDrive!, originalFile!.size)
        .then(async () => {
          await folderService.incrementFolderSize({ uuid: req.body.fileData.parentUuid });
          return res.send({ fileData });
        })
      })
    })
    .catch((err: any) => {
      console.log(err)
      return res.sendStatus(500);
    }) 
  },

  renameFile: async (req: Request, res: Response): Promise<any> => {
    /* req.ogFile is the original file object from the database, and it is used to prevent spoofing */
    const originalFile: File = req.ogFile!;

    const modificationDate = Date.now();
    req.body.fileData.nameExtension = modificationDate + '';
    req.body.fileData.modificationDate = new Date(modificationDate);

    await diskService.copyFileOnDisk(originalFile!, req.body.fileData)
    .then(async () => {
      await fileService.updateFileName(req.body.fileData)
      .then(async (fileData: File) => {
        await diskService.deleteFileOnDisk(originalFile!)
        .then(() => {
          return res.send({ fileData });
        })   
      })
    })
    .catch((err: any) => {
      console.log(err)
      return res.sendStatus(500);
    }) 
  },

  moveFile: async (req: Request, res: Response): Promise<any> => {
    const originalFile: File = req.ogFile!;

    await fileService.updateFileParent(req.body.fileData)
    .then(async (fileData: File) => {
      await folderService.decrementFolderSize({ uuid: originalFile!.parentUuid! });
      await folderService.incrementFolderSize({ uuid: req.body.fileData.uuid });
      return res.send({ fileData });
    })
    .catch((err: any) => {
      console.log(err)
      return res.sendStatus(500);
    }) 
  },

  removeFile: async (req: Request, res: Response): Promise<any> => {
    await fileService.updateFileIsRemoved({ ...req.body.fileData, isRemoved: true })
    .then(async (fileData: File) => {
      await folderService.decrementFolderSize({ uuid: req.body.fileData.parentUuid });
      return res.send({ fileData });
    })
    .catch((err: any) => {
      console.log(err)
      return res.sendStatus(500);
    }) 
  },

  recoverFile: async (req: Request, res: Response): Promise<any> => {
    await fileService.updateFileIsRemoved({ ...req.body.fileData, isRemoved: false })
    .then(async (fileData: File) => {
      await folderService.incrementFolderSize({ uuid: req.body.fileData.parentUuid });
      return res.send({ fileData });
    })
    .catch((err: any) => {
      console.log(err)
      return res.sendStatus(500);
    }) 
  },

  deleteFile: async (req: Request, res: Response): Promise<any> => {
    await fileService.deleteFile(req.ogFile!) 
    .then(async (fileData: File) => {
      /* req.ogFile is the original file object from the database, and it is used instead of 
      req.body.fileData to prevent the file size spoofing */
      await driveService.updateDriveUsedSpace(req.ogDrive!, -req.ogFile!.size) 
      .then(async () => {
        await diskService.deleteFileOnDisk(req.ogFile!)
        .then(() => {
          return res.send({ fileData });
        })      
      })
    }) 
    .catch((err: any) => {
      console.log(err)
      return res.sendStatus(500);
    }) 
  },

}

export default fileController;
