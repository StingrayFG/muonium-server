import { Request, Response } from 'express';

import driveService from '@/services/driveService';

import { Drive } from '@prisma/client';


const driveController = {

  getDrive: async (req: Request, res: Response): Promise<any> => {
    await driveService.getDriveByUser(req.ogUser!)
    .then((driveData: (Drive | null)) => {
      return res.send({ driveData });
    })
    .catch((err: any) => {
      console.log(err);
      return res.sendStatus(404);
    })
  },

}

export default driveController;
