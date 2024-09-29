const express = require('express');
const router = express.Router();

const authMw = require('../middlewares/auth.middleware.js')

const authController = require('../controllers/auth.controller.js')


router.post('/login', authMw.validateUserData, authController.login);

router.post('/signup', authMw.validateUserData, authController.signup);


module.exports = router;
