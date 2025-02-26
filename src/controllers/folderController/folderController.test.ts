import { Request, Response } from 'express';
import { expectTypeOf } from 'expect-type'
import bcrypt from 'bcrypt'

import folderController from './folderController';
import driveServices from '@/services/driveServices';
import fileServices from '@/services/fileServices';
import folderServices from '@/services/folderServices';
import diskServices from '@/services/diskServices';
import bookmarkServices from '@/services/bookmarkServices';

import { Folder } from '@prisma/client';
import { User } from '@prisma/client';
import { UserData } from '@/types/UserData';
import { FolderData } from '@/types/FolderData';
import { UuidOnly } from '@/types/UuidOnly';
import { Drive } from '@prisma/client';
import { File } from '@prisma/client';
import { FileData } from '@/types/FileData';

import sampleObjects from '@/utils/sampleObjects';


//
process.env.ACCESS_TOKEN_SECRET = 'test'


//
jest.mock('../../services/fileServices.ts', () => ({
  createFile: async (fileData: File): Promise<File> => {
    return new Promise<File>(async (resolve, reject) => {
      resolve(fileData as File)
    })
  },
  getFilesByParentUuids: async (parentUuids: string[]): Promise<File[]> => {
    return new Promise<File[]>(async (resolve, reject) => {
      resolve([sampleObjects.serverFile1] as File[])
    })
  },
  updateFileName: async (fileData: (File | FileData)): Promise<File> => {
    return new Promise<File>(async (resolve, reject) => {
      resolve(fileData as File)
    })
  },
  updateFileParent: async (fileData: (File | FileData)): Promise<File> => {
    return new Promise<File>(async (resolve, reject) => {
      resolve(fileData as File)
    })
  },
  updateFileIsRemoved: async (fileData: (File | FileData)): Promise<File> => {
    return new Promise<File>(async (resolve, reject) => {
      resolve(fileData as File)
    })
  }, 
  deleteFile: async (fileData: File): Promise<File> => {
    return new Promise<File>(async (resolve, reject) => {
      resolve(fileData as File)
    })
  },
  deleteFilesByParentUuids: async (parentUuids: string[]): Promise<number> => {
    return new Promise<number>(async (resolve, reject) => {
      resolve(0)
    })
  },
}));

jest.mock('../../services/folderServices.ts', () => ({
  createFolder: async (folderData: (Folder | FolderData)): Promise<Folder> => {
    return new Promise<Folder>(async (resolve, reject) => {
      resolve(sampleObjects.serverFolder1);
    })
  },
  updateFolderNameAndPath: async (folderData: (Folder | FolderData)): Promise<Folder> => {
    return new Promise<Folder>(async (resolve, reject) => {
      resolve(sampleObjects.serverFolder1);
    })
  },
  updateFolderParentAndPath: async (folderData: (Folder | FolderData)): Promise<Folder> => {
    return new Promise<Folder>(async (resolve, reject) => {
      resolve(sampleObjects.serverFolder1);
    })
  },
  getFoldersByPathBeginning: async (parentFolderData: (Folder | FolderData), driveData: UuidOnly): Promise<Folder[]> => {
    return new Promise<Folder[]>(async (resolve, reject) => {
      resolve([parentFolderData] as Folder[])
    })
  },
  getFoldersByParent: async (parentFolderData: (Folder | FolderData), driveData: UuidOnly): Promise<Folder[]> => {
    return new Promise<Folder[]>(async (resolve, reject) => {
      if (parentFolderData.uuid !== sampleObjects.serverFolder1.uuid) {
        resolve([sampleObjects.serverFolder1])
      } else {
        resolve([])
      }
    })
  },
  incrementFolderSize: async (folderData: (Folder | FolderData)): Promise<Folder | void> => {
    return new Promise<Folder | void>(async (resolve, reject) => {
      resolve(folderData as Folder)
    })
  },
  decrementFolderSize: async (folderData: (Folder | FolderData)): Promise<Folder | void> => {
    return new Promise<Folder | void>(async (resolve, reject) => {
      resolve(folderData as Folder)
    })
  },
  deleteFoldersByFoldersUuids: async (folderUuids: string[]): Promise<number> => {
    return new Promise<number>(async (resolve, reject) => {
      resolve(0)
    })
  },
}));

jest.mock('../../services/bookmarkServices.ts', () => ({
  deleteBookmarksByFoldersUuids: async (userData: UuidOnly, folderUuids: (string)[]): Promise<number> => {
    return new Promise<number>(async (resolve, reject) => {
      resolve(0)
    })
  },
}));


jest.mock('../../services/driveServices.ts', () => ({
  updateDriveUsedSpace: async (driveData: UuidOnly, usageChange: number): Promise<Drive> => {
    return new Promise<Drive>(async function(resolve, reject) {
      resolve(sampleObjects.serverDrive);
    })
  }
}));

