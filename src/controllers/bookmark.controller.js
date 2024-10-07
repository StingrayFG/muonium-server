const bookmarkService = require('../services/bookmark.service.js')
const folderService = require('../services/folder.service.js')


const bookmarkController = {

  getBookmarks: async (req, res, next) => {
    const getFolder = async (bookmark) => {
      return new Promise(async function(resolve, reject) {
        await folderService.getFolderByUuid({ uuid: bookmark.folderUuid })    
        .then(folder => {
          bookmark.uuid = bookmark.ownerUuid + bookmark.folderUuid;
          bookmark.folder = folder;
          bookmark.type = 'bookmark';

          resolve(bookmark);
        })
        .catch(err => {
          resolve(bookmark);
        })
      })
    }

    await bookmarkService.getBookmarks(req.user)
    .then(async bookmarksData => {
      await Promise.allSettled(
        bookmarksData.map(async bookmark => {
          return await getFolder(bookmark);
        })
      )
      .then(() => {
        return res.send({ bookmarksData });
      })
      .catch(err => {
        console.log(err);
        return res.send({ bookmarksData });
      })
    })
    .catch(err => {
      console.log(err);
      return res.sendStatus(404);
    })
  },

  createBookmark: async (req, res, next) => {
    await bookmarkService.getBookmarks(req.user)
    .then(async bookmarksData => {
      if (!req.body.bookmarkData.position) {
        if (bookmarksData.length === 0) {
          req.body.bookmarkData.position = 0;
        } else {
          req.body.bookmarkData.position = bookmarksData.length;
        }
      }

      await bookmarkService.createBookmark(req.user, req.body.bookmarkData)
      .then(async bookmarkData => {
        await bookmarkService.moveBookmarksBelow(req.user, req.body.bookmarkData)
        .then(() => {
          return res.send({ bookmarkData });
        })
        .catch(err => {
          console.log(err);
          return res.send({ bookmarkData });
        })
      })
      .catch(err => {
        console.log(err);
        return res.sendStatus(409);
      })

    })
    .catch(err => {
      console.log(err);
      return res.sendStatus(500);
    })
  },

  moveBookmark: async (req, res, next) => {
    await bookmarkService.updateBookmarkPosition(req.user, req.body.bookmarkData)
    .then(async bookmarkData => {
      let moveFunction;

      if (req.body.bookmarkData.position > req.bookmark.position) {
        moveFunction = bookmarkService.moveBookmarksAboveInRange;
      } else {
        moveFunction = bookmarkService.moveBookmarksBelowInRange;
      }

      await moveFunction(req.user, req.bookmark, req.body.bookmarkData) // req.bookmark is the original bookmark, req.body.bookmarkData is the edited one
      .then(() => {
        return res.send({ bookmarkData });
      })
      .catch(async err => {
        console.log(err)
        await bookmarkService.updateBookmarkPosition(req.user, req.body.bookmark) // Return to original state if move fails
        .then(() => {
          return res.sendStatus(500);
        })
      })
    })
    .catch(err => {
      console.log(err);
      return res.sendStatus(409);
    })
  },

  deleteBookmark: async (req, res, next) => {
    await bookmarkService.deleteBookmark(req.user, req.bookmark) // In order to use the position stored in the database
    .then(async bookmarkData => {
      await bookmarkService.moveBookmarksAbove(req.user, req.bookmark)
        .then(() => {
          return res.send({ bookmarkData });
        })
        .catch(err => {
          console.log(err);
          return res.send({ bookmarkData });
        })
    })
    .catch(err => {
      console.log(err);
      return res.sendStatus(404);
    })
  },

}

module.exports = bookmarkController;
