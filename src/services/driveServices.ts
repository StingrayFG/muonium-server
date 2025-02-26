import crypto from 'crypto'

import { instance as prisma } from '@/instances/prisma'

import { Drive } from '@prisma/client';
import { UuidOnly } from '@/types/UuidOnly';


const driveServices = {
  getDrive: async (driveData: UuidOnly): Promise<(Drive | null)> => {
    return new Promise<(Drive | null)>(async (resolve, reject) => {
      if (driveData.uuid) {
        await prisma.drive.findUnique({
          where: {
            uuid: driveData.uuid,
          }
        })
        .then((drive: (Drive | null)) => {
          if (drive) {
            resolve(drive);
          } else {
            reject();
          }
        })
        .catch((err: any) => {
          console.log(err);
          reject();
        })
      } else {
        reject();
      }
    })
  },

  getDriveByUser: async (userData: UuidOnly): Promise<(Drive | null)> => {
    return new Promise<(Drive | null)>(async (resolve, reject) => {
      if (userData.uuid) {
        await prisma.drive.findFirst({
          where: {
            ownerUuid: userData.uuid,
          }
        })
        .then((drive: (Drive | null)) => {
          if (drive) {
            resolve(drive);
          } else {
            reject();
          }
        })
        .catch((err: any) => {
          console.log(err);
          reject();
        })
      } else {
        reject();
      }
    })
  },

  createDrive: async (userData: UuidOnly): Promise<Drive> => {
    return new Promise<Drive>(async function(resolve, reject) {
      await prisma.drive.create({
        data: {
          uuid: crypto.randomUUID(),
          ownerUuid: userData.uuid,
          spaceTotal: 1024 * 1024 * parseInt(process.env.NEW_DRIVE_SIZE, 10),
          spaceUsed: 0,
        },
      })
      .then((drive: Drive) => {
        resolve(drive);
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })
    })
  },

  updateDriveUsedSpace: async (driveData: UuidOnly, usageChange: number): Promise<Drive> => {
    return new Promise<Drive>(async function(resolve, reject) {
      await prisma.drive.update({
        where: {
          uuid: driveData.uuid,
        },
        data: {
          spaceUsed: { increment: usageChange },
        },
      })
      .then((drive: Drive) => {
        resolve(drive);
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })
    })
  },
}

export default driveServices;
