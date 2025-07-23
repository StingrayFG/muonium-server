import fs from 'fs';
import path from 'path';

import { File } from '@prisma/client';
import { FileData } from '@/types/FileData';


const diskServices = {
  copyFileOnDisk: async (originalFile: (File | FileData), newFile: (File | FileData)): Promise<void> => {
    return new Promise<void>(async function(resolve, reject) {

      const moveFileWithThumbnail = async (): Promise<void> => {
        return new Promise<void>(async function(resolve, reject) {
          fs.copyFile('thumbnails/' + originalFile.name + '.' + originalFile.nameExtension, 
          'thumbnails/' + newFile.name + '.' + newFile.nameExtension, async (err: any) => {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              fs.copyFile('uploads/' + originalFile.name + '.' + originalFile.nameExtension, 
              'uploads/' + newFile.name + '.' + newFile.nameExtension, async (err: any) => {
                if (err) {
                  console.log(err);
                  reject(err);
                } else {
                  resolve();
                }
              })
            }
          })
        })
      }

      const moveFile = async (): Promise<void> => {
        return new Promise<void>(async function(resolve, reject) {
          fs.copyFile('uploads/' + originalFile.name + '.' + originalFile.nameExtension, 
          'uploads/' + newFile.name + '.' + newFile.nameExtension, async (err: any) => {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              resolve();
            }
          })
        })
      }

      try {
        const fileExtension = path.parse(originalFile.name!).ext.substring(1)

        if (['png', 'webp', 'jpg', 'jpeg'].includes(fileExtension)) {
          await moveFileWithThumbnail();
        } else {
          await moveFile();
        }

        resolve();

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  deleteFileOnDisk: async (file: (File | FileData)): Promise<void> => {
    return new Promise<void>(async function(resolve, reject) {

      const deleteFileWithThumbnail = async (): Promise<void> => {
        return new Promise<void>(async function(resolve, reject) {
          fs.unlink('thumbnails/' + file.name + '.' + file.nameExtension, async (err: any) => {
            if (err) {
              console.log(err);
              reject(err);
  
            } else {
              fs.unlink('uploads/' + file.name + '.' + file.nameExtension, async (err: any) => {
                if (err) {
                  console.log(err);
                  throw err;;
                } else {
                  resolve();
                }
              })
            }
          })
        })
      }

      const deleteFile = async (): Promise<void> => {
        return new Promise<void>(async function(resolve, reject) {
          fs.unlink('uploads/' + file.name + '.' + file.nameExtension, async (err: any) => {
            if (err) {
              console.log(err);
              reject(err);  

            } else {
              resolve();
            }
          })
        })
      }

      try {
        const fileExtension = path.parse(file.name!).ext.substring(1)

        if (['png', 'webp', 'jpg', 'jpeg'].includes(fileExtension)) {
          await deleteFileWithThumbnail();
        } else {
          await deleteFile();
        }

        resolve();

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  }

}


export default diskServices;
