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
    try {
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

      const assembleFiles = async (files: File[]): Promise<File[]> => {
        await Promise.allSettled(
          files.map(async (file: File) => {
            const extension = path.parse(file.name!).ext.substring(1);
            
            if (['png', 'webp', 'jpg', 'jpeg'].includes(extension)) {
              return await getThumbnail(file);
            } else {
              return;
            }         
          })
        )
        return files.map(file => ({ ...file, type: 'file' }))
      }

      const assembleFolders = async (folders: Folder[]): Promise<Folder[]> => {
        return folders.map(folder => ({ ...folder, type: 'folder' }))
      }

      await Promise.allSettled([
        await foldersSearchFunction()
        .then(async (folders: Folder[]) => {
          folderWithChildren.folders = await assembleFolders(folders);
        })
        .catch(() => {
          folderWithChildren.folders = [];
        }),

        await filesSearchFunction()
        .then(async (files: File[]) => {   
          folderWithChildren.files = await assembleFiles(files)
        })
        .catch(() => {
          folderWithChildren.files = [];
        })
      ])

      const recalculatedSize = folderWithChildren.folders!.length + folderWithChildren.files!.length;

      if ((folderWithChildren.size !== recalculatedSize) &&
      (!['home', 'trash', '', null].includes(folderWithChildren.uuid))) {
        await folderServices.updateFolderSize({
          ...folderWithChildren,
          size: folderWithChildren.folders!.length + folderWithChildren.files!.length
        })

        folderWithChildren.size = recalculatedSize;
      }
      
      return res.send({ folderData: folderWithChildren });

    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
    }
  },

  createFolder: async (req: Request, res: Response): Promise<any> => {
    try {
      delete req.body.folderData.type;
      delete req.body.folderData.folders;
      delete req.body.folderData.files;

      const folderData: Folder = await folderServices.createFolder({
        ...req.body.folderData,
  
        uuid: crypto.randomUUID(),
  
        ownerUuid: req.ogUser!.uuid,
        driveUuid: req.ogDrive!.uuid,
        parentUuid: req.ogParentFolder!.uuid,
  
        absolutePath: req.ogParentFolder!.absolutePath + '/' + req.body.folderData.name, 
      })
  
      await folderServices.incrementFolderSize({ uuid: req.ogParentFolder!.uuid });

      return res.send({ folderData });

    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
    }
  },

  renameFolder: async (req: Request, res: Response): Promise<any> => {
    try {
      const modificationDate = Date.now();

      const originalFolder: Folder = req.ogFolder!;
      req.body.folderData.absolutePath = req.ogParentFolder!.absolutePath + '/' + req.body.folderData.name;
      req.body.folderData.modificationDate = new Date(modificationDate); 
  
      const getNewAbsolutePath = (childFolder: FolderData): string => {
        return req.body.folderData.absolutePath + childFolder.absolutePath!.slice(originalFolder.absolutePath!.length, childFolder.absolutePath!.length);
      }

      const folderData: Folder = await folderServices.updateFolderNameAndPath(req.body.folderData);

      const folders: Folder[] = await folderServices.getFoldersByPathBeginning(originalFolder, req.ogDrive!);

      const updatedFolders = folders.map(childFolder => ({ ...childFolder, absolutePath: getNewAbsolutePath(childFolder) }))

      await Promise.allSettled(
        updatedFolders.map(async (folder: Folder) => {
          return await folderServices.updateFolderNameAndPath(folder);
        })
      )

      return res.send({ folderData });

    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
    }
  },

  moveFolder: async (req: Request, res: Response): Promise<any> => {
    try {
      const originalFolder: Folder = req.ogFolder!;
      req.body.folderData.absolutePath = req.ogParentFolder!.absolutePath + '/' + req.body.folderData.name;
  
      const getNewAbsolutePath = (childFolder: FolderData): string => {
        return req.body.folderData.absolutePath + childFolder.absolutePath!.slice(originalFolder.absolutePath!.length, childFolder.absolutePath!.length);
      }

      const folderData: Folder = await folderServices.updateFolderParentAndPath(req.body.folderData)

      const folders: Folder[] = await folderServices.getFoldersByPathBeginning(req.ogFolder!, req.ogDrive!)

      const updatedFolders: Folder[] = folders.map(childFolder => ({ 
        ...childFolder, 
        absolutePath: getNewAbsolutePath(childFolder) 
      }));

      await Promise.allSettled(
        updatedFolders.map(async folder => {
          return await folderServices.updateFolderParentAndPath(folder);
        })
      )

      await folderServices.decrementFolderSize({ uuid: originalFolder.parentUuid! });

      await folderServices.incrementFolderSize({ uuid: req.body.folderData.uuid });

      return res.send({ folderData });

    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
    }
  },

  removeFolder: async (req: Request, res: Response): Promise<any> => {
    try {
      const folderData: Folder = await folderServices.updateFolderIsRemoved({ ...req.body.folderData, isRemoved: true })

      await folderServices.incrementFolderSize({ uuid: req.body.fileData.parentUuid });

      return res.send({ folderData });
      
    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
    }
  },

  recoverFolder: async (req: Request, res: Response): Promise<any> => {
    try {
      const folderData: Folder = await folderServices.updateFolderIsRemoved({ ...req.body.folderData, isRemoved: false })

      await folderServices.incrementFolderSize({ uuid: req.body.fileData.parentUuid });

      return res.send({ folderData });
      
    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
    }
  },

  deleteFolder: async (req: Request, res: Response): Promise<any> => {
    const findChildFoldersUuids = async (parentFolder: Folder): Promise<Array<string>> => {
      return new Promise<Array<string>>(async function(resolve, reject) {
        try {
          const folders: Folder[] = await folderServices.getFoldersByParent(parentFolder, req.body.driveData)

          let childrenUuids2DArray: Array<Array<string>> = Array(folders.length)

          if (folders.length > 0) {
            await Promise.allSettled(
              folders.map(async (folder, index) => {
                const childrenUuids = await findChildFoldersUuids(folder);
                childrenUuids2DArray[index] = childrenUuids;
                return;
              })
            )
          }

          const childrenUuidsArray = childrenUuids2DArray.flat();

          resolve(childrenUuidsArray!);

        } catch (err: any) {
          reject(err);
        }
      })
    }

    const deleteFiles = async (foldersToDeleteUuids: (string)[]): Promise<void> => {
      return new Promise<void>(async function(resolve, reject) {
        try {
          const files: File[] = await fileServices.getFilesByParentUuids(foldersToDeleteUuids)

          await fileServices.deleteFilesByParentUuids(foldersToDeleteUuids)

          await Promise.allSettled(
            files.map(async (file: File) => {
              return await diskServices.deleteFileOnDisk(file);
            })
          )

          resolve(); 

        } catch (err: any) {
          reject(err);
        }
      })
    }

    try {
      const foldersToDeleteUuids: string[] = [
        req.ogFolder!.uuid,
        ...await findChildFoldersUuids(req.ogFolder!)
      ];

      await Promise.allSettled([
        await bookmarkServices.deleteBookmarksByFoldersUuids(req.ogUser!, foldersToDeleteUuids),
        await folderServices.deleteFoldersByFoldersUuids(foldersToDeleteUuids),
        await deleteFiles(foldersToDeleteUuids)
      ])

      return res.send({ folderData: req.ogFolder });

    } catch(err: any) {
      console.log(err);
      return res.sendStatus(500);
    }
  }
}


export default folderController;
