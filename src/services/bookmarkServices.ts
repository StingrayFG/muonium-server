import { instance as prisma } from '@/instances/prisma'

import { Bookmark } from '@prisma/client';
import { BookmarkData } from '@/types/BookmarkData';
import { UuidOnly } from '@/types/UuidOnly';
import { BatchPayload } from '@/types/prisma/BatchPayload';


const bookmarkServices = {
  getBookmark: async (userData: UuidOnly, bookmarkData: (Bookmark | BookmarkData)): Promise<(Bookmark | null)> => {
    return new Promise<(Bookmark | null)>(async (resolve, reject) => {
      await prisma.bookmark.findUnique({
        where: {
          ownerUuid_folderUuid: {
            ownerUuid: userData.uuid,
            folderUuid: bookmarkData.folderUuid,
          },
        },
      })
      .then((bookmark: (Bookmark | null)) => {
        resolve(bookmark);
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })
    })
  },

  getBookmarks: async (userData: UuidOnly): Promise<Bookmark[]> => {
    return new Promise<Bookmark[]>(async (resolve, reject) => {
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
      .then((bookmark: (Bookmark[])) => {
        resolve(bookmark);
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })
    })
  },

  createBookmark: async (bookmarkData: Bookmark): Promise<Bookmark> => {
    return new Promise<Bookmark>(async (resolve, reject) => {
      await prisma.bookmark.create({
        data: bookmarkData,
      })
      .then((bookmark: Bookmark) => {
        resolve(bookmark);
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })
    })
  },

  updateBookmarkPosition: async (userData: UuidOnly, bookmarkData: (Bookmark | BookmarkData)): Promise<Bookmark> => {
    return new Promise<Bookmark>(async (resolve, reject) => {
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
      .then((bookmark: Bookmark) => {
        resolve(bookmark);
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })
    })
  },

  moveBookmarksBelow: async (userData: UuidOnly, bookmarkData: (Bookmark | BookmarkData)): Promise<number> => {
    return new Promise<number>(async (resolve, reject) => {
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
      .then((res: BatchPayload) => {
        resolve(res.count);
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })
    })
  },

  moveBookmarksAbove: async (userData: UuidOnly, bookmarkData: (Bookmark | BookmarkData)): Promise<number> => {
    return new Promise<number>(async (resolve, reject) => {
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
      .then((res: BatchPayload) => {
        resolve(res.count);
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })
    })
  },

  moveBookmarksBelowInRange: async (userData: UuidOnly, originalBookmarkData: (Bookmark | BookmarkData), editedBookmarkData: (Bookmark | BookmarkData)): Promise<number> => {
    return new Promise<number>(async (resolve, reject) => {
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
      .then((res: BatchPayload) => {
        resolve(res.count);
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })
    })
  },

  moveBookmarksAboveInRange: async (userData: UuidOnly, originalBookmarkData: (Bookmark | BookmarkData), editedBookmarkData: (Bookmark | BookmarkData)): Promise<number> => {
    return new Promise<number>(async (resolve, reject) => {
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
      .then((res: BatchPayload) => {
        resolve(res.count);
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })
    })
  },

  deleteBookmark: async (userData: UuidOnly, bookmarkData: (Bookmark | BookmarkData)): Promise<Bookmark> => {
    return new Promise<Bookmark>(async (resolve, reject) => {
      await prisma.bookmark.delete({
        where: {
          ownerUuid_folderUuid: {
            ownerUuid: userData.uuid,
            folderUuid: bookmarkData.folderUuid,
          },
        },
      })
      .then((bookmark: Bookmark) => {
        resolve(bookmark);
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })
    })
  },

  deleteBookmarksByFoldersUuids: async (userData: UuidOnly, folderUuids: (string)[]): Promise<number> => {
    return new Promise<number>(async (resolve, reject) => {
      await prisma.bookmark.deleteMany({
        where: {
          ownerUuid: userData.uuid,
          folderUuid: { in: folderUuids }
        },
      })
      .then((res: BatchPayload) => {
        resolve(res.count);
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })
    })
  },
}

export default bookmarkServices;
