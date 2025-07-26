import { Request, Response, NextFunction } from 'express';

import { Drive } from '@prisma/client';

import driveServices from '@/services/driveServices';


const driveMiddlewares = {
  checkDrive: async (req: Request, res: Response, next: NextFunction): Promise<any> => { 
    
    try {
      if (req.body.driveData) {
        const drive : Drive | null = await driveServices.getDrive(req.body.driveData)

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
      } else {
        return res.sendStatus(400);
      }
    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
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

export default driveMiddlewares;
