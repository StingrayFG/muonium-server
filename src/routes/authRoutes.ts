import { Router } from 'express';

import { default as authMw } from '@/middlewares/authMiddlewares';

import authController from '@/controllers/authController/authController';


const authRoutes = Router();

authRoutes.post('/login', authMw.validateUserData, authController.login);

authRoutes.post('/signup', authMw.validateUserData, authController.signup);


export default authRoutes;
