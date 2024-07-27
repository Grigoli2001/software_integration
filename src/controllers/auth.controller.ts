import { Request, Response } from 'express';
import userModel, { IUser } from '../models/userModel';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
interface AuthRequestBody {
  username?: string;
  email: string;
  password: string;
}

interface SessionUser {
  _id: string;
}

export interface Session {
  user?: SessionUser;
}
const signup = async (req: Request, res: Response): Promise<Response> => {
  const { username, email, password }: AuthRequestBody = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ error: 'missing information' });
  }

  const hash = bcrypt.hashSync(password, 10);

  try {
    const User = new userModel({
      email,
      username,
      password: hash,
    });
    const savedUser = await User.save();
    return res.status(200).json(savedUser);
  } catch (error) {
    return res.status(500).json({ message: 'failed to save user' });
  }
};

const signin = async (req: Request, res: Response): Promise<Response> => {
  const { email, password }: AuthRequestBody = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'missing information' });
  }

  try {
    const user: IUser | null = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ message: "Email or password don't match" });
    }

    (req.session as Session).user = {
      _id: user._id.toString(),
    };
    const token = jwt.sign(
      { user: { id: user._id, email: user.email } },
      process.env.JWT_SECRET_KEY as string,
      {
        expiresIn: '1h',
      },
    );

    return res.status(200).json({ token });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get user' });
  }
};

const getUser = async (req: Request, res: Response): Promise<Response> => {
  const session = req.session as Session;
  if (!session.user?._id) {
    return res.status(401).json({ error: 'You are not authenticated' });
  }

  try {
    const user: IUser | null = await userModel
      .findById(session.user._id, {
        password: 0,
      })
      .populate('messages');

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to get user' });
  }
};

const logout = (req: Request, res: Response): Response => {
  if ((req.session as Session).user) {
    delete (req.session as Session).user;
  }

  return res.status(200).json({ message: 'Disconnected' });
};

export default {
  signup,
  signin,
  getUser,
  logout,
};
