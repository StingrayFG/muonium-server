const crypto = require('crypto');

const prisma = require('../instances/prisma.js')


const driveService = {
  getDrive: async (driveData) => {
    return new Promise( async function(resolve, reject) {
      if (driveData.uuid) {
        await prisma.drive.findUnique({
          where: {
            uuid: driveData.uuid,
          }
        })
        .then(drive => {
          if (drive) {
            resolve(drive);
          } else {
            reject();
          }
        })
        .catch(err => {
          console.log(err);
          reject();
        })
      } else {
        reject();
      }
    })
  },

  getDriveByUser: async (userData) => {
    return new Promise( async function(resolve, reject) {
      if (userData.uuid) {
        await prisma.drive.findFirst({
          where: {
            ownerUuid: userData.uuid,
          }
        })
        .then(drive => {
          if (drive) {
            resolve(drive);
          } else {
            reject();
          }
        })
        .catch(err => {
          console.log(err);
          reject();
        })
      } else {
        reject();
      }
    })
  },

  createDrive: async (userData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.drive.create({
        data: {
          uuid: crypto.randomUUID(),
          ownerUuid: userData.uuid,
          spaceTotal: 1024 * 1024 * process.env.NEW_DRIVE_SIZE,
          spaceUsed: 0,
        },
      })
      .then(drive => {
        resolve(drive);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  updateDriveUsedSpace: async (driveData, usageChange) => {
    return new Promise(async function(resolve, reject) {
      await prisma.drive.update({
        where: {
          uuid: driveData.uuid,
        },
        data: {
          spaceUsed: { increment: usageChange },
        },
      })
      .then(drive => {
        resolve(drive);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },
}

module.exports = driveService;
