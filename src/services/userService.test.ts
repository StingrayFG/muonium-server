import bcrypt from 'bcrypt'

import { prismaMock } from '@/singleton'

import userService from '@/services/userService';


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


test('service-login', async () => {
  prismaMock.user.findUnique.mockResolvedValue(serverUserData)
  await expect(userService.getUser(clientUserData)).resolves.toEqual(serverUserData)
})
