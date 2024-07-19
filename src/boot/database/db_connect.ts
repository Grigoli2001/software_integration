import { Pool, PoolConfig } from 'pg';
import logger from '../../middleware/winston';

const db_config: PoolConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
  max: 10,
};

const pool = new Pool(db_config);

export const connectToDB = async (): Promise<void> => {
  try {
    await pool.connect();
    logger.info('Connected to database');
  } catch (error) {
    logger.error('Error connecting to database', error);
  }
};

export default pool;
