import { Request, Response, NextFunction } from 'express';
import folderService from '@/services/folderService';

import { Folder } from '@prisma/client';

const folderMiddleware = {

  checkIfNameIsUsed: async (req: Request, res: Response, next: NextFunction): Promise<any> => { 
    await folderService.checkIfNameIsAlreadyUsed(req.body.folderData)
    .then(isUsed => {
      if (isUsed) {
        return res.sendStatus(409);
      } else {
        next();
      }
    })
    .catch(err => {
      console.log(err);
      return res.sendStatus(500);
    })
  },

  checkFolderUuid: async (req: Request, res: Response, next: NextFunction): Promise<any> => { 
    // Check whether the uuid of the handled folder is valid
    if (req.body.folderData) {
      if (req.body.folderData.uuid === 'home') {
        req.ogFolder = { 
          ...req.body.folderData,
          uuid: 'home', 
          absolutePath: '/home'
        }
        next();
      } else if (req.body.folderData.uuid === 'trash') {
        req.ogFolder = { 
          ...req.body.folderData,
          uuid: 'trash', 
          absolutePath: '/trash'
        }
        next();
      } else if (req.body.folderData.uuid ) {
        await folderService.getFolderByUuid(req.body.folderData)
        .then((folder: (Folder | null)) => {
          if (folder) {
            req.ogFolder = folder;
            next();
          } else {
            return res.sendStatus(404);
          }
        })
        .catch(err => {
          console.log(err);
          return res.sendStatus(500);
        })
      } else {
        return res.sendStatus(404);
      }
    } else {
      return res.sendStatus(400);
    }
  },

  checkFolderPath: async (req: Request, res: Response, next: NextFunction): Promise<any> => { 
    // Check whether the path of the handled folder is valid
    if (req.body.folderData) {
      if (req.body.folderData.absolutePath === '/home') {
        req.ogFolder = { 
          ...req.body.folderData,
          uuid: 'home', 
          absolutePath: '/home'
        }
        next();
      } else if (req.body.folderData.uuid === 'trash') {
        req.ogFolder = { 
          ...req.body.folderData,
          uuid: 'trash', 
          absolutePath: '/trash'
        }
        next();
      } else if (req.body.folderData.absolutePath ) {
        await folderService.getFolderByPath(req.body.folderData, req.ogDrive!)
        .then((folder: (Folder | null)) => {
          if (folder) {
            req.ogFolder = folder;
            next();
          } else {
            return res.sendStatus(404);
          }
        })
        .catch(err => {
          console.log(err);
          return res.sendStatus(500);
        })
      }
    } else {
      return res.sendStatus(400);
    }
  },

  checkParentFolder: async (req: Request, res: Response, next: NextFunction): Promise<any> => { 
    // Check whether the parentUuid of the handled folder is valid
    if (req.body.folderData.parentUuid === 'home') {
      req.ogParentFolder = { uuid: req.body.folderData.parentUuid, absolutePath: '/home'}
      next();
    } else if (req.body.folderData.parentUuid === 'trash') {
      req.ogParentFolder = { uuid: req.body.folderData.parentUuid, absolutePath: '/trash'}
      next();
    } else if (req.body.folderData.parentUuid) {
      if (req.body.folderData.uuid === req.body.folderData.parentUuid ) { 
        return res.sendStatus(409);
      } else {
        await folderService.getParentFolder(req.body.folderData)
        .then((folder: (Folder | null)) => {
          if (folder) {
            req.ogParentFolder = folder;
            next();
          } else {
            return res.sendStatus(400);
          }
        })
        .catch(err => {
          console.log(err);
          return res.sendStatus(500);
        })
      }
    }
  }
  
}

export default folderMiddleware;
