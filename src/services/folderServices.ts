import { Folder } from '@prisma/client';

import { instance as prisma } from '@/instances/prisma'

import { FolderData } from '@/types/FolderData';
import { UuidOnly } from '@/types/UuidOnly';


const folderServices = {

  checkIfNameIsAlreadyUsed: async (folderData: (Folder | FolderData)): Promise<boolean> => {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        const folder: Folder | null = await prisma.folder.findFirst({
          where: {
            name: folderData.name,
            parentUuid: folderData.parentUuid,
            isRemoved: false
          },
        })
  
        if (folder) {
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  getParentFolder: async (childData: (Folder | FolderData)): Promise<Folder> => {
    return new Promise<Folder>(async (resolve, reject) => {
      try {
        const folder: Folder | null = await prisma.folder.findUnique({
          where: {
            uuid: childData.parentUuid!
          }
        })
  
        if (folder) {
          resolve(folder);
        } else {
          reject(404);
        }
      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  getFolderByUuid: async (folderData: UuidOnly): Promise<Folder> => {
    return new Promise<Folder>(async (resolve, reject) => {
      try {
        const folder: Folder | null = await prisma.folder.findUnique({
          where: {
            uuid: folderData.uuid
          }
        })
  
        if (folder) {
          resolve(folder);
        } else {
          reject(404);
        }
      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  getFolderByPath: async (folderData: (Folder | FolderData), driveData: UuidOnly): Promise<Folder> => {
    return new Promise<Folder>(async (resolve, reject) => {
      try {
        const folder: Folder | null =  await prisma.folder.findFirst({
          where: {
            driveUuid: driveData.uuid,
            absolutePath: folderData.absolutePath
          }
        })
  
        if (folder) {
          resolve(folder);
        } else {
          reject(404);
        }
      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  getFoldersByParent: async (parentFolderData: (Folder | FolderData), driveData: UuidOnly): Promise<Folder[]> => {
    return new Promise<Folder[]>(async (resolve, reject) => {
      try {
        const folders: Folder[] = await prisma.folder.findMany({
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
        resolve(folders);

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  getFoldersByPathBeginning: async (parentFolderData: (Folder | FolderData), driveData: UuidOnly): Promise<Folder[]> => {
    return new Promise<Folder[]>(async (resolve, reject) => {
      try {
        const folders: Folder[] = await prisma.folder.findMany({
          where: {
            driveUuid: driveData.uuid,
            NOT: {
              uuid: parentFolderData.uuid,
            },
            absolutePath: {
              startsWith: parentFolderData.absolutePath!,
            },
          },
        })
        resolve(folders);

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  getRemovedFolders: async (driveData: UuidOnly): Promise<Folder[]> => {
    return new Promise<Folder[]>(async (resolve, reject) => {
      try {
        const folders: Folder[] = await prisma.folder.findMany({
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
        resolve(folders);

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  createFolder: async (folderData: Folder): Promise<Folder> => {
    return new Promise<Folder>(async (resolve, reject) => {
      try {
        const folder: Folder = await prisma.folder.create({
          data: folderData
        })
        resolve(folder);

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  updateFolderParentAndPath: async (folderData: (Folder | FolderData)): Promise<Folder> => {
    return new Promise<Folder>(async (resolve, reject) => {
      try {
        const folder: Folder = await prisma.folder.update({
          where: {
            uuid: folderData.uuid,
          },
          data: {
            parentUuid: folderData.parentUuid,
            absolutePath: folderData.absolutePath
          },
        })
        resolve(folder);

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  updateFolderNameAndPath: async (folderData: (Folder | FolderData)): Promise<Folder> => {
    return new Promise<Folder>(async (resolve, reject) => {
      try {
        const folder: Folder = await prisma.folder.update({
          where: {
            uuid: folderData.uuid,
          },
          data: {
            name: folderData.name,
            absolutePath: folderData.absolutePath
          },
        })
        resolve(folder);

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  updateFolderSize: async (folderData: (Folder | FolderData)): Promise<Folder> => {
    return new Promise<Folder>(async (resolve, reject) => {
      try {
        const folder: Folder = await prisma.folder.update({
          where: {
            uuid: folderData.uuid,
          },
          data: {
            name: folderData.name,
            size: folderData.size
          },
        })
        resolve(folder);

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  incrementFolderSize: async (folderData: (Folder | FolderData)): Promise<Folder | void> => {
    return new Promise<Folder | void>(async (resolve, reject) => {
      try {
        const folder: Folder = await prisma.folder.update({
          where: {
            uuid: folderData.uuid,
          },
          data: {
            name: folderData.name,
            size: { increment: 1 }
          },
        })
        resolve(folder);

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  decrementFolderSize: async (folderData: (Folder | FolderData)): Promise<(Folder | void)> => {
    return new Promise<(Folder | void)>(async (resolve, reject) => {
      try {
        const folder: Folder = await prisma.folder.update({
          where: {
            uuid: folderData.uuid,
          },
          data: {
            name: folderData.name,
            size: { decrement: 1 }
          },
        })
        resolve(folder);

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  updateFolderIsRemoved: async (folderData: (Folder | FolderData)): Promise<Folder> => {
    return new Promise<Folder>(async (resolve, reject) => {
      try {
        const folder: Folder = await prisma.folder.update({
          where: {
            uuid: folderData.uuid,
          },
          data: {
            isRemoved: folderData.isRemoved!,
          },
        })
        resolve(folder);

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  deleteFoldersByFoldersUuids: async (folderUuids: string[]): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await prisma.folder.deleteMany({
          where: {
            uuid: { in: folderUuids }
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


export default folderServices;
