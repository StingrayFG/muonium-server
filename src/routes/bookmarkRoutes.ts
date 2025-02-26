import { Router } from 'express';

import { default as authMw } from '@/middlewares/authMiddlewares';
import { default as bookmarkMw } from '@/middlewares/bookmarkMiddlewares';

import bookmarkController from '@/controllers/bookmarkController';


const bookmarkRoutes = Router();

bookmarkRoutes.post('/get', authMw.authenticateJWT, bookmarkController.getBookmarks);

bookmarkRoutes.post('/create', authMw.authenticateJWT, bookmarkMw.checkBookmarkDoesNotExist, bookmarkController.createBookmark);

bookmarkRoutes.post('/move', authMw.authenticateJWT, bookmarkMw.checkBookmarkDoesExist, bookmarkMw.checkBookmarkPosition, bookmarkController.moveBookmark);

bookmarkRoutes.post('/delete', authMw.authenticateJWT, bookmarkMw.checkBookmarkDoesExist, bookmarkController.deleteBookmark);

export default bookmarkRoutes;
