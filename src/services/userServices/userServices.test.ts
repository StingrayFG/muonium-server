import bcrypt from 'bcrypt'

import { prismaMock } from '@/singleton'

import userServices from './userServices';


//
const clientUserData = {
  login: 'adminadmin',
  password: 'adminadmin',
}

const saltRounds = 10;
const hashedPassword = bcrypt.hashSync(clientUserData.password, saltRounds)

const serverUserData = {
  uuid: 'test',
  login: clientUserData.login,
  password: hashedPassword
}


//
describe('userService', () => {

  test('log in', async () => {
    prismaMock.user.findUnique.mockResolvedValue(serverUserData)
    await expect(userServices.getUser(clientUserData)).resolves.toEqual(serverUserData)
  })
  
})
