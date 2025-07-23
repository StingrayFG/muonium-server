import { File } from '@prisma/client';

import { instance as prisma } from '@/instances/prisma'

import { FileData } from '@/types/FileData';
import { UuidOnly } from '@/types/UuidOnly';


const fileServices = {

  checkIfNameIsAlreadyUsed: async (fileData: (File | FileData)): Promise<boolean> => {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        const file: File | null = await prisma.file.findFirst({
          where: {
            name: fileData.name,
            parentUuid: fileData.parentUuid,
            isRemoved: false,
          },
        })
  
        if (file) {
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

  getFile: async (fileData: UuidOnly): Promise<File> => {
    return new Promise<File>(async (resolve, reject) => {
      try {
        const file: File | null = await prisma.file.findUnique({
          where: {
            uuid: fileData.uuid
          }
        })
  
        if (file) {
          resolve(file);
        } else {
          reject(404);
        }
      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  getFilesByParent: async (parentFolderData: UuidOnly, driveData: UuidOnly): Promise<File[]> => {
    return new Promise<File[]>(async (resolve, reject) => {
      try {
        const files: File[] = await prisma.file.findMany({
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
        resolve(files);

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  getFilesByParentUuids: async (parentUuids: string[]): Promise<File[]> => {
    return new Promise<File[]>(async (resolve, reject) => {
      try {
        const files: File[] = await prisma.file.findMany({
          where: {
            parentUuid: { in: parentUuids }
          },
        })
        resolve(files);
        
      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  getRemovedFiles: async (driveData: UuidOnly): Promise<File[]> => {
    return new Promise<File[]>(async (resolve, reject) => {
      try {
        const files: File[] = await prisma.file.findMany({
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
        resolve(files);
        
      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  createFile: async (fileData: File): Promise<File> => {
    return new Promise<File>(async (resolve, reject) => {
      try {
        const file: File = await prisma.file.create({
          data: fileData
        })
        resolve(file);

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  updateFileName: async (fileData: (File | FileData)): Promise<File> => {
    return new Promise<File>(async (resolve, reject) => {
      try {
        const file: File = await prisma.file.update({
          where: {
            uuid: fileData.uuid,
          },
          data: {
            name: fileData.name,
            nameExtension: fileData.nameExtension,
            modificationDate: fileData.modificationDate,
          },
        })
        resolve(file);
        
      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  updateFileParent: async (fileData: (File | FileData)): Promise<File> => {
    return new Promise<File>(async (resolve, reject) => {
      try {
        const file: File = await prisma.file.update({
          where: {
            uuid: fileData.uuid,
          },
          data: {
            parentUuid: fileData.parentUuid,
          },
        })
        resolve(file);
        
      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  updateFileIsRemoved: async (fileData: (File | FileData)): Promise<File> => {
    return new Promise<File>(async (resolve, reject) => {
      try {
        const file: File = await prisma.file.update({
          where: {
            uuid: fileData.uuid,
          },
          data: {
            isRemoved: fileData.isRemoved!,
          },
        })
        resolve(file);
        
      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  deleteFile: async (fileData: UuidOnly): Promise<File> => {
    return new Promise<File>(async (resolve, reject) => {
      try {
        const file: File =await prisma.file.delete({
          where: {
            uuid: fileData.uuid,
          },
        })
        resolve(file);
        
      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  deleteFilesByParentUuids: async (parentUuids: string[]): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await prisma.file.deleteMany({
          where: {
            parentUuid: { in: parentUuids }
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


export default fileServices;
