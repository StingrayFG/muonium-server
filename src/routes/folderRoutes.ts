import { Router } from 'express';

import { default as authMw } from '@/middlewares/authMiddlewares';
import { default as driveMw } from '@/middlewares/driveMiddlewares';
import { default as folderMw } from '@/middlewares/folderMiddlewares';

import folderController from '@/controllers/folderController/folderController';


const folderRoutes = Router();

folderRoutes.post('/create', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkParentFolder, folderMw.checkIfNameIsUsed, folderController.createFolder);

folderRoutes.post('/get/uuid', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkFolderUuid, folderController.getFolderWithChildren);

folderRoutes.post('/get/path', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkFolderPath, folderController.getFolderWithChildren);

folderRoutes.put('/rename', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkParentFolder, folderMw.checkFolderUuid, folderMw.checkIfNameIsUsed, folderController.renameFolder);

folderRoutes.put('/move', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkParentFolder, folderMw.checkFolderUuid, folderMw.checkIfNameIsUsed, folderController.moveFolder);

folderRoutes.put('/remove', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkFolderUuid, folderController.removeFolder);

folderRoutes.put('/recover', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkFolderUuid, folderMw.checkIfNameIsUsed, folderController.recoverFolder);

folderRoutes.post('/delete', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkFolderUuid, folderController.deleteFolder);

export default folderRoutes;
