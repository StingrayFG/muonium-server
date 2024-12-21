import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { User } from '@prisma/client';


const authMiddleware = {
  
  authenticateJWT: async (req: Request, res: Response, next: NextFunction): Promise<any> => { 
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, (err, payload) => {
        const user = payload as User;
        if (err) { 
          res.statusMessage = 'Could not authorize';
          return res.status(403).end();
        } else if (user.uuid != req.body.userData.uuid) { 
          res.statusMessage = 'Invalid userData.uuid';
          return res.status(403).end();
        } else { 
          req.ogUser = user;
          next();
        } 
      });
    } else {
      res.statusMessage = 'Authorization header is missing';
      return res.status(401).end();
    }
  },

  validateUserData: async (req: Request, res: Response, next: NextFunction): Promise<any> => { 
    let isUserDataPresent = false;
    let isUserDataValidAsObject = false;
    let isLoginPresent = false;
    let isLoginAcceptable = false;
    let isPasswordPresent = false;
    let isPasswordAcceptable = false;
  
    const checkUserData = () => {
      if ('userData' in req.body) {
        isUserDataPresent = true;
        if (typeof req.body.userData === 'object') { 
          isUserDataValidAsObject = true;
          checkIfLoginPresent();
          checkIfPasswordPresent();
        }
      }
    }
  
    const checkIfLoginPresent = () => {
      if ('login' in req.body.userData) {
        if (req.body.userData.login) {
          isLoginPresent = true;
          checkIfLoginAcceptable();
        }
      }
    }

    const checkIfLoginAcceptable = () => {
      //console.log(req.body.userData.login.length, parseInt(process.env.MIN_LOGIN_LENGTH, 10))
      if (req.body.userData.login.length > parseInt(process.env.MIN_LOGIN_LENGTH, 10)) {
        isLoginAcceptable = true;
      }
    }
  
    const checkIfPasswordPresent = () => {
      if ('password' in req.body.userData) {
        if (req.body.userData.password) {
          isPasswordPresent = true;
          checkIfPasswordAcceptable();
        }
      }
    }

    const checkIfPasswordAcceptable = () => {
      if (req.body.userData.password.length > parseInt(process.env.MIN_PASSWORD_LENGTH, 10)) {
        isPasswordAcceptable = true;
      }
    }
  
    checkUserData();
  
    if (!isUserDataPresent) {
      res.statusMessage = 'Missing userData';
      return res.status(422).end();
    } else if (!isUserDataValidAsObject) {
      res.statusMessage = 'Invalid userData';
      return res.status(422).end();
    } else if (!isLoginPresent) {
      res.statusMessage = 'Missing userData.login';
      return res.status(400).end();
    } else if (!isPasswordPresent) {
      res.statusMessage = 'Missing userData.password';
      return res.status(400).end();
    } else if (!isLoginAcceptable) {
      res.statusMessage = 'Login too short';
      return res.status(400).end();
    } else if (!isPasswordAcceptable) {
      res.statusMessage = 'Password too short';
      return res.status(400).end();
    } else {
      next();
    }
  },
  
}

export default authMiddleware;
