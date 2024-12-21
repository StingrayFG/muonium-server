import { Folder } from '@prisma/client';

import { instance as prisma } from '@/instances/prisma'

import { FolderData } from '@/types/FolderData';
import { UuidOnly } from '@/types/UuidOnly';
import { BatchPayload } from '@/types/prisma/BatchPayload';


const folderService = {

  checkIfNameIsAlreadyUsed: async (folderData: (Folder | FolderData)): Promise<boolean> => {
    return new Promise<boolean>(async (resolve, reject) => {
      await prisma.folder.findFirst({
        where: {
          name: folderData.name,
          parentUuid: folderData.parentUuid,
          isRemoved: false
        },
      })
      .then((folder: (Folder | null)) => {
        if (folder) {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch((err: any) => {
        reject();
      })
    })
  },

  getParentFolder: async (childData: (Folder | FolderData)): Promise<(Folder | null)> => {
    return new Promise<(Folder | null)>(async (resolve, reject) => {
      if (childData.parentUuid) {
        await prisma.folder.findUnique({
          where: {
            uuid: childData.parentUuid
          }
        })
        .then((folder: (Folder | null)) => {
          resolve(folder); 
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

  getFolderByUuid: async (folderData: UuidOnly): Promise<(Folder | null)> => {
    return new Promise<(Folder | null)>(async (resolve, reject) => {
      await prisma.folder.findUnique({
        where: {
          uuid: folderData.uuid
        }
      })
      .then((folder: (Folder | null)) => {
        resolve(folder); 
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })
    })
  },

  getFolderByPath: async (folderData: (Folder | FolderData), driveData: UuidOnly): Promise<(Folder | null)> => {
    return new Promise<(Folder | null)>(async (resolve, reject) => {
      await prisma.folder.findFirst({
        where: {
          driveUuid: driveData.uuid,
          absolutePath: folderData.absolutePath
        }
      })
      .then((folder: (Folder | null)) => {
        resolve(folder); 
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })
    })
  },

  getFoldersByParent: async (parentFolderData: (Folder | FolderData), driveData: UuidOnly): Promise<Folder[]> => {
    return new Promise<Folder[]>(async (resolve, reject) => {
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
      .then((folders: (Folder[])) => {
        resolve(folders); 
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })
    })
  },

  getFoldersByPathBeginning: async (parentFolderData: (Folder | FolderData), driveData: UuidOnly): Promise<Folder[]> => {
    return new Promise<Folder[]>(async (resolve, reject) => {
      if (parentFolderData.absolutePath) {
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
        .then((folders: (Folder[])) => {
          resolve(folders); 
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

  getRemovedFolders: async (driveData: UuidOnly): Promise<Folder[]> => {
    return new Promise<Folder[]>(async (resolve, reject) => {
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
      .then((folders: (Folder[])) => {
        resolve(folders); 
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })
    })
  },

  createFolder: async (folderData: Folder): Promise<Folder> => {
    return new Promise<Folder>(async (resolve, reject) => {
      await prisma.folder.create({
        data: folderData
      })
      .then((folder: Folder) => {
        resolve(folder);
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })
    })
  },

  updateFolderParentAndPath: async (folderData: (Folder | FolderData)): Promise<Folder> => {
    return new Promise<Folder>(async (resolve, reject) => {
      await prisma.folder.update({
        where: {
          uuid: folderData.uuid,
        },
        data: {
          parentUuid: folderData.parentUuid,
          absolutePath: folderData.absolutePath
        },
      })
      .then((folder: Folder) => {
        resolve(folder); 
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })
    })
  },

  updateFolderNameAndPath: async (folderData: (Folder | FolderData)): Promise<Folder> => {
    return new Promise<Folder>(async (resolve, reject) => {
      await prisma.folder.update({
        where: {
          uuid: folderData.uuid,
        },
        data: {
          name: folderData.name,
          absolutePath: folderData.absolutePath
        },
      })
      .then((folder: Folder) => {
        resolve(folder); 
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })
    })
  },

  updateFolderSize: async (folderData: (Folder | FolderData)): Promise<Folder> => {
    return new Promise<Folder>(async (resolve, reject) => {
      if (folderData.uuid && !['home', 'trash', '', null].includes(folderData.uuid)) {
        await prisma.folder.update({
          where: {
            uuid: folderData.uuid,
          },
          data: {
            name: folderData.name,
            size: folderData.size
          },
        })
        .then((folder: Folder) => {
          resolve(folder); 
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

  incrementFolderSize: async (folderData: (Folder | FolderData)): Promise<Folder> => {
    return new Promise<Folder>(async (resolve, reject) => {
      if (folderData.uuid && !['home', 'trash', '', null].includes(folderData.uuid)) {
        await prisma.folder.update({
          where: {
            uuid: folderData.uuid,
          },
          data: {
            name: folderData.name,
            size: { increment: 1 }
          },
        })
        .then((folder: Folder) => {
          resolve(folder); 
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

  decrementFolderSize: async (folderData: (Folder | FolderData)): Promise<Folder> => {
    return new Promise<Folder>(async (resolve, reject) => {
      if (folderData.uuid && !['home', 'trash', '', null].includes(folderData.uuid)) {
        await prisma.folder.update({
          where: {
            uuid: folderData.uuid,
          },
          data: {
            name: folderData.name,
            size: { decrement: 1 }
          },
        })
        .then((folder: Folder) => {
          resolve(folder); 
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

  updateFolderIsRemoved: async (folderData: (Folder | FolderData)): Promise<Folder> => {
    return new Promise<Folder>(async (resolve, reject) => {
      await prisma.folder.update({
        where: {
          uuid: folderData.uuid,
        },
        data: {
          isRemoved: folderData.isRemoved!,
        },
      })
      .then((folder: Folder) => {
        resolve(folder); 
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })
    })
  },

  deleteFoldersByFoldersUuids: async (folderUuids: string[]): Promise<number> => {
    return new Promise<number>(async (resolve, reject) => {
      await prisma.folder.deleteMany({
        where: {
          uuid: { in: folderUuids }
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

export default folderService;
