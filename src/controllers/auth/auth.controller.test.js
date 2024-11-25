const authController = require('./auth.controller.js');


const clientUserData = {
  login: 'adminadmin',
  password: 'adminadmin',
}


jest.mock('../../services/user/user.service.js', () => ({
  getUser: (data) => { 
    return new Promise((resolve, reject) => {
      resolve({
        uuid: 'testt',
        login: data.login,
        accessToken: 'test'
      })
    }) 
  },
  createUser: (userData) => { 
    return new Promise((resolve, reject) => {
      resolve({
        uuid: 'test',
        login: userData.login,
        accessToken: 'test'
      })
    }) 
  },
}));

jest.mock('../../services/drive.service.js', () => ({
  createDrive: (userData) => { 
    return new Promise((resolve, reject) => {
      resolve({
        uuid: 'test',
        userUuid: userData.uuid,
        spaceTotal: 0,
        spaceUsed: 0,
      })
    }) 
  },
}));


test('login', async () => {
  process.env.IGNORE_AUTH_LIMIT = '1' // Used to bypass redis calls

  let responseBody;
  const sendMock = (arg) => {
    responseBody = arg;
  }

  await authController.login(
    {
      body: {
        userData: clientUserData
      },
    },
    {
      send: sendMock,
      status: () => {
        return { end: () => {} }
      }
    }
  )
  .then(() => {
    expect(typeof responseBody.userData.uuid).toBe('string')
    expect(typeof responseBody.userData.login).toBe('string')
    expect(responseBody.userData.login).toEqual(clientUserData.login)
    expect(typeof responseBody.userData.accessToken).toBe('string')
  })
})

test('signup', async () => {
  process.env.IGNORE_AUTH_LIMIT = '1' // Used to bypass redis calls

  let responseCode;
  const statusMock = (arg) => {
    responseCode = arg;
    return { end: () => {} }
  }

  await authController.signup(
    {
      body: {
        userData: clientUserData
      },
    },
    {
      status: statusMock
    }
  )
  .then(() => {
    expect(responseCode).toEqual(201)
  })
})



