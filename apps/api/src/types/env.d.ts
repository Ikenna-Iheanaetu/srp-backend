declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // App Config
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      ALLOWED_ORIGINS: string;

      // Prisma database
      DATABASE_URL: string;

      // Session & Auth
      BCRYPT_SALT_ROUNDS: string;
      JWT_SECRET: string;
      JWT_REFRESH_SECRET: string;
      JWT_EXPIRES_IN: string;
      JWT_REFRESH_EXPIRES_IN: string;
      JWT_REFRESH_EXPIRES_MS: string;
      GOOGLE_CLIENT_ID: string;

      // Email Credentials
      EMAIL_USER: string;
      EMAIL_PASSWORD: string;
      EMAIL_URL: string;

      // Storage with Minio
      MINIO_ENDPOINT: string;
      MINIO_ACCESS_KEY: string;
      MINIO_SECRET_KEY: string;
      MINIO_BUCKET_NAME: string;
      MINIO_FORCE_PATH_STYLE: stirng;

      // Seed Data
      SEED_ADMIN_EMAIL: string;
      SEED_ADMIN_PASSWORD: string;
    }
  }
}

export {};
