import { Response, Request, NextFunction } from "express";

const notFoundMiddleware = (
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  res.status(404).send("Not Found");
};

export default notFoundMiddleware;
