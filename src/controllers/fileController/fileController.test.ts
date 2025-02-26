import { Request, Response } from 'express';
import { expectTypeOf } from 'expect-type'
import bcrypt from 'bcrypt'

import fileController from './fileController';
import driveServices from '@/services/driveServices';
import fileServices from '@/services/fileServices';
import folderServices from '@/services/folderServices';
import diskServices from '@/services/diskServices';

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
}));

jest.mock('../../services/folderServices.ts', () => ({
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


describe('fileController', () => {

  test('copy', async () => {
    let responseBody: any;
  
    const sendMock = (arg: any) => {
      responseBody = arg;
    }

    const fileSpy = jest.spyOn(fileServices, 'createFile');
    const folderSpy = jest.spyOn(folderServices, 'incrementFolderSize');
    const driveSpy = jest.spyOn(driveServices, 'updateDriveUsedSpace');
    const diskSpy = jest.spyOn(diskServices, 'copyFileOnDisk');

    await fileController.copyFile(
      {
        body: {
          fileData: { ...sampleObjects.clientFile1, parentUuid: 'parent-test' },
        },
        ogFile: sampleObjects.serverFile1,
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
      expect(fileSpy.mock.calls[0][0]).toMatchObject({
        parentUuid: 'parent-test',
      })
      expect(folderSpy.mock.calls[0][0]).toMatchObject({
        uuid: 'parent-test'
      })
      expect(driveSpy.mock.calls[0][0]).toBe(sampleObjects.serverDrive)
      expect(driveSpy.mock.calls[0][1]).toBe(sampleObjects.serverFile1.size)
      expect(diskSpy.mock.calls[0][0]).toBe(sampleObjects.serverFile1)
      expect(diskSpy.mock.calls[0][1]).toMatchObject({
        parentUuid: 'parent-test',
      })
    })
  })

  test('rename', async () => {
    let responseBody: any;
  
    const sendMock = (arg: any) => {
      responseBody = arg;
    }

    const fileSpy = jest.spyOn(fileServices, 'updateFileName');
    const diskSpy1 = jest.spyOn(diskServices, 'copyFileOnDisk');
    const diskSpy2 = jest.spyOn(diskServices, 'deleteFileOnDisk');

    await fileController.renameFile(
      {
        body: {
          fileData: { ...sampleObjects.clientFile1, name: 'test-name' },
        },
        ogFile: sampleObjects.serverFile1,
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
      expect(fileSpy.mock.calls[0][0]).toMatchObject({
        name: 'test-name'
      })
      expect(diskSpy1.mock.calls[0][0]).toBe(sampleObjects.serverFile1)
      expect(diskSpy1.mock.calls[0][1]).toMatchObject({
        name: 'test-name'
      })
      expect(diskSpy2.mock.calls[0][0]).toBe(sampleObjects.serverFile1)
    })
  })

  test('move', async () => {
    let responseBody: any;
  
    const sendMock = (arg: any) => {
      responseBody = arg;
    }

    const fileSpy = jest.spyOn(fileServices, 'updateFileParent');
    const folderSpy1 = jest.spyOn(folderServices, 'decrementFolderSize');
    const folderSpy2 = jest.spyOn(folderServices, 'incrementFolderSize');

    await fileController.moveFile(
      {
        body: {
          fileData: { ...sampleObjects.clientFile1, parentUuid: 'parent-test' },
        },
        ogFile: sampleObjects.serverFile1,
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
      expect(fileSpy.mock.calls[0][0]).toMatchObject({
        parentUuid: 'parent-test',
      })
      expect(folderSpy1.mock.calls[0][0]).toMatchObject({
        uuid: sampleObjects.serverFile1.parentUuid
      })
      expect(folderSpy2.mock.calls[0][0]).toMatchObject({
        uuid: 'parent-test'
      })
    })
  }),

  test('remove', async () => {
    let responseBody: any;
  
    const sendMock = (arg: any) => {
      responseBody = arg;
    }

    const fileSpy = jest.spyOn(fileServices, 'updateFileIsRemoved');
    const folderSpy = jest.spyOn(folderServices, 'decrementFolderSize');

    await fileController.removeFile(
      {
        body: {
          fileData: { ...sampleObjects.clientFile1 },
        },
        ogFile: sampleObjects.serverFile1,
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
      expect(fileSpy.mock.calls[0][0]).toMatchObject({
        uuid: sampleObjects.clientFile1.uuid
      })
      expect(folderSpy.mock.calls[0][0]).toMatchObject({
        uuid: sampleObjects.serverFile1.parentUuid
      })
    })
  })

  test('recover', async () => {
    let responseBody: any;
  
    const sendMock = (arg: any) => {
      responseBody = arg;
    }

    const fileSpy = jest.spyOn(fileServices, 'updateFileIsRemoved');
    const folderSpy = jest.spyOn(folderServices, 'incrementFolderSize');

    await fileController.recoverFile(
      {
        body: {
          fileData: { ...sampleObjects.clientFile1 },
        },
        ogFile: sampleObjects.serverFile1,
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
      expect(fileSpy.mock.calls[0][0]).toMatchObject({
        uuid: sampleObjects.clientFile1.uuid
      })
      expect(folderSpy.mock.calls[0][0]).toMatchObject({
        uuid: sampleObjects.serverFile1.parentUuid
      })
    })
  })

  test('delete', async () => {
    let responseBody: any;
  
    const sendMock = (arg: any) => {
      responseBody = arg;
    }

    const fileSpy = jest.spyOn(fileServices, 'deleteFile');
    const driveSpy = jest.spyOn(driveServices, 'updateDriveUsedSpace');
    const diskSpy = jest.spyOn(diskServices, 'deleteFileOnDisk');

    await fileController.deleteFile(
      {
        body: {
          fileData: { ...sampleObjects.clientFile1 },
        },
        ogFile: sampleObjects.serverFile1,
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
      expect(fileSpy.mock.calls[0][0]).toMatchObject({
        uuid: sampleObjects.clientFile1.uuid
      })
      expect(driveSpy.mock.calls[0][0]).toBe(sampleObjects.serverDrive)
      expect(driveSpy.mock.calls[0][1]).toBe(-sampleObjects.serverFile1.size)
      expect(diskSpy.mock.calls[0][0]).toBe(sampleObjects.serverFile1)
    })
  })
}) 
