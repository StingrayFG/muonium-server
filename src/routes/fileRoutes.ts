import { Router } from 'express';

import { default as authMw } from '@/middlewares/authMiddlewares';
import { default as driveMw } from '@/middlewares/driveMiddlewares';
import { default as fileMw } from '@/middlewares/fileMiddlewares';

import fileController from '@/controllers/fileController/fileController';

import { instance as multer } from '@/instances/multer'


const fileRoutes = Router();

fileRoutes.post('/download', authMw.authenticateJWT, driveMw.checkDrive, fileMw.checkFile, fileController.getFileDownloadToken);

fileRoutes.get('/download/:uuid/:token', fileController.downloadFile);

fileRoutes.post('/upload/:userUuid/:driveUuid/:parentUuid', fileMw.parseBodyPreUpload, authMw.authenticateJWT, driveMw.checkDrive, 
driveMw.checkDriveSpace, fileMw.checkParentFolder, multer.single('file'), fileMw.generateThumbnail,
fileMw.parseBodyPostUpload, fileMw.checkIfNameIsUsedPostUpload, fileController.uploadFile);

fileRoutes.post('/copy', authMw.authenticateJWT, driveMw.checkDrive, fileMw.checkParentFolder, fileMw.checkFile, fileController.copyFile)

fileRoutes.put('/rename', authMw.authenticateJWT, driveMw.checkDrive, fileMw.checkFile, fileMw.checkIfNameIsUsed, fileController.renameFile)

fileRoutes.put('/move', authMw.authenticateJWT, driveMw.checkDrive, fileMw.checkParentFolder, fileMw.checkIfNameIsUsed, fileMw.checkFile, fileController.moveFile)

fileRoutes.put('/remove', authMw.authenticateJWT, driveMw.checkDrive, fileMw.checkFile, fileController.removeFile)

fileRoutes.put('/recover', authMw.authenticateJWT, driveMw.checkDrive, fileMw.checkFile, fileMw.checkIfNameIsUsed, fileController.recoverFile)

fileRoutes.post('/delete', authMw.authenticateJWT, driveMw.checkDrive, fileMw.checkFile, fileController.deleteFile)

export default fileRoutes;
