import { createClient } from 'redis'

/* Due to the lib used to mock redis being broken, redis client cant be mocked for testing.
Not creating a redis client at all during the testing using IGNORE_AUTH_LIMIT environment
variable is the solution used here */
export const instance = (!process.env.IGNORE_AUTH_LIMIT) ?
  createClient({ url: process.env.REDIS_URL })
  :
  {
    set: (name: string, value: any) => {},
    get: (name: string) => {},
    expire: (name: string, period: number) => {}
  }

  



