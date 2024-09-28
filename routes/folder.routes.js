const express = require('express');
const router = express.Router();

const authMw = require('../middlewares/auth.middleware.js')
const driveMw = require('../middlewares/drive.middleware.js')
const folderMw = require('../middlewares/folder.middleware.js')

const folderController = require('../controllers/folder.controller.js');


router.post('/create', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkParentFolder, folderController.createFolder);

router.post('/get/uuid', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkFolderUuid, folderController.getFolderWithChildren);

router.post('/get/path', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkFolderPath, folderController.getFolderWithChildren);

router.put('/rename', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkParentFolder, folderMw.checkFolderUuid, folderController.renameFolder);

router.put('/move', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkParentFolder, folderMw.checkFolderUuid, folderController.moveFolder);

router.put('/remove', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkFolderUuid, folderController.removeFolder);

router.put('/recover', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkFolderUuid, folderController.recoverFolder);

router.post('/delete', authMw.authenticateJWT, driveMw.checkDrive, folderMw.checkFolderUuid, folderController.deleteFolder);


module.exports = router;
