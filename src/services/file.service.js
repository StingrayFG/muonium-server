const crypto = require('crypto');

const prisma = require('../instances/prisma.js')


const fileService = {

  checkIfNameIsAlreadyUsed: async (fileData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.file.findFirst({
        where: {
          name: fileData.name,
          parentUuid: fileData.parentUuid,
          isRemoved: false,
        },
      })
      .then(file => {
        if (file) {
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

  getFile: async (fileData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.file.findUnique({
        where: {
          uuid: fileData.uuid
        }
      })
      .then(file => {
        resolve(file);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  getFilesByParent: async (parentFolderData, driveData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.file.findMany({
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
      .then(files => {
        resolve(files);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  getFilesByParentUuids: async (parentUuids) => {
    return new Promise(async function(resolve, reject) {
      await prisma.file.findMany({
        where: {
          parentUuid: { in: parentUuids }
        },
      })
      .then(files => {
        resolve(files);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  getRemovedFiles: async (driveData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.file.findMany({
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
      .then(files => {
        resolve(files);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  createFile: async (fileData) => {
    return new Promise(async function(resolve, reject) {
      if (!fileData.uuid) { 
        fileData.uuid = crypto.randomUUID();
      }
      
      await prisma.file.create({
        data: fileData
      })
      .then(file => {
        if (file) {
          resolve(file);
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

  updateFileName: async (fileData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.file.update({
        where: {
          uuid: fileData.uuid,
        },
        data: {
          name: fileData.name,
          nameExtension: fileData.nameExtension,
          modificationDate: fileData.modificationDate,
        },
      })
      .then(file => {
        resolve(file);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  updateFileParent: async (fileData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.file.update({
        where: {
          uuid: fileData.uuid,
        },
        data: {
          parentUuid: fileData.parentUuid,
        },
      })
      .then(file => {
        resolve(file);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  updateFileIsRemoved: async (fileData, isRemoved) => {
    return new Promise(async function(resolve, reject) {
      await prisma.file.update({
        where: {
          uuid: fileData.uuid,
        },
        data: {
          isRemoved: isRemoved,
        },
      })
      .then(file => {
        resolve(file);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  deleteFile: async (fileData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.file.delete({
        where: {
          uuid: fileData.uuid,
        },
      })
      .then(file => {
        resolve(file);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  deleteFilesByParentUuids: async (parentUuids) => {
    return new Promise(async function(resolve, reject) {
      await prisma.file.deleteMany({
        where: {
          parentUuid: { in: parentUuids }
        },
      })
      .then(files => {
        resolve(files);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

}

module.exports = fileService;
