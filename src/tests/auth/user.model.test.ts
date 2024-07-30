import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import UserModel from '../../models/userModel';

const testUserSignup = {
  username: 'test',
  email: 'test123@gmail.com',
  password: 'test',
};

describe('User Model', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
  });

  it('should save user', async () => {
    const user = new UserModel(testUserSignup);
    await user.save();
    const foundUser = await UserModel.findOne({ email: testUserSignup.email });
    expect(foundUser).toBeDefined();
    expect(foundUser?.email).toBe(testUserSignup.email);
  });

  it('should not save user if email already exists', async () => {
    const user = new UserModel(testUserSignup);
    await user.save();
    const user2 = new UserModel(testUserSignup);
    try {
      await user2.save();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
  it('should require an email', async () => {
    const userData = {
      username: 'testuser',
      password: 'password123',
    };

    await expect(UserModel.create(userData)).rejects.toThrow(
      mongoose.Error.ValidationError,
    );
  });

  it('should require a password', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
    };

    await expect(UserModel.create(userData)).rejects.toThrow(
      mongoose.Error.ValidationError,
    );
  });

  it('should find a user by email', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    await UserModel.create(userData);
    const user = await UserModel.findOne({ email: userData.email });
    expect(user).toBeDefined();
    expect(user?.email).toBe(userData.email);
  });
  it('should update a user', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    const createdUser = await UserModel.create(userData);
    const updatedData = {
      username: 'updateduser',
      email: 'updated@example.com',
      password: 'updatedpassword',
    };

    const updatedUser = await UserModel.findByIdAndUpdate(
      createdUser._id,
      updatedData,
      { new: true },
    );
    expect(updatedUser?.username).toBe(updatedData.username);
    expect(updatedUser?.email).toBe(updatedData.email);
    expect(updatedUser?.password).toBe(updatedData.password); // Note: In a real app, you should hash the password
  });

  it('should delete a user', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    const createdUser = await UserModel.create(userData);
    await UserModel.findByIdAndDelete(createdUser._id);
    const deletedUser = await UserModel.findById(createdUser._id);
    expect(deletedUser).toBeNull();
  });
});
