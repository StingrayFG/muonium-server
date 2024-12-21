import { Router } from 'express';

import { default as authMw } from '@/middlewares/authMiddleware';
import { default as bookmarkMw } from '@/middlewares/bookmarkMiddleware';

import bookmarkController from '@/controllers/bookmarkController';


const bookmarkRouter = Router();

bookmarkRouter.post('/get', authMw.authenticateJWT, bookmarkController.getBookmarks);

bookmarkRouter.post('/create', authMw.authenticateJWT, bookmarkMw.checkBookmarkDoesNotExist, bookmarkController.createBookmark);

bookmarkRouter.post('/move', authMw.authenticateJWT, bookmarkMw.checkBookmarkDoesExist, bookmarkMw.checkBookmarkPosition, bookmarkController.moveBookmark);

bookmarkRouter.post('/delete', authMw.authenticateJWT, bookmarkMw.checkBookmarkDoesExist, bookmarkController.deleteBookmark);

export default bookmarkRouter;
