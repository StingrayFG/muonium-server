const crypto = require('crypto');

const prisma = require('../instances/prisma.js')


const folderService = {

  checkIfNameIsAlreadyUsed: async (folderData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.folder.findFirst({
        where: {
          name: folderData.name,
          parentUuid: folderData.parentUuid,
          isRemoved: false
        },
      })
      .then(folder => {
        if (folder) {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch(err => {
        reject();
      })
    })
  },

  getParentFolder: async (childData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.folder.findUnique({
        where: {
          uuid: childData.parentUuid
        }
      })
      .then(folder => {
        if (folder) {
          resolve(folder);
        } else {
          reject();
        }
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  getFolderByUuid: async (folderData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.folder.findUnique({
        where: {
          uuid: folderData.uuid
        }
      })
      .then(folder => {
        resolve(folder);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  getFolderByPath: async (folderData, driveData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.folder.findFirst({
        where: {
          driveUuid: driveData.uuid,
          absolutePath: folderData.absolutePath
        }
      })
      .then(folder => {
        resolve(folder);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  getFoldersByParent: async (parentFolderData, driveData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.folder.findMany({
        orderBy: [
          {
            name: 'asc',
          },
        ],
        where: {
          driveUuid: driveData.uuid,
          parentUuid: parentFolderData.uuid,
          isRemoved: false
        }
      })
      .then(folders => {
        resolve(folders);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  getFoldersByPathBeginning: async (parentFolderData, driveData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.folder.findMany({
        where: {
          driveUuid: driveData.uuid,
          NOT: {
            uuid: parentFolderData.uuid,
          },
          absolutePath: {
            startsWith: parentFolderData.absolutePath,
          },
        },
      })
      .then(folders => {
        resolve(folders);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  getRemovedFolders: async (driveData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.folder.findMany({
        orderBy: [
          {
            name: 'asc',
          },
        ],
        where: {
          driveUuid: driveData.uuid,
          isRemoved: true,
        },
      })
      .then(folders => {
        resolve(folders);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  createFolder: async (folderData) => {
    return new Promise(async function(resolve, reject) {
      if (!folderData.uuid) { 
        folderData.uuid = crypto.randomUUID();
      }
      
      await prisma.folder.create({
        data: folderData
      })
      .then(folder => {
        if (folder) {
          resolve(folder);
        } else {
          reject();
        }
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  updateFolderParentAndPath: async (folderData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.folder.update({
        where: {
          uuid: folderData.uuid,
        },
        data: {
          parentUuid: folderData.parentUuid,
          absolutePath: folderData.absolutePath
        },
      })
      .then(folder => {
        resolve(folder);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  updateFolderNameAndPath: async (folderData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.folder.update({
        where: {
          uuid: folderData.uuid,
        },
        data: {
          name: folderData.name,
          absolutePath: folderData.absolutePath
        },
      })
      .then(folder => {
        resolve(folder);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  updateFolderSize: async (folderData) => {
    return new Promise(async function(resolve, reject) {
      if (folderData.uuid && !['home', 'trash'].includes(folderData.uuid)) {
        await prisma.folder.update({
          where: {
            uuid: folderData.uuid,
          },
          data: {
            name: folderData.name,
            size: folderData.size
          },
        })
        .then(folder => {
          resolve(folder);
        })
        .catch(err => {
          console.log(err);
          resolve();
        })
      } else {
        resolve();
      }
    })
  },

  incrementFolderSize: async (folderData) => {
    return new Promise(async function(resolve, reject) {
      if (folderData.uuid && !['home', 'trash'].includes(folderData.uuid)) {
        await prisma.folder.update({
          where: {
            uuid: folderData.uuid,
          },
          data: {
            name: folderData.name,
            size: { increment: 1 }
          },
        })
        .then(folder => {
          resolve(folder);
        })
        .catch(err => {
          console.log(err);
          resolve();
        }) 
      } else {
        resolve();
      }
    })
  },

  decrementFolderSize: async (folderData) => {
    return new Promise(async function(resolve, reject) {
      if (folderData.uuid && !['home', 'trash'].includes(folderData.uuid)) {
        await prisma.folder.update({
          where: {
            uuid: folderData.uuid,
          },
          data: {
            name: folderData.name,
            size: { decrement: 1 }
          },
        })
        .then(folder => {
          resolve(folder);
        })
        .catch(err => {
          console.log(err);
          resolve();
        }) 
      } else {
        resolve();
      }
    })
  },

  updateFolderIsRemoved: async (folderData, isRemoved) => {
    return new Promise(async function(resolve, reject) {
      await prisma.folder.update({
        where: {
          uuid: folderData.uuid,
        },
        data: {
          isRemoved: isRemoved,
        },
      })
      .then(folder => {
        resolve(folder);
      })
      .catch(err => {
        console.log(err);
        resolve();
      })
    })
  },

  deleteFoldersByFoldersUuids: async (folderUuids) => {
    return new Promise(async function(resolve, reject) {
      await prisma.folder.deleteMany({
        where: {
          uuid: { in: folderUuids }
        },
      })
      .then(folder => {
        resolve(folder);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

}

module.exports = folderService;
