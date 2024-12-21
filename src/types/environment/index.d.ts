declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CLIENT_URL: string;
      ADDITIONAL_CORS_URL: string | undefined;
      REDIS_URL: string;

      NEW_DRIVE_SIZE: string;
      MAX_FILE_SIZE: string;
      MAX_BODY_SIZE: string;
      MIN_LOGIN_LENGTH: string;
      MIN_PASSWORD_LENGTH: string;

      DOWNLOAD_LINK_VALID_FOR: string;
      ACCESS_TOKEN_SECRET: string;
    }
  }
}

export {}