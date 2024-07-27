import request from 'supertest';
import { registerCoreMiddleWare } from '../../boot/index';

const app = registerCoreMiddleWare();

describe('Health Check', () => {
  describe('GET /health', () => {
    it('should return 200', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'All up and running !!' });
    });
  });
});
