import { instance as prisma } from '@/instances/prisma'

import { Bookmark } from '@prisma/client';
import { BookmarkData } from '@/types/BookmarkData';
import { UuidOnly } from '@/types/UuidOnly';


const bookmarkServices = {
  getBookmark: async (userData: UuidOnly, bookmarkData: (Bookmark | BookmarkData)): Promise<Bookmark> => {
    return new Promise<Bookmark>(async (resolve, reject) => {
      try {
        const bookmark: Bookmark | null = await prisma.bookmark.findUnique({
          where: {
            ownerUuid_folderUuid: {
              ownerUuid: userData.uuid,
              folderUuid: bookmarkData.folderUuid,
            },
          },
        })

        if (bookmark) {
          resolve(bookmark);
        } else {
          reject(404);
        }
      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  getBookmarks: async (userData: UuidOnly): Promise<Bookmark[]> => {
    return new Promise<Bookmark[]>(async (resolve, reject) => {
      try {
        const bookmarks: Bookmark[] = await prisma.bookmark.findMany({
          orderBy: [
            {
              position: 'asc',
            },
          ],
          where: {
            ownerUuid: userData.uuid,
          },
        })
        resolve(bookmarks);

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  createBookmark: async (bookmarkData: Bookmark): Promise<Bookmark> => {
    return new Promise<Bookmark>(async (resolve, reject) => {
      try {
        const bookmark: Bookmark = await prisma.bookmark.create({
          data: bookmarkData,
        })
        resolve(bookmark);

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  updateBookmarkPosition: async (userData: UuidOnly, bookmarkData: (Bookmark | BookmarkData)): Promise<Bookmark> => {
    return new Promise<Bookmark>(async (resolve, reject) => {
      try {
        const bookmark: Bookmark = await prisma.bookmark.update({
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
        resolve(bookmark);

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  moveBookmarksBelow: async (userData: UuidOnly, bookmarkData: (Bookmark | BookmarkData)): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      try {
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

        resolve();

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  moveBookmarksAbove: async (userData: UuidOnly, bookmarkData: (Bookmark | BookmarkData)): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      try {
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
            position: { decrement: 1 },
          },
        })
        
        resolve();

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  moveBookmarksBelowInRange: async (userData: UuidOnly, originalBookmarkData: (Bookmark | BookmarkData), editedBookmarkData: (Bookmark | BookmarkData)): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      try {
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
        
        resolve();

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  moveBookmarksAboveInRange: async (userData: UuidOnly, originalBookmarkData: (Bookmark | BookmarkData), editedBookmarkData: (Bookmark | BookmarkData)): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      try {
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
        
        resolve();

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  deleteBookmark: async (userData: UuidOnly, bookmarkData: (Bookmark | BookmarkData)): Promise<Bookmark> => {
    return new Promise<Bookmark>(async (resolve, reject) => {
      try {
        const bookmark: Bookmark = await prisma.bookmark.delete({
          where: {
            ownerUuid_folderUuid: {
              ownerUuid: userData.uuid,
              folderUuid: bookmarkData.folderUuid,
            },
          },
        })
        resolve(bookmark);

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  deleteBookmarksByFoldersUuids: async (userData: UuidOnly, folderUuids: (string)[]): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await prisma.bookmark.deleteMany({
          where: {
            ownerUuid: userData.uuid,
            folderUuid: { in: folderUuids }
          },
        })
        resolve();

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },
}


export default bookmarkServices;
