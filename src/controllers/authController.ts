import { Request, Response } from 'express';
import jwt from 'jsonwebtoken'
import crypto from 'crypto';
import bcrypt from 'bcrypt';

import { Drive, User } from '@prisma/client';
import { UserData } from '@/types/UserData';

import { instance as redis } from '@/instances/redis';

import userService from '@/services/userService';
import driveService from '@/services/driveService';


const authController = {

  login: async (req: Request, res: Response): Promise<any> => {
    // Use redis to limit login attempts
    let loginAttempt; 
    if (!process.env.IGNORE_AUTH_LIMIT) { 
      loginAttempt = await redis.get(req.headers['x-forwarded-for'] + '-login'); 
    }
    
    if (!loginAttempt) {
      if (!process.env.IGNORE_AUTH_LIMIT) {
        /* Create a redis record, include the request origin (ip) in the record name, set it to expire after a certain period,
        which is based on how frequent login requests are allowed to be. On an incoming request, if there still exists a 
        login record for the given request origin, reject the request.*/
        redis.set(req.headers['x-forwarded-for'] + '-login', ' ');
        redis.expire(req.headers['x-forwarded-for'] + '-login', 3); 
      }

      await userService.getUser(req.body.userData)
      .then((user: UserData) => {
        return res.send({ userData: {
          uuid: user.uuid,
          login: user.login,
          accessToken: jwt.sign({ uuid: user.uuid }, process.env.ACCESS_TOKEN_SECRET!)
        }});
      })
      .catch((err: any) => {
        console.log(err);
        res.statusMessage = 'User not found';
        return res.status(404).end();
      })
    } else {
      res.statusMessage = 'Too many login attempts';
      return res.status(423).end();
    }
  },

  signup: async (req: Request, res: Response): Promise<any> => {
    const createUserAndDrive = async () => {
      return new Promise<void>(async (resolve, reject) => {
        const userUuid = crypto.randomUUID();
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hashSync(req.body.userData.password, saltRounds)
        
        await userService.createUser({
          uuid: userUuid,
          login: req.body.userData.login,
          password: hashedPassword
        })
        .then(async (user: User) => {
          await driveService.createDrive(user)
          .then((drive: Drive) => {
            resolve(); 
          })
        })
        .catch((err: any) => {
          console.log(err);
          reject();
        })
      })
    }

    let signupAttempt;
    if (!process.env.IGNORE_AUTH_LIMIT) { 
      signupAttempt = await redis.get(req.headers['x-forwarded-for'] + '-signup'); 
    }

    if (!signupAttempt) {
      await createUserAndDrive()
      .then(() => {
        if (!process.env.IGNORE_AUTH_LIMIT) {
          /* Create a redis record, include the request origin (ip) in the record name, set it to expire after a certain period,
          which is based on how frequent signup requests are allowed to be. On an incoming request, if there still exists a 
          signup record for the given request origin, reject the request.*/
          redis.set(req.headers['x-forwarded-for'] + '-signup', ' ');
          redis.expire(req.headers['x-forwarded-for'] + '-signup', 3600);
        }
        
        return res.status(201).end();
      })
      .catch((err: any) => {
        console.log(err);
        res.statusMessage = 'Username is already used';
        return res.status(409).end();
      })
    } else {
      res.statusMessage = 'Too many signup attempts';
      return res.status(423).end();
    }
  }

}

export default authController;
