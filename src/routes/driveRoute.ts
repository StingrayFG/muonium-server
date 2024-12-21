import { Router } from 'express';

import { default as authMw } from '@/middlewares/authMiddleware';

import driveController from '@/controllers/driveController';

const driveRouter = Router();

driveRouter.post('/get', authMw.authenticateJWT, driveController.getDrive);

export default driveRouter;

