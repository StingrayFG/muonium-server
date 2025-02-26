import bcrypt from 'bcrypt';

import { instance as prisma } from '@/instances/prisma'

import { User } from '@prisma/client';
import { UserData } from '@/types/UserData';


const userServices = {
  getUser: async (userData: (User | UserData)): Promise<UserData> => {
    return new Promise<UserData>(async (resolve, reject) => {
      if (userData.password) {
        await prisma.user.findUnique({
          where: {
            login: userData.login,
          }
        })
        .then((user: (User | null)) => {
          if (user) { 
            if (bcrypt.compareSync(userData.password!, user.password)) { 
              resolve(user);
            } else {
              reject();
            }
          } else {
            reject();
          }
        })
        .catch((err: any) => {
          console.log(err);
          reject();
        })   
      } else {
        reject();
      }
    })
  },

  createUser: async (userData: User): Promise<User> => {
    return new Promise<User>(async function(resolve, reject) {
      await prisma.user.create({
        data: userData
      })
      .then((user: User) => {
        resolve(user);
      })
      .catch((err: any) => {
        console.log(err);
        reject();
      })
    })
  }
}

export default userServices
