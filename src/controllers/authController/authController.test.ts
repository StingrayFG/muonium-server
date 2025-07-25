import { Request, Response } from 'express';
import { expectTypeOf } from 'expect-type'
import bcrypt from 'bcrypt'

import authController from './authController';

import { User } from '@prisma/client';
import { UserData } from '@/types/UserData';
import { UuidOnly } from '@/types/UuidOnly';
import { Drive } from '@prisma/client';

import userServices from '@/services/userServices/userServices';


//
process.env.IGNORE_AUTH_LIMIT = '1'
process.env.ACCESS_TOKEN_SECRET = 'test'

const clientUserData = {
  login: 'adminadmin',
  password: 'adminadmin',
}


//
jest.mock('../../services/userServices/userServices', () => ({
  getUser: async (userData: (User | UserData)): Promise<UserData> => {
    return new Promise<UserData>(async (resolve, reject) => {
      resolve({
        uuid: 'test',
        login: userData.login!,
      })
    }) 
  },
  createUser: async (userData: User): Promise<User> => {
    return new Promise<User>(async function(resolve, reject) {
      resolve({
        uuid: 'test',
        login: userData.login,
        password: 'testhash'
      })
    }) 
  },
}));

jest.mock('../../services/driveServices', () => ({
  createDrive: async (userData: UuidOnly): Promise<Drive> => {
    return new Promise<Drive>(async function(resolve, reject) {
      resolve({
        uuid: 'test',
        ownerUuid: userData.uuid,
        spaceTotal: 0,
        spaceUsed: 0,
      })
    })
  },
}));


//
describe('authController', () => {

  test('log in', () => {
    let responseBody: any;

    const sendMock = (arg: any) => {
      responseBody = arg;
    }

    authController.login(
      {
        body: {
          userData: clientUserData
        },
      } as Request,
      {
        send: sendMock,
        status: () => {
          return { end: () => {} }
        }
      } as unknown as Response
    )
    .then(() => {
      expectTypeOf(responseBody.userData).toMatchTypeOf<UserData>()
      expect(responseBody.userData.uuid).toBeDefined()
      expect(responseBody.userData.login).toBeDefined()
      expect(responseBody.userData.accessToken).toBeDefined()
      expect(responseBody.userData.login).toEqual(clientUserData.login)
    })
  })

  test('sign up', () => {
    let responseCode: any;

    const statusMock = (arg: any) => {
      responseCode = arg;
      return { end: () => {} }
    }

    const createUserSpy = jest.spyOn(userServices, 'createUser'); 

    authController.signup(
      {
        body: {
          userData: clientUserData
        },
      } as Request,
      {
        status: statusMock
      } as unknown as Response
    )
    .then(() => {
      expect(bcrypt.compareSync(clientUserData.password, createUserSpy.mock.calls[0][0].password)).toBeTruthy();
      expect(responseCode).toEqual(201)
    })
  })

})