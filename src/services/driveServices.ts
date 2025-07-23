import crypto from 'crypto'

import { instance as prisma } from '@/instances/prisma'

import { Drive } from '@prisma/client';
import { UuidOnly } from '@/types/UuidOnly';


const driveServices = {
  getDrive: async (driveData: UuidOnly): Promise<Drive> => {
    return new Promise<Drive>(async (resolve, reject) => {
      try {      
        const drive: Drive | null = await prisma.drive.findUnique({
          where: {
            uuid: driveData.uuid,
          }
        })

        if (drive) { 
          resolve(drive);
        } else {
          reject(404);
        }
      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  getDriveByUser: async (userData: UuidOnly): Promise<Drive> => {
    return new Promise<Drive>(async (resolve, reject) => {
      try {      
        const drive: Drive | null = await prisma.drive.findFirst({
          where: {
            ownerUuid: userData.uuid,
          }
        })

        if (drive) { 
          resolve(drive);
        } else {
          reject(404);
        }
      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  createDrive: async (driveData: Drive): Promise<Drive> => {
    return new Promise<Drive>(async function(resolve, reject) {
      try {
        const drive: Drive = await prisma.drive.create({
          data: driveData
        })

        resolve(drive);
        
      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  updateDriveUsedSpace: async (driveData: UuidOnly, usageChange: number): Promise<Drive> => {
    return new Promise<Drive>(async function(resolve, reject) {
      try {
        const drive: Drive = await prisma.drive.update({
          where: {
            uuid: driveData.uuid,
          },
          data: {
            spaceUsed: { increment: usageChange },
          },
        })

        resolve(drive);
        
      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },
}


export default driveServices;
