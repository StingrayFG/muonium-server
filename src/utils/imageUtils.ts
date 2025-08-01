import sharp from 'sharp';
import fs from 'fs';

import config from '@/config.json';


const imageUtils = {
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
}

export default imageUtils; 