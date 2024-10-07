const prisma = require('../instances/prisma.js')


const bookmarkService = {
  getBookmark: async (userData, bookmarkData) => {
    return new Promise( async function(resolve, reject) {
      await prisma.bookmark.findUnique({
        where: {
          ownerUuid_folderUuid: {
            ownerUuid: userData.uuid,
            folderUuid: bookmarkData.folderUuid,
          },
        },
      })
      .then(async bookmark => {
        resolve(bookmark);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  getBookmarks: async (userData) => {
    return new Promise( async function(resolve, reject) {
      await prisma.bookmark.findMany({
        orderBy: [
          {
            position: 'asc',
          },
        ],
        where: {
          ownerUuid: userData.uuid,
        },
      })
      .then(async bookmarks => {
        resolve(bookmarks); 
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  createBookmark: async (userData, bookmarkData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.bookmark.create({
        data: {
          ownerUuid: userData.uuid,
          folderUuid: bookmarkData.folderUuid,
          position: bookmarkData.position,
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

  updateBookmarkPosition: async (userData, bookmarkData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.bookmark.update({
        where: {
          ownerUuid_folderUuid: {
            ownerUuid: userData.uuid,
            folderUuid: bookmarkData.folderUuid,
          },
        },
        data: {
          position: bookmarkData.position,
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

  moveBookmarksBelow: async (userData, bookmarkData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.bookmark.updateMany({
        where: {
          ownerUuid: userData.uuid,
          NOT: {
            folderUuid: bookmarkData.folderUuid
          },
          position: {
            gte: bookmarkData.position
          }
        },
        data: {
          position: { increment: 1 },
        },
      })
      .then(bookmarks => {
        resolve(bookmarks);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  moveBookmarksBelowInRange: async (userData, originalBookmarkData, editedBookmarkData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.bookmark.updateMany({
        where: {
          ownerUuid: userData.uuid,
          NOT: {
            folderUuid: originalBookmarkData.folderUuid
          },
          position: {
            gte: editedBookmarkData.position,
            lt: originalBookmarkData.position
          }
        },
        data: {
          position: { increment: 1 },
        },
      })
      .then(bookmarks => {
        resolve(bookmarks);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  moveBookmarksAboveInRange: async (userData, originalBookmarkData, editedBookmarkData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.bookmark.updateMany({
        where: {
          ownerUuid: userData.uuid,
          NOT: {
            folderUuid: originalBookmarkData.folderUuid
          },
          position: {
            gt: originalBookmarkData.position,
            lte: editedBookmarkData.position
          }
        },
        data: {
          position: { decrement: 1 },
        },
      })
      .then(bookmarks => {
        console.log(bookmarks)
        resolve(bookmarks);
      })
      .catch(err => {
        console.log(err);
        reject();
      })
    })
  },

  deleteBookmark: async (userData, bookmarkData) => {
    return new Promise(async function(resolve, reject) {
      await prisma.bookmark.delete({
        where: {
          ownerUuid_folderUuid: {
            ownerUuid: userData.uuid,
            folderUuid: bookmarkData.folderUuid,
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
