
import { Request, Response } from 'express';

import { Bookmark, Folder } from '@prisma/client'
import { BookmarkData } from '@/types/BookmarkData';

import bookmarkServices from '@/services/bookmarkServices'
import folderServices from '@/services/folderServices'


const bookmarkController = {

  getBookmarks: async (req: Request, res: Response): Promise<any> => {
    // Used to find the bookmarked folder in the database, then add it to the passed bookmark object, then return it
    const assembleBookmark = async (bookmark: BookmarkData): Promise<BookmarkData> => { 
      return new Promise<BookmarkData>(async (resolve, reject) => {
        try {
          const folder = await folderServices.getFolderByUuid({ uuid: bookmark.folderUuid })    
          bookmark.uuid = bookmark.ownerUuid + bookmark.folderUuid;
          bookmark.folder = folder;
          bookmark.type = 'bookmark';     
          resolve(bookmark);

        } catch (err) {
          reject(null);
        }
      })
    }

    try {
      const bookmarksData: BookmarkData[] = await bookmarkServices.getBookmarks(req.ogUser!)

      await Promise.allSettled(
        bookmarksData.map(async bookmark => {
          bookmark = await assembleBookmark(bookmark)
        })
        .filter(bookmark => (bookmark !== null))
      )

      return res.send({ bookmarksData });

    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
    }
  },

  createBookmark: async (req: Request, res: Response): Promise<any> => {
    try {
      const bookmarksData: BookmarkData[] = await bookmarkServices.getBookmarks(req.ogUser!)

      // Determine the newly created bookmark position, based on how many bookmarks the respective user has
      if (!req.body.bookmarkData.position) { 
        if (bookmarksData.length === 0) {
          req.body.bookmarkData.position = 0;
        } else {
          req.body.bookmarkData.position = bookmarksData.length;
        }
      }

      const bookmarkData: Bookmark = await bookmarkServices.createBookmark({
        folderUuid: req.body.bookmarkData.folderUuid,
        ownerUuid: req.ogUser!.uuid,
        position: req.body.bookmarkData.position
      })

      /* Increment the position of already existing bookmarks, whose current position is greater than or equal to
      the position of the newly created bookmark */
      await bookmarkServices.moveBookmarksBelow(req.ogUser!, req.body.bookmarkData) 

      return res.send({ bookmarkData });

    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
    }
  },

  moveBookmark: async (req: Request, res: Response): Promise<any> => {
    try {
      const bookmarkData: Bookmark = await bookmarkServices.updateBookmarkPosition(req.ogUser!, req.body.bookmarkData)

      let moveFunction;

      /* Choose how the user's bookmarks' positions will be changed
      It is used to keep the bookmark positions in order, with no gaps */
      if (req.body.bookmarkData.position > req.ogBookmark!.position) {
        moveFunction = bookmarkServices.moveBookmarksAboveInRange;
      } else {
        moveFunction = bookmarkServices.moveBookmarksBelowInRange;
      }

      await moveFunction(req.ogUser!, req.ogBookmark!, req.body.bookmarkData) 

      return res.send({ bookmarkData });

    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
    }
  },

  deleteBookmark: async (req: Request, res: Response): Promise<any> => {
    try {
      const bookmarkData: Bookmark = await bookmarkServices.deleteBookmark(req.ogUser!, req.ogBookmark!)

      return res.send({ bookmarkData });

    } catch(err: any) {
      console.log(err);
      return res.sendStatus(404);
    }
  },

}


export default bookmarkController;
