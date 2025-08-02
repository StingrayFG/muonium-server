import ffmpeg from 'ffmpeg-static';
import { spawn } from 'child_process';
import sharp from 'sharp';
import fs from 'fs'
import path from 'path';

import { FileData } from '@/types/FileData';

import config from '@/config.json';
import extensions from '@/extensions.json';


const fileUtils = {

  getThumbnail: async (file: FileData): Promise<string> => {
    return new Promise<string>(async (resolve, reject) => {
      try {
        const ext = path.parse(file.name!).ext.substring(1).toLowerCase();
            
        if (extensions.image.includes(ext) || extensions.video.includes(ext) || extensions.audio.includes(ext)) {
          const thumbnailPath = `thumbnails/${path.parse(file.name!).name}.png.${file.nameExtension}`
        
          const image = await fs.promises.readFile(thumbnailPath, { encoding: 'base64' });
  
          resolve(image);

        } else {
          reject();
        }
      } catch (e) {
        reject();
      }
    })
  },
  
  generateImageThumbnail: (imageInputPath: string, initialThumbnailPath: string, finalThumbnailPath: string) => { 
    return new Promise<void>(async function(resolve, reject) {
      try {
        const image = sharp(imageInputPath);

        const metadata = await image.metadata();

        if ((metadata.width! > config.thumbnailSize) || (metadata.height! > config.thumbnailSize)) {
          if (metadata.width! > metadata.height!) { 
            image.resize({ width: config.thumbnailSize });
          } else {
            image.resize({ height: config.thumbnailSize });
          }      
        }

        await image.toFile(initialThumbnailPath);

        await fs.promises.rename(initialThumbnailPath, finalThumbnailPath);

        resolve();

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  generateVideoThumbnail: (videoInputPath: string, initialThumbnailPath: string, finalThumbnailPath: string) => { 
    return new Promise<void>(async function(resolve, reject) {
      try {
        const ffmpegArgs = [
          '-ss', '1',
          '-i', videoInputPath,
          '-frames:v', '1',
          `${finalThumbnailPath}.temp.png`
        ];
    
        const ffmpegProcess = spawn(ffmpeg!, ffmpegArgs);
    
        ffmpegProcess.on('error', (err: any) => {
          console.log(`ffmpeg error: ${err}`)
          reject(err);
        });
    
        ffmpegProcess.on('close', async (code: any) => {
          if (code === 0) {
            const image = sharp(`${finalThumbnailPath}.temp.png`); // open the temporary screenshot

            const metadata = await image.metadata();

            if ((metadata.width! > config.thumbnailSize) || (metadata.height! > config.thumbnailSize)) {
              if (metadata.width! > metadata.height!) { 
                image.resize({ width: config.thumbnailSize });
              } else {
                image.resize({ height: config.thumbnailSize });
              }      
            }

            await image.toFile(initialThumbnailPath); // save the thumbnail generated from the screenshot as a png file

            await fs.promises.unlink(`${finalThumbnailPath}.temp.png`); // remove the screenshot

            await fs.promises.rename(initialThumbnailPath, finalThumbnailPath);

            resolve();
          } else {
            console.log(`ffmpeg code: ${code}`)
            reject(code);
          }
        });

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  generateAudioThumbnail: (videoInputPath: string, initialThumbnailPath: string, finalThumbnailPath: string) => { 
    return new Promise<void>(async function(resolve, reject) {
      try {
        const ffmpegArgs = [
          '-ss', '1',
          '-i', videoInputPath,
          '-an', '-vcodec', 'copy',
          `${finalThumbnailPath}.temp.png`
        ];
    
        const ffmpegProcess = spawn(ffmpeg!, ffmpegArgs);
    
        ffmpegProcess.on('error', (err: any) => {
          console.log(`ffmpeg error: ${err}`)
          reject(err);
        });
    
        ffmpegProcess.on('close', async (code: any) => {
          if (code === 0) {
            const image = sharp(`${finalThumbnailPath}.temp.png`); // open the temporary screenshot

            const metadata = await image.metadata();

            if ((metadata.width! > config.thumbnailSize) || (metadata.height! > config.thumbnailSize)) {
              if (metadata.width! > metadata.height!) { 
                image.resize({ width: config.thumbnailSize });
              } else {
                image.resize({ height: config.thumbnailSize });
              }      
            }

            await image.toFile(initialThumbnailPath); // save the thumbnail generated from the screenshot as a png file

            await fs.promises.unlink(`${finalThumbnailPath}.temp.png`); // remove the screenshot

            await fs.promises.rename(initialThumbnailPath, finalThumbnailPath);

            resolve();
          } else {
            console.log(`ffmpeg code: ${code}`)
            reject(code);
          }
        });

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },
}

export default fileUtils; 