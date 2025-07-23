import bcrypt from 'bcrypt';

import { instance as prisma } from '@/instances/prisma'

import { User } from '@prisma/client';
import { UserData } from '@/types/UserData';


const userServices = {
  getUser: async (userData: (User | UserData)): Promise<User> => {
    return new Promise<User>(async (resolve, reject) => {
      try {
        const user: User | null = await prisma.user.findUnique({
          where: {
            login: userData.login,
          }
        })

        if (user &&
        user.password &&
        bcrypt.compareSync(userData.password!, user.password)
        ) { 
          resolve(user);
        } else {
          reject(404);
        }

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  },

  createUser: async (userData: User): Promise<User> => {
    return new Promise<User>(async function(resolve, reject) {
      try {
        const user: User = await prisma.user.create({
          data: userData
        })

        resolve(user);

      } catch (err: any) {
        console.log(err);
        reject(err);
      }
    })
  }
}

export default userServices;
