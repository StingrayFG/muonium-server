import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

import { File, Folder } from '@prisma/client';
import { FolderData } from '@/types/FolderData';
import { FileData } from '@/types/FileData';

import fileService from '@/services/fileService';
import folderService from '@/services/folderService';
import bookmarkService from '@/services/bookmarkService';
import diskService from '@/services/diskService';



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
      foldersSearchFunction = () => folderService.getRemovedFolders(req.ogDrive!);
      filesSearchFunction = () => fileService.getRemovedFiles(req.ogDrive!);
    } else {
      foldersSearchFunction = () => folderService.getFoldersByParent(req.ogFolder!, req.ogDrive!);
      filesSearchFunction = () => fileService.getFilesByParent(req.ogFolder!, req.ogDrive!);
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
          await folderService.updateFolderSize({
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
    await folderService.createFolder({
      ...req.body.folderData,

      uuid: crypto.randomUUID(),

      ownerUuid: req.ogUser!.uuid,
      driveUuid: req.ogDrive!.uuid,
      parentUuid: req.ogParentFolder!.uuid,

      absolutePath: req.ogParentFolder!.absolutePath + '/' + req.body.folderData.name, 
    })
    .then(async (folderData: Folder) => {
      await folderService.incrementFolderSize({ uuid: req.ogParentFolder!.uuid });
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
    
    await folderService.updateFolderNameAndPath(req.body.folderData)
    .then(async (folderData: Folder) => {
      await folderService.getFoldersByPathBeginning(originalFolder, req.ogDrive!)
      .then(async (folders: Folder[]) => {
        folders = folders.map(childFolder => ({ ...childFolder, absolutePath: getNewAbsolutePath(childFolder) }))

        await Promise.allSettled(
          folders.map(async (folder: Folder) => {
            return await folderService.updateFolderNameAndPath(folder);
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
    
    await folderService.updateFolderParentAndPath(req.body.folderData)
    .then(async (folderData: Folder) => {
      await folderService.getFoldersByPathBeginning(req.ogFolder!, req.ogDrive!)
      .then(async (folders: Folder[]) => {
        folders = folders.map(childFolder => ({ ...childFolder, absolutePath: getNewAbsolutePath(childFolder) }))

        await Promise.allSettled(
          folders.map(async folder => {
            return await folderService.updateFolderParentAndPath(folder);
          })
        )
        .then(async () => {
          await folderService.decrementFolderSize({ uuid: originalFolder.parentUuid! });
          await folderService.incrementFolderSize({ uuid: req.body.folderData.uuid });
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
    await folderService.updateFolderIsRemoved({ ...req.body.folderData, isRemoved: true })
    .then(async (folderData: Folder) => {
      await folderService.decrementFolderSize({ uuid: req.body.folderData.parentUuid });
      return res.send({ folderData });
    }) 
    .catch((err: any) => {
      console.log(err)
      return res.sendStatus(500);
    })
  },

  recoverFolder: async (req: Request, res: Response): Promise<any> => {
    await folderService.updateFolderIsRemoved({ ...req.body.folderData, isRemoved: false })
    .then(async (folderData: Folder) => {
      await folderService.incrementFolderSize({ uuid: req.body.folderData.parentUuid });
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
        await folderService.getFoldersByParent(parentFolder, req.body.driveData)
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
        await fileService.getFilesByParentUuids(foldersToDeleteUuids)
        .then(async (files: File[]) => {
          await fileService.deleteFilesByParentUuids(foldersToDeleteUuids)
          .then(async () => {
            await Promise.allSettled(
              files.map(async (file: File) => {
                return await diskService.deleteFileOnDisk(file);
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
        await bookmarkService.deleteBookmarksByFoldersUuids(req.ogUser!, foldersToDeleteUuids),
        await folderService.deleteFoldersByFoldersUuids(foldersToDeleteUuids),
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
