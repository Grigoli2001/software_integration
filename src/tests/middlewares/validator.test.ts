import { Request, Response, NextFunction } from 'express';
import validator from '../../middleware/validator';
import logger from '../../middleware/winston';
import { badRequest } from '../../constants/statusCodes';

// Mock the logger
jest.mock('../../middleware/winston');

describe('Validator Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should add a creation_date to the request body', () => {
    validator(req as Request, res as Response, next);
    expect(req.body.creation_date).toBeDefined();
  });

  it('should delete the creation_date if it exists in the request body', () => {
    req.body = {
      creation_date: '2021-01-01',
      name: 'Test Item',
      description: 'desc',
    };
    validator(req as Request, res as Response, next);
    expect(req.body.creation_date).not.toBe('2021-01-01');
    expect(req.body.creation_date).toBeDefined();
    expect(req.body.creation_date).toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(req.body.name).toBe('Test Item');
    expect(req.body.description).toBe('desc');
    expect(next).toHaveBeenCalled();
  });

  it('should set empty string values to null', () => {
    req.body = {
      name: '',
      description: '',
    };
    validator(req as Request, res as Response, next);
    expect(req.body.name).toBeNull();
    expect(req.body.description).toBeNull();
    expect(next).toHaveBeenCalled();
  });
  it('should return 400 if an error occurs', () => {
    const error = new Error('Mocked error');
    req.body = {
      name: '',
      description: '',
    };
    jest.spyOn(Object, 'entries').mockImplementationOnce(() => {
      throw new Error('Mocked error');
    });
    validator(req as Request, res as Response, next);
    expect(logger.error).toHaveBeenCalledWith(error);
    expect(res.status).toHaveBeenCalledWith(badRequest);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad request' });
  });
});
