const express = require('express');
const router = express.Router();

const authMw = require('../middlewares/auth.middleware.js')
const driveMw = require('../middlewares/drive.middleware.js')
const fileMw = require('../middlewares/file.middleware.js')
const folderMw = require('../middlewares/folder.middleware.js')

const fileController = require('../controllers/file.controllers.js')

const multer = require('../instances/multer.js')


router.post('/download', authMw.authenticateJWT, driveMw.checkDrive, fileMw.checkFile, fileController.getFileDownloadToken);

router.get('/download/:uuid/:token', fileController.downloadFile);

router.post('/upload/:userUuid/:driveUuid/:parentUuid', fileMw.parseBodyPreUpload, authMw.authenticateJWT, driveMw.checkDrive, 
driveMw.checkDriveSpace, fileMw.checkParentFolder, multer.single('file'), fileController.uploadFile);

router.post('/copy', authMw.authenticateJWT, driveMw.checkDrive, fileMw.checkParentFolder, fileMw.checkFile, fileController.copyFile)

router.put('/rename', authMw.authenticateJWT, driveMw.checkDrive, fileMw.checkFile, fileController.renameFile)

router.put('/move', authMw.authenticateJWT, driveMw.checkDrive, fileMw.checkParentFolder, fileMw.checkFile, fileController.moveFile)

router.put('/remove', authMw.authenticateJWT, driveMw.checkDrive, fileMw.checkFile, fileController.removeFile)

router.put('/recover', authMw.authenticateJWT, driveMw.checkDrive, fileMw.checkFile, fileController.recoverFile)

router.post('/delete', authMw.authenticateJWT, driveMw.checkDrive, fileMw.checkFile, fileController.deleteFile)


module.exports = router;
