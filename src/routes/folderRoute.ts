import { Router  } from 'express';

import { default as authMw } from '@/middlewares/authMiddleware';
import { default as driveMw } from '@/middlewares/driveMiddleware';
import { default as folderMw } from '@/middlewares/folderMiddleware';

import folderController from '@/controllers/folderController';


const folderRouter  = Router ();

folderRouter.post('/create', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkParentFolder, folderMw.checkIfNameIsUsed, folderController.createFolder);

folderRouter.post('/get/uuid', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkFolderUuid, folderController.getFolderWithChildren);

folderRouter.post('/get/path', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkFolderPath, folderController.getFolderWithChildren);

folderRouter.put('/rename', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkParentFolder, folderMw.checkFolderUuid, folderMw.checkIfNameIsUsed, folderController.renameFolder);

folderRouter.put('/move', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkParentFolder, folderMw.checkFolderUuid, folderMw.checkIfNameIsUsed, folderController.moveFolder);

folderRouter.put('/remove', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkFolderUuid, folderController.removeFolder);

folderRouter.put('/recover', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkFolderUuid, folderMw.checkIfNameIsUsed, folderController.recoverFolder);

folderRouter.post('/delete', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkFolderUuid, folderController.deleteFolder);

export default folderRouter;
