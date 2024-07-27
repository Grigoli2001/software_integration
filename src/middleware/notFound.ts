import { Response, Request } from 'express';

const notFoundMiddleware = (_req: Request, res: Response): void => {
  res.status(404).send({ message: 'Not Found' });
};

export default notFoundMiddleware;
