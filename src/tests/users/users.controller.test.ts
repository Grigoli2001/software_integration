import { Request, Response } from 'express';
import userService, {
  RegisterRequest,
  LoginRequest,
} from '../../controllers/users.controller';
import jwt from 'jsonwebtoken';
import statusCodes from '../../constants/statusCodes';
import pool from '../../boot/database/db_connect';

interface MockClient {
  query: jest.Mock;
  release: jest.Mock;
}

jest.mock('../../middleware/winston');
jest.mock('pg', () => {
  const mPool = {
    connect: jest.fn(),
    query: jest.fn(),
    release: jest.fn(),
  };
  return {
    Pool: jest.fn(() => mPool),
  };
});

jest.mock('jsonwebtoken', () => {
  return {
    sign: jest.fn(),
  };
});

describe('Users Controller', () => {
  let req: Request;
  let res: Response;
  let mockClient: MockClient;
  describe('Register', () => {
    beforeEach(() => {
      req = {
        body: {
          email: 'test@example.com',
          username: 'testUser',
          password: 'password123',
          country: 'USA',
          city: 'New York',
          street: '123 Main St',
        },
      } as RegisterRequest;
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValue(mockClient);
      jest.clearAllMocks();
    });

    it('should return 400 if missing parameters', async () => {
      delete req.body.email;
      await userService.register(req, res);
      expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Missing parameters',
      });
    });

    it('it should return 409 if user already exists', async () => {
      mockClient.query.mockResolvedValueOnce({ rowCount: 1 }); // Simulate existing user
      await userService.register(req, res);
      expect(res.status).toHaveBeenCalledWith(statusCodes.userAlreadyExists);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User already has an account',
      });
    });

    it('should return 500 if query fails', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('Query failed'));
      await userService.register(req, res);
      expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Exception occurred while registering',
      });
      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1;',
        [req.body.email],
      );
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return 200 if user is successfully created', async () => {
      mockClient.query.mockResolvedValueOnce({ rowCount: 0 }); // No existing user

      mockClient.query.mockResolvedValueOnce({ rowCount: 0 }); // Begin transaction

      mockClient.query.mockResolvedValueOnce({ rowCount: 1 }); // Simulate user creation

      mockClient.query.mockResolvedValueOnce({ rowCount: 1 }); // Simulate address creation

      mockClient.query.mockResolvedValueOnce({ rowCount: 0 }); // Commit transaction

      await userService.register(req, res);

      expect(res.status).toHaveBeenCalledWith(statusCodes.success);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User created',
      });
      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1;',
        [req.body.email],
      );
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        `INSERT INTO users(email, username, password, creation_date) VALUES ($1, $2, crypt($3, gen_salt('bf')), $4);`,
        [
          req.body.email,
          req.body.username,
          req.body.password,
          req.body.creation_date,
        ],
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        `INSERT INTO addresses(email, country, street, city) VALUES ($1, $2, $3, $4);`,
        [req.body.email, req.body.country, req.body.street, req.body.city],
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');

      expect(mockClient.release).toHaveBeenCalled();
    });
  });
  describe('Login', () => {
    beforeEach(() => {
      req = {
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
        session: {},
      } as LoginRequest;
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
      mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValue(mockClient);
      jest.clearAllMocks();
    });

    it('should return 400 if missing parameters', async () => {
      delete req.body.email;
      await userService.login(req, res);
      expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Missing parameters',
      });
    });

    it('should return 500 if query fails', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('Query failed'));
      await userService.login(req, res);
      expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Exception occurred while logging in',
      });
      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1 AND password = crypt($2, password);',
        [req.body.email, req.body.password],
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return 401 if user is not found', async () => {
      mockClient.query.mockResolvedValueOnce({ rowCount: 0 });
      await userService.login(req, res);
      expect(res.status).toHaveBeenCalledWith(statusCodes.notFound);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Incorrect email/password',
      });
      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1 AND password = crypt($2, password);',
        [req.body.email, req.body.password],
      );
    });

    it('should return 200 if user is found', async () => {
      mockClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 1, email: 'test@example.com', username: 'testUser' }],
      });
      const token = 'mocked-jwt-token';
      (jwt.sign as jest.Mock).mockReturnValue(token);

      await userService.login(req, res);

      expect(res.status).toHaveBeenCalledWith(statusCodes.success);
      expect(res.json).toHaveBeenCalledWith({
        token,
        username: 'testUser',
      });

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1 AND password = crypt($2, password);',
        [req.body.email, req.body.password],
      );
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
