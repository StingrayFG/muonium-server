import { Router } from 'express';

import { default as authMw } from '@/middlewares/authMiddlewares';

import driveController from '@/controllers/driveController';

const driveRoutes = Router();

driveRoutes.post('/get', authMw.authenticateJWT, driveController.getDrive);

export default driveRoutes;

