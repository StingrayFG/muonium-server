import fs from 'fs';
import path from 'path';

import { File } from '@prisma/client';
import { FileData } from '@/types/FileData';

import extensions from '@/extensions.json';


const diskUtils = {
  copyFileOnDisk: async (originalFile: (File | FileData), newFile: (File | FileData)): Promise<void> => {
    return new Promise<void>(async function(resolve, reject) {

      const moveFileThumbnail = async (): Promise<void> => {
        return new Promise<void>(async function(resolve, reject) {
          try {
            const originalThumbnailName = `${path.parse(originalFile.name!).name}.png`
            const newThumbnailName = `${path.parse(newFile.name!).name}.png`
  
            await fs.promises.copyFile(`thumbnails/${originalThumbnailName}.${originalFile.nameExtension}`, 
            `thumbnails/${newThumbnailName}.${newFile.nameExtension}`) 
            
            resolve();

          } catch(err: any) {
            console.log(err);
            reject(err);
          }
        })
      }

      const moveFile = async (): Promise<void> => {
        return new Promise<void>(async function(resolve, reject) {
          try {
            fs.promises.copyFile(`uploads/${originalFile.name}.${originalFile.nameExtension}`, 
            `uploads/${newFile.name}.${newFile.nameExtension}`)
            
            resolve();

          } catch(err: any) {
            console.log(err);
            reject(err);
          }
        })
      }

      try {
        const ext = path.parse(originalFile.name!).ext.substring(1).toLowerCase();

        if (extensions.image.includes(ext) || extensions.video.includes(ext) || extensions.audio.includes(ext)) {
          await moveFileThumbnail();
          await moveFile();
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

      const deleteFileThumbnail = async (): Promise<void> => {
        return new Promise<void>(async function(resolve, reject) {
          try {
            fs.promises.unlink(`uploads/${file.name}.${file.nameExtension}`)
            
            resolve();

          } catch(err: any) {
            console.log(err);
            reject(err);
          }
        })
      }

      const deleteFile = async (): Promise<void> => {
        return new Promise<void>(async function(resolve, reject) {
          try {
            fs.promises.unlink(`thumbnails/${file.name}.${file.nameExtension}`)
            
            resolve();

          } catch(err: any) {
            console.log(err);
            reject(err);
          }
        })
      }

      try {
        const ext = path.parse(file.name!).ext.substring(1).toLowerCase();

        if (extensions.image.includes(ext) || extensions.video.includes(ext) || extensions.audio.includes(ext)) {
          await deleteFile();
          await deleteFileThumbnail();
        } else {
          await deleteFile();
        }

        resolve();

      } catch (err: any) {
        console.log(err);
        /* resolve even if there was an error, since the file data 
        would've been already deleted from the database by the moment this function gets called */
        resolve();
      }
    })
  }

}


export default diskUtils;
