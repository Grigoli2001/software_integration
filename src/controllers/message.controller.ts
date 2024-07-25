import { Request, Response } from 'express';
import MessageModel, { IMessage } from '../models/messageModel';
import logger from '../middleware/winston';
interface SessionUser {
  _id: string;
}

interface Session {
  user?: SessionUser;
}
// Create a new message
const createMessage = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const session = req.session as Session;

  if (!req.body.content || !req.body.receiver) {
    return res.status(400).json({ error: 'missing information' });
  }
  if (!session.user?._id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { content, receiver } = req.body;
    const sender = session.user?._id;

    const newMessage: IMessage = new MessageModel({
      content,
      sender,
      receiver,
    });

    const savedMessage = await newMessage.save();
    return res.status(201).json(savedMessage);
  } catch (error) {
    logger.error('Error creating message:', error);
    return res.status(500).json({ error: 'Failed to create message' });
  }
};

export default { createMessage };
