

const sampleObjects: any = {
  clientFile1: {
    "uuid": "876fbc76-f36f-47de-a34e-88ce5f1dcca0",
    "ownerUuid": "d8a20daf-2377-48ad-ae66-225ed5bb9db0",
    "driveUuid": "80a06bcf-b8b4-44e4-b853-5114df95dbe5",
    "parentUuid": "home",
    "name": "test_p0_master1200.jpg",
    "nameExtension": "1745226892950",
    "size": 941599,
    "creationDate": "2025-04-21T09:14:52.972Z",
    "modificationDate": "2025-04-21T09:14:52.972Z",
    "isRemoved": false,
    "thumbnail": "test",
    "type": "file"
  },
  serverFile1: {
    "uuid": "876fbc76-f36f-47de-a34e-88ce5f1dcca0",
    "ownerUuid": "d8a20daf-2377-48ad-ae66-225ed5bb9db0",
    "driveUuid": "80a06bcf-b8b4-44e4-b853-5114df95dbe5",
    "parentUuid": "home",
    "name": "test_p0_master1200.jpg",
    "nameExtension": "1745226892950",
    "size": 941599,
    "creationDate": "2025-04-21T09:14:52.972Z",
    "modificationDate": "2025-04-21T09:14:52.972Z",
    "isRemoved": false,
  },

  clientFolder1: {
    "uuid": "9938b00b-5448-429f-8e55-ff065e98b216",
    "ownerUuid": "d8a20daf-2377-48ad-ae66-225ed5bb9db0",
    "driveUuid": "80a06bcf-b8b4-44e4-b853-5114df95dbe5",
    "parentUuid": "home",
    "name": "1",
    "size": 2,
    "creationDate": "2025-04-27T15:02:08.422Z",
    "modificationDate": "2025-04-27T15:02:08.422Z",
    "absolutePath": "/home/1",
    "isRemoved": false,
    "isRemovedAsChild": false,
    "folders": [
      {
        "uuid": "620805aa-8efd-4619-87a2-c2a4aa46a854",
        "ownerUuid": "d8a20daf-2377-48ad-ae66-225ed5bb9db0",
        "driveUuid": "80a06bcf-b8b4-44e4-b853-5114df95dbe5",
        "parentUuid": "9938b00b-5448-429f-8e55-ff065e98b216",
        "name": "42",
        "size": 0,
        "creationDate": "2025-04-28T15:39:03.392Z",
        "modificationDate": "2025-04-28T15:39:03.392Z",
        "absolutePath": "/home/1/42",
        "isRemoved": false,
        "isRemovedAsChild": false,
        "type": "folder"
      }
    ],
    "files": [
      {
        "uuid": "c925a9b1-dd49-479c-b78d-1e0b62a69675",
        "ownerUuid": "d8a20daf-2377-48ad-ae66-225ed5bb9db0",
        "driveUuid": "80a06bcf-b8b4-44e4-b853-5114df95dbe5",
        "parentUuid": "9938b00b-5448-429f-8e55-ff065e98b216",
        "name": "sample_65eaa46b29dd63250e918b1445f37931.jpg",
        "nameExtension": "1745854740464",
        "size": 777660,
        "creationDate": "2025-04-28T15:39:00.478Z",
        "modificationDate": "2025-04-28T15:39:00.478Z",
        "isRemoved": false,
        "thumbnail": "",
        "type": "file"
      }
    ]
  },
  serverFolder1: {
    "uuid": "9938b00b-5448-429f-8e55-ff065e98b216",
    "ownerUuid": "d8a20daf-2377-48ad-ae66-225ed5bb9db0",
    "driveUuid": "80a06bcf-b8b4-44e4-b853-5114df95dbe5",
    "parentUuid": "home",
    "name": "1",
    "size": 2,
    "creationDate": "2025-04-27T15:02:08.422Z",
    "modificationDate": "2025-04-27T15:02:08.422Z",
    "absolutePath": "/home/1",
    "isRemoved": false,
    "isRemovedAsChild": false,
  },
  serverFolder2: {
    "uuid": "229938b00b-5448-429f-8e55-ff065e98b216",
    "ownerUuid": "22d8a20daf-2377-48ad-ae66-225ed5bb9db0",
    "driveUuid": "2280a06bcf-b8b4-44e4-b853-5114df95dbe5",
    "parentUuid": "test",
    "name": "1",
    "size": 2,
    "creationDate": "2025-04-27T15:02:08.422Z",
    "modificationDate": "2025-04-27T15:02:08.422Z",
    "absolutePath": "test",
    "isRemoved": false,
    "isRemovedAsChild": false,
  },

  serverDrive: {
    "uuid": "80a06bcf-b8b4-44e4-b853-5114df95dbe5",
    "ownerUuid": "d8a20daf-2377-48ad-ae66-225ed5bb9db0",
    "spaceTotal": 524288000,
    "spaceUsed": 3537059
  },

  serverUser: {
    "login": "login",
    "password": "password",
    "uuid": "80a06bcf-b8b4-44e4-b853-5114df95dbe5"
  }
}

export default sampleObjects;