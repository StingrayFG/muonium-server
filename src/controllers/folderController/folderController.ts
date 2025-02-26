import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

import { File, Folder } from '@prisma/client';
import { FolderData } from '@/types/FolderData';
import { FileData } from '@/types/FileData';

import fileServices from '@/services/fileServices';
import folderServices from '@/services/folderServices';
import bookmarkServices from '@/services/bookmarkServices';
import diskServices from '@/services/diskServices';



const folderController = {

  getFolderWithChildren: async (req: Request, res: Response): Promise<any> => {
    let folderWithChildren: FolderData = { 
      ...req.ogFolder!,
      folders: [],
      files: []
    };

    let foldersSearchFunction;
    let filesSearchFunction;
    
    if (req.body.folderData.uuid === 'trash') {
      foldersSearchFunction = () => folderServices.getRemovedFolders(req.ogDrive!);
      filesSearchFunction = () => fileServices.getRemovedFiles(req.ogDrive!);
    } else {
      foldersSearchFunction = () => folderServices.getFoldersByParent(req.ogFolder!, req.ogDrive!);
      filesSearchFunction = () => fileServices.getFilesByParent(req.ogFolder!, req.ogDrive!);
    }

    const getThumbnail = async (file: FileData): Promise<void> => {
      return new Promise<void>(async (resolve, reject) => {
        const image = await fs.promises.readFile('thumbnails/' + file.name + '.' + file.nameExtension, { encoding: 'base64' });
        file.thumbnail = image;
        resolve();
      })
    }

    await Promise.allSettled([
      await foldersSearchFunction()
      .then((folders: Folder[]) => {
        folderWithChildren.folders = folders.map(folder => ({ ...folder, type: 'folder' }))
      })
      .catch(() => {
        folderWithChildren.folders = [];
      }),

      await filesSearchFunction()
      .then(async (files: File[]) => {   
        await Promise.allSettled(
          files.map(async (file: FileData) => {
            const extension = path.parse(file.name!).ext.substring(1);
            if (['png', 'webp', 'jpg', 'jpeg'].includes(extension)) {
              return await getThumbnail(file);
            } else {
              return file;
            }         
          })
        )
        folderWithChildren.files = files.map(file => ({ ...file, type: 'file' }))
      })
      .catch(() => {
        folderWithChildren.files = [];
      })
    ])
    .then(async () => {
      const recalculatedSize = folderWithChildren.folders!.length + folderWithChildren.files!.length;

      if (folderWithChildren.size !== recalculatedSize) {
        if (!['home', 'trash', '', null].includes(folderWithChildren.uuid)) {
          await folderServices.updateFolderSize({
            ...folderWithChildren,
            size: folderWithChildren.folders!.length + folderWithChildren.files!.length
          })
        }
        return res.send({ folderData: { ...folderWithChildren, size: recalculatedSize } });
      } else {
        return res.send({ folderData: folderWithChildren });
      }
    })
    .catch((err: any) => {
      console.log(err)
      return res.sendStatus(500);
    }) 
  },

  createFolder: async (req: Request, res: Response): Promise<any> => {
    delete req.body.folderData.type
    await folderServices.createFolder({
      ...req.body.folderData,

      uuid: crypto.randomUUID(),

      ownerUuid: req.ogUser!.uuid,
      driveUuid: req.ogDrive!.uuid,
      parentUuid: req.ogParentFolder!.uuid,

      absolutePath: req.ogParentFolder!.absolutePath + '/' + req.body.folderData.name, 
    })
    .then(async (folderData: Folder) => {
      await folderServices.incrementFolderSize({ uuid: req.ogParentFolder!.uuid });
      return res.send({ folderData });
    }) 
    .catch((err) => {
      console.log(err)
      return res.sendStatus(500);
    }) 
  },

  renameFolder: async (req: Request, res: Response): Promise<any> => {
    const modificationDate = Date.now();

    const originalFolder: Folder = req.ogFolder!;
    req.body.folderData.absolutePath = req.ogParentFolder!.absolutePath + '/' + req.body.folderData.name;
    req.body.folderData.modificationDate = new Date(modificationDate); 


    const getNewAbsolutePath = (childFolder: FolderData): string => {
      return req.body.folderData.absolutePath + childFolder.absolutePath!.slice(originalFolder.absolutePath!.length, childFolder.absolutePath!.length);
    }
    
    await folderServices.updateFolderNameAndPath(req.body.folderData)
    .then(async (folderData: Folder) => {
      await folderServices.getFoldersByPathBeginning(originalFolder, req.ogDrive!)
      .then(async (folders: Folder[]) => {
        folders = folders.map(childFolder => ({ ...childFolder, absolutePath: getNewAbsolutePath(childFolder) }))

        await Promise.allSettled(
          folders.map(async (folder: Folder) => {
            return await folderServices.updateFolderNameAndPath(folder);
          })
        )
        .then(() => {
          return res.send({ folderData });
        })
      })
    })    
    .catch((err: any) => {
      console.log(err)
      return res.sendStatus(500);
    }) 
  },

  moveFolder: async (req: Request, res: Response): Promise<any> => {
    const originalFolder: Folder = req.ogFolder!;
    req.body.folderData.absolutePath = req.ogParentFolder!.absolutePath + '/' + req.body.folderData.name;

    const getNewAbsolutePath = (childFolder: FolderData): string => {
      return req.body.folderData.absolutePath + childFolder.absolutePath!.slice(originalFolder.absolutePath!.length, childFolder.absolutePath!.length);
    }
    
    await folderServices.updateFolderParentAndPath(req.body.folderData)
    .then(async (folderData: Folder) => {
      await folderServices.getFoldersByPathBeginning(req.ogFolder!, req.ogDrive!)
      .then(async (folders: Folder[]) => {
        folders = folders.map(childFolder => ({ ...childFolder, absolutePath: getNewAbsolutePath(childFolder) }))

        await Promise.allSettled(
          folders.map(async folder => {
            return await folderServices.updateFolderParentAndPath(folder);
          })
        )
        .then(async () => {
          await folderServices.decrementFolderSize({ uuid: originalFolder.parentUuid! });
          await folderServices.incrementFolderSize({ uuid: req.body.folderData.uuid });
          return res.send({ folderData });
        })
      })
    })    
    .catch((err: any) => {
      console.log(err)
      return res.sendStatus(500);
    }) 
  },

  removeFolder: async (req: Request, res: Response): Promise<any> => {
    await folderServices.updateFolderIsRemoved({ ...req.body.folderData, isRemoved: true })
    .then(async (folderData: Folder) => {
      await folderServices.decrementFolderSize({ uuid: req.body.folderData.parentUuid });
      return res.send({ folderData });
    }) 
    .catch((err: any) => {
      console.log(err)
      return res.sendStatus(500);
    })
  },

  recoverFolder: async (req: Request, res: Response): Promise<any> => {
    await folderServices.updateFolderIsRemoved({ ...req.body.folderData, isRemoved: false })
    .then(async (folderData: Folder) => {
      await folderServices.incrementFolderSize({ uuid: req.body.folderData.parentUuid });
      return res.send({ folderData });
    }) 
    .catch((err: any) => {
      console.log(err)
      return res.sendStatus(500);
    })
  },

  deleteFolder: async (req: Request, res: Response): Promise<any> => {
    let foldersToDeleteUuids: string[] = [req.ogFolder!.uuid];

    const findChildren = async (parentFolder: Folder): Promise<void> => {
      return new Promise<void>(async function(resolve, reject) {
        await folderServices.getFoldersByParent(parentFolder, req.body.driveData)
        .then(async (folders: Folder[]) => {
          if (folders.length > 0) {
            await Promise.allSettled(
              folders.map(async folder => {
                await findChildren(folder);
              })
            )
          }
          foldersToDeleteUuids = [...foldersToDeleteUuids, ...folders.map(childFolder => childFolder.uuid)];       
          resolve();
        })
        .catch((err: any) => {
          console.log(err);
          resolve();
        })
      })
    }

    const deleteFiles = async (): Promise<void> => {
      return new Promise<void>(async function(resolve, reject) {
        await fileServices.getFilesByParentUuids(foldersToDeleteUuids)
        .then(async (files: File[]) => {
          await fileServices.deleteFilesByParentUuids(foldersToDeleteUuids)
          .then(async () => {
            await Promise.allSettled(
              files.map(async (file: File) => {
                return await diskServices.deleteFileOnDisk(file);
              })
            )
            resolve(); 
          })
        })
        .catch((err: any) => {
          reject(err);
        })
      })
    }

    await findChildren(req.ogFolder!)
    .then(async () => {
      await Promise.allSettled([
        await bookmarkServices.deleteBookmarksByFoldersUuids(req.ogUser!, foldersToDeleteUuids),
        await folderServices.deleteFoldersByFoldersUuids(foldersToDeleteUuids),
        await deleteFiles()
      ])
      .then(() => {
        return res.send({ folderData: req.ogFolder });
      })
    })
    .catch((err: any) => {
      console.log(err);
      return res.sendStatus(500);
    })
  }
}

export default folderController;
