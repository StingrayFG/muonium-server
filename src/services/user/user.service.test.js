const bcrypt = require('bcrypt');

const userService = require('./user.service.js');
const prismaMock = require('../../singleton.js');


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


test('signup', async () => {
  prismaMock.user.create.mockResolvedValue(serverUserData)

  await expect(userService.createUser(clientUserData)).resolves.toEqual(serverUserData)
})

test('login', async () => {
  prismaMock.user.findUnique.mockResolvedValue(serverUserData)

  await expect(userService.getUser(clientUserData)).resolves.toEqual(serverUserData)
})


