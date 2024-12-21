import { Request, Response, NextFunction } from 'express';

import { Bookmark, Folder } from '@prisma/client';

import folderService from '@/services/folderService';
import bookmarkService from '@/services/bookmarkService';


const bookmarkMiddleware = {

  checkBookmarkDoesNotExist: async (req: Request, res: Response, next: NextFunction): Promise<any> => { 
    await bookmarkService.getBookmark(req.body.userData, req.body.bookmarkData)
    .then((bookmark: (Bookmark | null)) => {
      if (bookmark) {
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

  checkBookmarkDoesExist: async (req: Request, res: Response, next: NextFunction): Promise<any> => { 
    await bookmarkService.getBookmark(req.body.userData, req.body.bookmarkData)
    .then((bookmark: (Bookmark | null)) => {
      if (bookmark) {
        req.ogBookmark = bookmark;
        next();
      } else {
        return res.sendStatus(404);
      }
    })
    .catch(err => {
      console.log(err);
      return res.sendStatus(500);
    })
  },

  checkBookmaredFolderExists: async (req: Request, res: Response, next: NextFunction): Promise<any> => { 
    if (req.body.bookmarkData.folder?.uuid) {
      await folderService.getFolderByUuid(req.body.bookmarkData.folder)
      .then((folder : (Folder | null)) => {
        if (folder) {
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
      return res.sendStatus(400);
    }
  },

  checkBookmarkPosition: async (req: Request, res: Response, next: NextFunction): Promise<any> => { 
    // Check whether the given bookmark position is valid
    if ((req.body.bookmarkData.position === 0) || req.body.bookmarkData.position) { 
      if (req.body.bookmarkData.position < 0) {
        return res.sendStatus(400)
      } else if (req.body.bookmarkData.position === req.ogBookmark!.position) {
        return res.sendStatus(409);
      } else {
        next();
      }
    } else {
      return res.sendStatus(400);
    }
  },
   
}

export default bookmarkMiddleware;
