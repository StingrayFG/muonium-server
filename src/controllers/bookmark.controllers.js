const bookmarkService = require('../services/bookmark.service.js')


const bookmarkController = {

  getBookmark: async (req, res, next) => {
    await bookmarkService.getBookmarks(req.user)
    .then(bookmarksData => {
      return res.send({ bookmarksData });
    })
    .catch(err => {
      console.log(err);
      return res.sendStatus(404);
    })
  },

  createBookmark: async (req, res, next) => {
    await bookmarkService.createBookmark(req.user, req.body.folderData)
    .then(bookmarkData => {
      return res.send({ bookmarkData });
    })
    .catch(err => {
      console.log(err);
      return res.sendStatus(409);
    })
  },

  deleteBookmark: async (req, res, next) => {
    await bookmarkService.deleteBookmark(req.user, req.body.folderData)
    .then(bookmarkData => {
      return res.send({ bookmarkData });
    })
    .catch(err => {
      console.log(err);
      return res.sendStatus(404);
    })
  },

}

module.exports = bookmarkController;
