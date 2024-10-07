const bookmarkService = require('../services/bookmark.service.js')
const folderService = require('../services/folder.service.js')


const bookmarkMiddleware = {

  checkBookmarkDoesNotExist: async (req, res, next) => {
    await bookmarkService.getBookmark(req.body.userData, req.body.bookmarkData)
    .then(bookmark => {
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

  checkBookmarkDoesExist: async (req, res, next) => {
    await bookmarkService.getBookmark(req.body.userData, req.body.bookmarkData)
    .then(bookmark => {
      if (bookmark) {
        req.bookmark = bookmark;
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

  checkBookmaredFolderExists: async (req, res, next) => {
    if (req.body.bookmarkData.folder?.uuid) {
      await folderService.getFolderByUuid(req.body.bookmarkData.folder)
      .then(folder => {
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

  checkBookmarkPosition: async (req, res, next) => {
    if ((req.body.bookmarkData.position === 0) || req.body.bookmarkData.position) { 
      if (req.body.bookmarkData.position < 0) {
        return res.sendStatus(400)
      } else if (req.body.bookmarkData.position === req.bookmark.position) {
        return res.sendStatus(409);
      } else {
        next();
      }
    } else {
      return res.sendStatus(400);
    }
  },
   
}


module.exports = bookmarkMiddleware;
