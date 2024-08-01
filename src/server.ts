import dotenv from 'dotenv';
dotenv.config();
import { startApp } from './boot/index';
import logger from './middleware/winston';

try {
  startApp();
} catch (error) {
  logger.error('Error starting application', error);
}
