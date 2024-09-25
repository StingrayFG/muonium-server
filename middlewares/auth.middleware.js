const jwt = require('jsonwebtoken');


const authMiddleware = {
  authenticateJWT: (req, res, next) => { 
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) { 
          return res.sendStatus(403); 
        } else if (user.uuid != req.body.userData.uuid) { 
          return res.sendStatus(403); 
        } else { 
          req.user = user; 
          next();
        } 
      });
    } else {
      return res.sendStatus(401);
    }
  },

  validateUserData: async (req, res, next) => {
    let isUserDataPresent = false;
    let isUserDataValidAsObject = false;
    let isLoginPresent = false;
    let isPasswordPresent = false;
  
    const checkUserData = () => {
      if ('userData' in req.body) {
        isUserDataPresent = true;
        if (typeof req.body.userData === 'object') { 
          isUserDataValidAsObject = true;
          checkLogin();
          checkPassword();
        }
      }
    }
  
    const checkLogin = () => {
      if ('login' in req.body.userData) {
        if (req.body.userData.login) {
          isLoginPresent = true;
        }
      }
    }
  
    const checkPassword = () => {
      if ('password' in req.body.userData) {
        if (req.body.userData.password) {
          isPasswordPresent = true;
        }
      }
    }
  
    checkUserData();
  
    if (!isUserDataPresent) {
      res.statusMessage = "Missing userData";
      return res.status(422).end();
    } else if (!isUserDataValidAsObject) {
      res.statusMessage = "Invalid userData";
      return res.status(422).end();
    } else if (!isLoginPresent) {
      res.statusMessage = "Missing userData.login";
      return res.status(400).end();
    } else if (!isPasswordPresent) {
      res.statusMessage = "Missing userData.password";
      return res.status(400).end();
    } else {
      next();
    }
  },

  validateUserUuid: async (req, res, next) => {
    let isUserDataPresent = false;
    let isUserDataValidAsObject = false;
    let isUuidPresent = false;
  
    const checkUserData = () => {
      if ('userData' in req.body) {
        isUserDataPresent = true;
        if (typeof req.body.userData === 'object') { 
          isUserDataValidAsObject = true;
          checkUuid();
          checkPassword();
        }
      }
    }
  
    const checkUuid = () => {
      if ('uuid' in req.body.userData) {
        if (req.body.userData.uuid) {
          isUuidPresent = true;
        }
      }
    }
  
    const checkPassword = () => {
      if ('password' in req.body.userData) {
        if (req.body.userData.password) {
          isPasswordPresent = true;
        }
      }
    }
  
    checkUserData();
  
    if (!isUserDataPresent) {
      res.statusMessage = "Missing userData";
      return res.status(422).end();
    } else if (!isUserDataValidAsObject) {
      res.statusMessage = "Invalid userData";
      return res.status(422).end();
    } else if (!isUuidPresent) {
      res.statusMessage = "Missing userData.uuid";
      return res.status(400).end();
    } else {
      next();
    }
  }
}



module.exports = authMiddleware;