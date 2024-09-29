const express = require('express');
const router = express.Router();

const authMw = require('../middlewares/auth.middleware.js')

const bookmarkController = require('../controllers/bookmark.controller.js')


router.post('/get', authMw.authenticateJWT, bookmarkController.getBookmark);

router.post('/create', authMw.authenticateJWT, bookmarkController.createBookmark);

router.post('/delete', authMw.authenticateJWT, bookmarkController.deleteBookmark);


module.exports = router;