jest.mock('../../services/diskServices.ts', () => ({
  copyFileOnDisk: async (originalFile: (File | FileData), newFile: (File | FileData)): Promise<void> => {
    return new Promise<void>(async function(resolve, reject) {
      resolve();
    })
  },
  deleteFileOnDisk: async (file: (File | FileData)): Promise<void> => {
    return new Promise<void>(async function(resolve, reject) {
      resolve();
    })
  }
}));


describe('folderController', () => {

  test('create', async () => {
    let responseBody: any;
  
    const sendMock = (arg: any) => {
      responseBody = arg;
    }

    const folderSpy = jest.spyOn(folderServices, 'createFolder');

    await folderController.createFolder(
      {
        body: {
          folderData: { ...sampleObjects.clientFolder1, name: 'test-name', parentUuid: sampleObjects.serverFolder2.uuid },
        },
        ogParentFolder: sampleObjects.serverFolder2,
        ogDrive: sampleObjects.serverDrive,
        ogUser: sampleObjects.serverUser,
      } as unknown as Request,
      {
        send: sendMock,
        status: () => {
          return { end: () => {} }
        },
        sendStatus: () => {}
      } as unknown as Response
    )
    .then(() => {
      expect(folderSpy.mock.calls[0][0]).toMatchObject({
        name: 'test-name',
        parentUuid: sampleObjects.serverFolder2.uuid
      })
    })
  })

  test('rename', async () => {
    let responseBody: any;
  
    const sendMock = (arg: any) => {
      responseBody = arg;
    }

    const folderSpy = jest.spyOn(folderServices, 'updateFolderNameAndPath');

    await folderController.renameFolder(
      {
        body: {
          folderData: { ...sampleObjects.clientFolder1, name: 'test-name' },
        },
        ogFolder: sampleObjects.serverFolder1,
        ogParentFolder: sampleObjects.serverFolder2,
        ogDrive: sampleObjects.serverDrive,
      } as unknown as Request,
      {
        send: sendMock,
        status: () => {
          return { end: () => {} }
        },
        sendStatus: () => {}
      } as unknown as Response
    )
    .then(() => {
      expect(folderSpy.mock.calls[0][0]).toMatchObject({
        name: 'test-name'
      })
    })
  })

  test('move', async () => {
    let responseBody: any;
  
    const sendMock = (arg: any) => {
      responseBody = arg;
    }

    const folderSpy1 = jest.spyOn(folderServices, 'updateFolderParentAndPath');
    const folderSpy2 = jest.spyOn(folderServices, 'getFoldersByPathBeginning');

    await folderController.moveFolder(
      {
        body: {
          folderData: { ...sampleObjects.clientFolder1, parentUuid: 'parent-test' },
        },
        ogFolder: sampleObjects.serverFolder1,
        ogParentFolder: sampleObjects.serverFolder2,
        ogDrive: sampleObjects.serverDrive,
      } as unknown as Request,
      {
        send: sendMock,
        status: () => {
          return { end: () => {} }
        },
        sendStatus: () => {}
      } as unknown as Response
    )
    .then(() => {
      expect(folderSpy1.mock.calls[0][0]).toMatchObject({
        parentUuid: 'parent-test',
      })
      expect(folderSpy2.mock.calls[0][0]).toMatchObject({
        uuid: sampleObjects.serverFolder1.uuid
      })
    })
  })

  test('delete', async () => {
    let responseBody: any;
  
    const sendMock = (arg: any) => {
      responseBody = arg;
    }

    const folderSpy = jest.spyOn(folderServices, 'deleteFoldersByFoldersUuids');
    const fileSpy = jest.spyOn(fileServices, 'deleteFilesByParentUuids');
    const bookmarkSpy = jest.spyOn(bookmarkServices, 'deleteBookmarksByFoldersUuids');

    await folderController.deleteFolder(
      {
        body: {
          folderData: { ...sampleObjects.clientFolder1 },
        },
        ogFolder: sampleObjects.serverFolder1,
        ogParentFolder: sampleObjects.serverFolder2,
        ogDrive: sampleObjects.serverDrive,
        ogUser: sampleObjects.serverUser,
      } as unknown as Request,
      {
        send: sendMock,
        status: () => {
          return { end: () => {} }
        },
        sendStatus: () => {}
      } as unknown as Response
    )
    .then(() => {
      expect(folderSpy.mock.calls[0][0]).toMatchObject([
        sampleObjects.serverFolder1.uuid
      ])
      expect(fileSpy.mock.calls[0][0]).toMatchObject([
        sampleObjects.serverFolder1.uuid
      ])
      expect(bookmarkSpy.mock.calls[0][0]).toMatchObject(sampleObjects.serverUser)
      expect(bookmarkSpy.mock.calls[0][1]).toMatchObject([
        sampleObjects.serverFolder1.uuid
      ])
    })
  })

}) 
