
import { Request, Response } from 'express';

import { Bookmark, Folder } from '@prisma/client'
import { BookmarkData } from '@/types/BookmarkData';

import bookmarkServices from '@/services/bookmarkServices'
import folderServices from '@/services/folderServices'


const bookmarkController = {

  getBookmarks: async (req: Request, res: Response): Promise<any> => {
    // Used to find the bookmarked folder in the database, then add it to the passed bookmark object, then return it
    const getFolder = async (bookmark: BookmarkData) => { 
      return new Promise<void>(async (resolve, reject) => {
        await folderServices.getFolderByUuid({ uuid: bookmark.folderUuid })    
        .then((folder: (Folder | null)) => {
          bookmark.uuid = bookmark.ownerUuid + bookmark.folderUuid;
          bookmark.folder = folder;
          bookmark.type = 'bookmark';

          resolve();
        })
        .catch((err: any) => {
          resolve();
        })
      })
    }

    await bookmarkServices.getBookmarks(req.ogUser!)
    .then(async (bookmarksData: BookmarkData[]) => {
      await Promise.allSettled(
        bookmarksData.map(async bookmark => {
          return await getFolder(bookmark)
        })
      )
      .then(() => {
        return res.send({ bookmarksData });
      })
      .catch((err: any) => {
        console.log(err);
        return res.send({ bookmarksData });
      })
    })
    .catch((err: any) => {
      console.log(err);
      return res.sendStatus(404);
    })
  },

  createBookmark: async (req: Request, res: Response): Promise<any> => {
    await bookmarkServices.getBookmarks(req.ogUser!)
    .then(async (bookmarksData : BookmarkData[]) => {
      // Determine the newly created bookmark position, based on how many bookmarks the respective user has
      if (!req.body.bookmarkData.position) { 
        if (bookmarksData.length === 0) {
          req.body.bookmarkData.position = 0;
        } else {
          req.body.bookmarkData.position = bookmarksData.length;
        }
      }

      await bookmarkServices.createBookmark({
        folderUuid: req.body.bookmarkData.folderUuid,
        ownerUuid: req.ogUser!.uuid,
        position: req.body.bookmarkData.position
      })
      .then(async (bookmarkData: Bookmark) => {
        /* Increment the position of already existing bookmarks, whose current position is greater than or equal to
        the position of the newly created bookmark */
        await bookmarkServices.moveBookmarksBelow(req.ogUser!, req.body.bookmarkData) 
        .then(() => {
          return res.send({ bookmarkData });
        })
        .catch((err: any) => {
          console.log(err);
          return res.send({ bookmarkData });
        })
      })
      .catch((err: any) => {
        console.log(err);
        return res.sendStatus(409);
      })

    })
    .catch((err: any) => {
      console.log(err);
      return res.sendStatus(500);
    })
  },

  moveBookmark: async (req: Request, res: Response): Promise<any> => {
    await bookmarkServices.updateBookmarkPosition(req.ogUser!, req.body.bookmarkData)
    .then(async (bookmarkData : BookmarkData | null) => {
      let moveFunction;

      /* Choose how the user's bookmarks' positions will be changed
      It is used to keep the bookmark positions in order, with no gaps */
      if (req.body.bookmarkData.position > req.ogBookmark!.position) {
        moveFunction = bookmarkServices.moveBookmarksAboveInRange;
      } else {
        moveFunction = bookmarkServices.moveBookmarksBelowInRange;
      }

      // req.ogBookmark is the original bookmark, req.body.bookmarkData is the edited one
      await moveFunction(req.ogUser!, req.ogBookmark!, req.body.bookmarkData) 
      .then(() => {
        return res.send({ bookmarkData });
      })
      .catch(async (err: any) => {
        console.log(err)
        // Return the moved bookmark's position if updating orher bookmarks' positions fails
        await bookmarkServices.updateBookmarkPosition(req.ogUser!, req.body.bookmark) 
        .then(() => {
          return res.sendStatus(500);
        })
      })
    })
    .catch((err: any) => {
      console.log(err);
      return res.sendStatus(409);
    })
  },

  deleteBookmark: async (req: Request, res: Response): Promise<any> => {
    await bookmarkServices.deleteBookmark(req.ogUser!, req.ogBookmark!)
    .then(async (bookmarkData : (BookmarkData | null)) => {
      /* Decrement the position of already existing bookmarks, whose current position is greater than or equal to
      the position of the deleted bookmark */
      await bookmarkServices.moveBookmarksAbove(req.ogUser!, req.ogBookmark!) 
        .then(() => {
          return res.send({ bookmarkData });
        })
        .catch((err: any) => {
          console.log(err);
          return res.send({ bookmarkData });
        })
    })
    .catch((err: any) => {
      console.log(err);
      return res.sendStatus(404);
    })
  },

}

export default bookmarkController;
