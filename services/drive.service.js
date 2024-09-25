const prisma = require('../instances/prisma.js')

const driveService = {
  getDrive: async (user) => {
    return new Promise( async function(resolve, reject) {
      if (user) {
        result = await prisma.drive.findFirst({
          where: {
            ownerUuid: user.uuid,
          }
        })
        .then(drive => {
          if (drive) {
            resolve(drive);
          } else {
            reject();
          }
        })
        .catch(() => {
          reject();
        })
      }
    })
  },

  createDrive: async (user) => {
    return new Promise(async function(resolve, reject) {
      await prisma.drive.create({
        data: {
          uuid: crypto.randomUUID(),
          ownerUuid: user.uuid,
          spaceTotal: 1024 * 1024 * process.env.NEW_DRIVE_SIZE,
          spaceUsed: 0,
        },
      })
      .then(drive => {
        resolve(drive);
      })
      .catch(() => {
        reject();
      })
    })
  },
}

module.exports = driveService;
