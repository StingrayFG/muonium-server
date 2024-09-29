const express = require('express');
const router = express.Router();

const authMw = require('../middlewares/auth.middleware.js')

const driveController = require('../controllers/drive.controllers.js')


router.post('/get', authMw.authenticateJWT, driveController.getDrive);


module.exports = router;
