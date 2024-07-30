import request from 'supertest';
import { registerCoreMiddleWare } from '../../boot/index';
import UserModel from '../../models/userModel';

const app = registerCoreMiddleWare();

const testUserLogin = {
  email: 'test123@gmail.com',
  password: 'test',
};

const testUserSignup = {
  username: 'test',
  email: 'test123@gmail.com',
  password: 'test',
};

describe('Auth Routes', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await UserModel.deleteMany({});
  });

  describe('POST /signup', () => {
    it('should return 400 if missing information', async () => {
      const res = await request(app).post('/auth/signup').send({
        email: '',
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'missing information' });
    });
    it('should return 500 if failed to save user', async () => {
      await request(app).post('/auth/signup').send(testUserSignup);
      // triggering duplicate error
      const res = await request(app).post('/auth/signup').send(testUserSignup);
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: 'failed to save user' });
    });
    it('should save user and return 200', async () => {
      const res = await request(app).post('/auth/signup').send(testUserSignup);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        __v: expect.any(Number),
        _id: expect.any(String),
        created_at: expect.any(String),
        email: testUserSignup.email,
        messages: [],
        password: expect.any(String),
        updated_at: expect.any(String),
        username: testUserSignup.username,
      });
    });
  });
  describe('POST /signin', () => {
    it('should return 400 if missing information', async () => {
      const res = await request(app).post('/auth/login').send({
        email: 'test',
      });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'missing information' });
    });
    it('should return 400 if user not found', async () => {
      const res = await request(app).post('/auth/login').send(testUserLogin);
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'User not found' });
    });
    it('should return 400 if password is incorrect', async () => {
      await request(app).post('/auth/signup').send(testUserSignup);
      const res = await request(app).post('/auth/login').send({
        email: testUserLogin.email,
        password: 'wrongpassword',
      });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Email or password don't match" });
    });
    it('should return 500 if failed to save session', async () => {
      await request(app).post('/auth/signup').send(testUserSignup);
      jest
        .spyOn(UserModel, 'findOne')
        .mockRejectedValueOnce(new Error('failed to get user'));
      const res = await request(app).post('/auth/login').send(testUserLogin);
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to get user' });
    });
    it('should return 200 and token', async () => {
      await request(app).post('/auth/signup').send(testUserSignup);
      const res = await request(app).post('/auth/login').send(testUserLogin);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ token: expect.any(String) });
    });
  });

  describe('GET /me', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/auth/me');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'You are not authenticated' });
    });
    it('should return 400 if user not found', async () => {
      await request(app).post('/auth/signup').send(testUserSignup);
      const loginRes = await request(app)
        .post('/auth/login')
        .send(testUserLogin);
      const cookies = loginRes.headers['set-cookie'];
      const mockFindById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });
      jest.spyOn(UserModel, 'findById').mockImplementation(mockFindById);
      const res = await request(app).get('/auth/me').set('Cookie', cookies);
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'User not found' });
    });

    it('should return 500 if failed to get user', async () => {
      await request(app).post('/auth/signup').send(testUserSignup);
      const loginRes = await request(app)
        .post('/auth/login')
        .send(testUserLogin);
      const cookies = loginRes.headers['set-cookie'];
      const mockFindById = jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Failed to get user')),
      });
      jest.spyOn(UserModel, 'findById').mockImplementation(mockFindById);
      const res = await request(app).get('/auth/me').set('Cookie', cookies);
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to get user' });
    });
    // TO DO finish the get user scenario

    // it('should return 200 and user', async () => {
    //   // Sign up the user
    //   const signupRes = await request(app)
    //     .post('/auth/signup')
    //     .send(testUserSignup);
    //   expect(signupRes.status).toBe(200);

    //   // Log in the user
    //   const loginRes = await request(app)
    //     .post('/auth/login')
    //     .send(testUserLogin);
    //   expect(loginRes.status).toBe(200);

    //   const cookies = loginRes.headers['set-cookie'];
    //   // Fetch the user
    //   const res = await request(app).get('/auth/me').set('Cookie', cookies);
    //   expect(res.status).toBe(200);
    // });
  });
  describe('POST /logout', () => {
    it('should return 200 and destroy session', async () => {
      await request(app).post('/auth/signup').send(testUserSignup);
      const loginRes = await request(app)
        .post('/auth/login')
        .send(testUserLogin);
      const cookies = loginRes.headers['set-cookie'];
      const res = await request(app).get('/auth/logout').set('Cookie', cookies);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Disconnected' });
    });
  });
});
