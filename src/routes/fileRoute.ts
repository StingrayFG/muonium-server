import { Router } from 'express';

import { default as authMw } from '@/middlewares/authMiddleware';
import { default as driveMw } from '@/middlewares/driveMiddleware';
import { default as fileMw } from '@/middlewares/fileMiddleware';

import fileController from '@/controllers/fileController';

import { instance as multer } from '@/instances/multer'


const fileRouter = Router();

fileRouter.post('/download', authMw.authenticateJWT, driveMw.checkDrive, fileMw.checkFile, fileController.getFileDownloadToken);

fileRouter.get('/download/:uuid/:token', fileController.downloadFile);

fileRouter.post('/upload/:userUuid/:driveUuid/:parentUuid', fileMw.parseBodyPreUpload, authMw.authenticateJWT, driveMw.checkDrive, 
driveMw.checkDriveSpace, fileMw.checkParentFolder, multer.single('file'), fileMw.generateThumbnail,
fileMw.parseBodyPostUpload, fileMw.checkIfNameIsUsedPostUpload, fileController.uploadFile);

fileRouter.post('/copy', authMw.authenticateJWT, driveMw.checkDrive, fileMw.checkParentFolder, fileMw.checkFile, fileController.copyFile)

fileRouter.put('/rename', authMw.authenticateJWT, driveMw.checkDrive, fileMw.checkFile, fileMw.checkIfNameIsUsed, fileController.renameFile)

fileRouter.put('/move', authMw.authenticateJWT, driveMw.checkDrive, fileMw.checkParentFolder, fileMw.checkIfNameIsUsed, fileMw.checkFile, fileController.moveFile)

fileRouter.put('/remove', authMw.authenticateJWT, driveMw.checkDrive, fileMw.checkFile, fileController.removeFile)

fileRouter.put('/recover', authMw.authenticateJWT, driveMw.checkDrive, fileMw.checkFile, fileMw.checkIfNameIsUsed, fileController.recoverFile)

fileRouter.post('/delete', authMw.authenticateJWT, driveMw.checkDrive, fileMw.checkFile, fileController.deleteFile)

export default fileRouter;
