import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { unauthorized } from '../constants/statusCodes';
import logger from './winston';

export interface DecodedToken {
  user: {
    id: string;
    email: string;
  };
}

// Extend the Request interface to include the user property
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
    };
  }
}

const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(unauthorized).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(
      token.split(' ')[1],
      process.env.JWT_SECRET_KEY as string,
    ) as DecodedToken;
    req.user = decoded.user;

    logger.info('TOKEN USER: ', req.user);
    next();
  } catch (error) {
    logger.error(error);
    return res.status(unauthorized).json({ error: 'Invalid token' });
  }
};

export default verifyToken;
