import fs from 'fs';
import path from 'path';

import { File } from '@prisma/client';
import { FileData } from '@/types/FileData';


const diskServices = {
  copyFileOnDisk: async (originalFile: (File | FileData), newFile: (File | FileData)): Promise<void> => {
    return new Promise<void>(async function(resolve, reject) {
      if (['png', 'webp', 'jpg', 'jpeg'].includes(path.parse(originalFile.name!).ext.substring(1))) {
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
  },

  deleteFileOnDisk: async (file: (File | FileData)): Promise<void> => {
    return new Promise<void>(async function(resolve, reject) {
      if (['png', 'webp', 'jpg', 'jpeg'].includes(path.parse(file.name!).ext.substring(1))) {
        fs.unlink('thumbnails/' + file.name + '.' + file.nameExtension, async (err: any) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            fs.unlink('uploads/' + file.name + '.' + file.nameExtension, async (err: any) => {
              if (err) {
                console.log(err);
                reject(err);
              } else {
                resolve();
              }
            })
          }
        })
      } else {
        fs.unlink('uploads/' + file.name + '.' + file.nameExtension, async (err: any) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            resolve();
          }
        })
      }
    })
  }

}

export default diskServices;
