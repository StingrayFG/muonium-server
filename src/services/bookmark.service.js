const prisma = require('../instances/prisma.js')


const bookmarkService = {
  getBookmarks: async (userData) => {
    return new Promise( async function(resolve, reject) {
      await prisma.bookmark.findMany({
        where: {
          ownerUuid: userData.uuid,
        },
      })
      .then(async result => {
        let bookmarks = [];

        for await (let bookmark of result) {
          await prisma.folder.findUnique({
            where: {
              uuid: bookmark.folderUuid,
            },
          })    
          .then(folder => {
            bookmark = { ...bookmark,
              uuid: bookmark.ownerUuid + bookmark.folderUuid,
              folder: folder,
              type: 'bookmark'
            }
            bookmarks.push(bookmark);
          })
        }

        resolve(bookmarks);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  createBookmark: async (userData, folderData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.bookmark.create({
        data: {
          ownerUuid: userData.uuid,
          folderUuid: folderData.uuid,
        },
      })
      .then(bookmark => {
        resolve(bookmark);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  deleteBookmark: async (userData, folderData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.bookmark.delete({
        where: {
          ownerUuid_folderUuid: {
            ownerUuid: userData.uuid,
            folderUuid: folderData.uuid,
          },
        },
      })
      .then(bookmark => {
        resolve(bookmark);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  deleteBookmarksByFoldersUuids: async (userData, folderUuids) => {
    return new Promise(async function(resolve, reject) {
      await prisma.bookmark.deleteMany({
        where: {
          ownerUuid: userData.uuid,
          folderUuid: { in: folderUuids }
        },
      })
      .then(() => {
        resolve();
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },
}

module.exports = bookmarkService;
