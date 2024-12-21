import { Router } from 'express';

import { default as authMw } from '@/middlewares/authMiddleware';

import authController from '@/controllers/authController';


const authRouter = Router();

authRouter.post('/login', authMw.validateUserData, authController.login);

authRouter.post('/signup', authMw.validateUserData, authController.signup);


export default authRouter;
