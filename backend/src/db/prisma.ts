import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Ensure environment variables are loaded regardless of import order
if (!process.env.DATABASE_URL) {
  const envCandidatePaths = [
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'backend/.env')
  ];
  const foundEnvPath = envCandidatePaths.find(p => fs.existsSync(p));
  dotenv.config(foundEnvPath ? { path: foundEnvPath } : undefined);
}

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('[Prisma] WARNING: DATABASE_URL environment variable is not defined in process.env');
}

export const prisma = new PrismaClient(
  dbUrl
    ? {
        datasources: {
          db: {
            url: dbUrl,
          },
        },
      }
    : undefined
);

export default prisma;
