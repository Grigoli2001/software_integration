import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import session from 'express-session';
import mongoose from 'mongoose';
import logger from '../middleware/winston';
import healthCheck from '../middleware/healthCheck';
import notFoundMiddleware from '../middleware/notFound';
import validator from '../middleware/validator';
import verifyToken from '../middleware/authentication';
import { connectToDB } from './database/db_connect';

// routes
import authRoutes from '../routes/auth.routes';
import messageRoutes from '../routes/messages.routes';
import userRoutes from '../routes/users.routes';

const app = express();

// Connect to MongoDB
try {
  mongoose.connect(process.env.MONGO_URI as string);
  logger.info('Connected to MongoDB');
} catch (error) {
  logger.error('Error connecting to MongoDB', error);
}

export const registerCoreMiddleWare = (): Application => {
  app.use(
    morgan('combined', {
      stream: { write: (message: string) => logger.info(message.trim()) },
    }),
  );
  app.use(express.json());
  app.use(cors());
  app.use(helmet());
  // app.use(express.urlencoded({ extended: true }));
  app.use(
    session({
      secret: process.env.SESSION_SECRET as string,
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false },
    }),
  );

  connectToDB();

  app.use(validator);
  app.use(healthCheck);
  app.use('/auth', authRoutes);
  app.use('/users', userRoutes);
  app.use(verifyToken);
  app.use('/messages', messageRoutes);
  app.use(notFoundMiddleware);

  return app;
};

const handleErrors = (): void => {
  process.on('unhandledRejection', (error: Error) => {
    logger.error('Unhandled Rejection', error);
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', error);
  });
};

export const startApp = (): void => {
  try {
    registerCoreMiddleWare();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
    handleErrors();
  } catch (error) {
    logger.error('Error starting the app', error);
  }
};
