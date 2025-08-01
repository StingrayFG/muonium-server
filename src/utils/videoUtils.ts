import ffmpeg from 'ffmpeg-static';
import { spawn } from 'child_process';
import sharp from 'sharp';
import fs from 'fs'

import config from '@/config.json';


const videoUtils = {
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
}

export default videoUtils; 