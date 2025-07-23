import { Request, Response } from 'express';
import jwt from 'jsonwebtoken'
import crypto from 'crypto';
import bcrypt from 'bcrypt';

import { Drive, User } from '@prisma/client';
import { UserData } from '@/types/UserData';

import { instance as redis } from '@/instances/redis';

import userServices from '@/services/userServices/userServices';
import driveServices from '@/services/driveServices';


const authController = {

  login: async (req: Request, res: Response): Promise<any> => {
    const checkIfLoggingInAllowed = async (): Promise<boolean> => {
      return new Promise<boolean>(async (resolve, reject) => {
        if (process.env.IGNORE_AUTH_LIMIT) {
          resolve(true);
        } else { 
          const loginAttempt = await redis.get(req.headers['x-forwarded-for'] + '-login'); 
          if (loginAttempt) { 
            await redis.set(req.headers['x-forwarded-for'] + '-login', ' ');
            await redis.expire(req.headers['x-forwarded-for'] + '-login', 1); 
            resolve(true); 

          } else { 
            resolve(false); 
          }
        }
      })
    }
    
    if (await checkIfLoggingInAllowed()) {
      try {
        const user: User = await userServices.getUser(req.body.userData)
        const accessToken = jwt.sign({ uuid: user.uuid }, process.env.ACCESS_TOKEN_SECRET)
        const userData: UserData = {
          uuid: user.uuid,
          login: user.login,
          accessToken,
        }
        res.send({ userData });

      } catch (err: any) {
        console.log(err);
        res.statusMessage = 'User not found';
        return res.status(404).end(); 
      }
    } else {
      res.statusMessage = 'Too many login attempts';
      return res.status(423).end();
    }
  },

  signup: async (req: Request, res: Response): Promise<any> => {
    const checkIfSigningUpAllowed = async (): Promise<boolean> => {
      return new Promise<boolean>(async (resolve, reject) => {
        if (process.env.IGNORE_AUTH_LIMIT) {
          resolve(true);
        } else { 
          const signupAttempt = await redis.get(req.headers['x-forwarded-for'] + '-signup'); 
          if (signupAttempt) { 
            redis.set(req.headers['x-forwarded-for'] + '-signup', ' ');
            redis.expire(req.headers['x-forwarded-for'] + '-signup', 3600);
            resolve(true); 
            
          } else { 
            resolve(false); 
          }
        }
      })
    }

    const createUserAndDrive = async (): Promise<void> => {
      return new Promise<void>(async (resolve, reject) => {
        try {
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(req.body.userData.password, saltRounds)

          const newUser: User = {
            uuid: crypto.randomUUID(),
            login: req.body.userData.login,
            password: hashedPassword,
          }

          const user: User = await userServices.createUser(newUser);

          const newDrive: Drive = {
            uuid: crypto.randomUUID(),
            ownerUuid: user.uuid,
            spaceTotal: 1024 * 1024 * parseInt(process.env.NEW_DRIVE_SIZE, 10),
            spaceUsed: 0,
          }

          await driveServices.createDrive(newDrive);

          resolve();

        } catch (err: any) {
          console.log(err);
          reject();
        }
      })
    }

    if (await checkIfSigningUpAllowed()) {
      try {
        await createUserAndDrive();
        res.status(201).end();

      } catch (err: any) {
        console.log(err);
        res.statusMessage = 'Username is already used';
        return res.status(409).end();
      }
    } else {
      res.statusMessage = 'Too many signup attempts';
      return res.status(423).end();
    }
  }

}


export default authController;
