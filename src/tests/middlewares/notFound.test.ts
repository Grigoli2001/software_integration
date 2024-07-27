import request from 'supertest';
import { registerCoreMiddleWare } from '../../boot/index';
import verifyToken from '../../middleware/authentication';

const app = registerCoreMiddleWare();

// Mock the verifyToken middleware
jest.mock('../../middleware/authentication');

describe('Not Found Middleware', () => {
  describe('GET /random', () => {
    it('should return 404', async () => {
      // Mock the behavior of the verifyToken middleware to call next()
      (verifyToken as jest.Mock).mockImplementation((_req, _res, next) => {
        next(); // Call next to simulate successful token verification
      });

      const res = await request(app)
        .get('/random')
        .set('Authorization', 'Bearer validtoken');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: 'Not Found' });
    });
  });
});
