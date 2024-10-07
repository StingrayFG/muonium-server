const express = require('express');
const router = express.Router();

const authMw = require('../middlewares/auth.middleware.js')
const folderMw = require('../middlewares/folder.middleware.js')
const bookmarkMw = require('../middlewares/bookmark.middleware.js')

const bookmarkController = require('../controllers/bookmark.controller.js')


router.post('/get', authMw.authenticateJWT, bookmarkController.getBookmarks);

router.post('/create', authMw.authenticateJWT, bookmarkMw.checkBookmarkDoesNotExist, bookmarkController.createBookmark);

router.post('/move', authMw.authenticateJWT, bookmarkMw.checkBookmarkDoesExist, bookmarkMw.checkBookmarkPosition, bookmarkController.moveBookmark);

router.post('/delete', authMw.authenticateJWT, bookmarkMw.checkBookmarkDoesExist, bookmarkController.deleteBookmark);


module.exports = router;
