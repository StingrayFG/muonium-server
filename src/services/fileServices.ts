import { File } from '@prisma/client';

import { instance as prisma } from '@/instances/prisma'

import { FileData } from '@/types/FileData';
import { UuidOnly } from '@/types/UuidOnly';
import { BatchPayload } from '@/types/prisma/BatchPayload';


const fileServices = {

  checkIfNameIsAlreadyUsed: async (fileData: (File | FileData)): Promise<boolean> => {
    return new Promise<boolean>(async (resolve, reject) => {
      await prisma.file.findFirst({
        where: {
          name: fileData.name,
          parentUuid: fileData.parentUuid,
          isRemoved: false,
        },
      })
      .then((file: (File | null)) => {
        if (file) {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })  
    })
  },

  getFile: async (fileData: UuidOnly): Promise<(File | null)> => {
    return new Promise<(File | null)>(async (resolve, reject) => {
      await prisma.file.findUnique({
        where: {
          uuid: fileData.uuid
        }
      })
      .then((file: (File | null)) => {
        resolve(file);
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })  
    })
  },

  getFilesByParent: async (parentFolderData: UuidOnly, driveData: UuidOnly): Promise<File[]> => {
    return new Promise<File[]>(async (resolve, reject) => {
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
      .then((files: File[]) => {
        resolve(files);
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })  
    })
  },

  getFilesByParentUuids: async (parentUuids: string[]): Promise<File[]> => {
    return new Promise<File[]>(async (resolve, reject) => {
      await prisma.file.findMany({
        where: {
          parentUuid: { in: parentUuids }
        },
      })
      .then((files: File[]) => {
        resolve(files);
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })  
    })
  },

  getRemovedFiles: async (driveData: UuidOnly): Promise<File[]> => {
    return new Promise<File[]>(async (resolve, reject) => {
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
      .then((files: File[]) => {
        resolve(files);
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })  
    })
  },

  createFile: async (fileData: File): Promise<File> => {
    return new Promise<File>(async (resolve, reject) => {
      await prisma.file.create({
        data: fileData
      })
      .then((file: File) => {
        if (file) {
          resolve(file);
        } else {
          reject();
        }    
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })  
    })
  },

  updateFileName: async (fileData: (File | FileData)): Promise<File> => {
    return new Promise<File>(async (resolve, reject) => {
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
      .then((file: File) => {
        resolve(file)
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })  
    })
  },

  updateFileParent: async (fileData: (File | FileData)): Promise<File> => {
    return new Promise<File>(async (resolve, reject) => {
      await prisma.file.update({
        where: {
          uuid: fileData.uuid,
        },
        data: {
          parentUuid: fileData.parentUuid,
        },
      })
      .then((file: File) => {
        resolve(file)
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })  
    })
  },

  updateFileIsRemoved: async (fileData: (File | FileData)): Promise<File> => {
    return new Promise<File>(async (resolve, reject) => {
      await prisma.file.update({
        where: {
          uuid: fileData.uuid,
        },
        data: {
          isRemoved: fileData.isRemoved!,
        },
      })
      .then((file: File) => {
        resolve(file)
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })  
    })
  },

  deleteFile: async (fileData: UuidOnly): Promise<File> => {
    return new Promise<File>(async (resolve, reject) => {
      await prisma.file.delete({
        where: {
          uuid: fileData.uuid,
        },
      })
      .then((file: File) => {
        resolve(file)
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })  
    })
  },

  deleteFilesByParentUuids: async (parentUuids: string[]): Promise<number> => {
    return new Promise<number>(async (resolve, reject) => {
      await prisma.file.deleteMany({
        where: {
          parentUuid: { in: parentUuids }
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

export default fileServices;
