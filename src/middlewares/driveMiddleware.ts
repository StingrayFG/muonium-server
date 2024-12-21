import { Request, Response, NextFunction } from 'express';

import { Drive } from '@prisma/client';

import driveService from '@/services/driveService';


const driveMiddleware = {
  checkDrive: async (req: Request, res: Response, next: NextFunction): Promise<any> => { 
    if (req.body.driveData) {
      driveService.getDrive(req.body.driveData)
      .then((drive: (Drive | null)) => {
        if (drive) {
          if (drive.ownerUuid === req.ogUser!.uuid) {
            req.ogDrive = drive;
            next();
          } else {
            return res.sendStatus(403);
          }
        } else {
          return res.sendStatus(404);
        }
      })
      .catch(err => {
        console.log(err);
        return res.sendStatus(400);
      })
    } else {
      return res.sendStatus(400);
    }
  },
  
  checkDriveSpace: async (req: Request, res: Response, next: NextFunction): Promise<any> => { 
    if ((req.ogDrive!.spaceUsed + parseInt(req.headers['content-length']!)) < req.ogDrive!.spaceTotal) {
      next();
    } else {
      return res.sendStatus(413);
    }
  },
}

export default driveMiddleware;
