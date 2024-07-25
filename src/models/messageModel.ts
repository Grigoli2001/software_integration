import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  content: string;
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const messageSchema: Schema = new Schema(
  {
    content: { type: String, required: true },
    sender: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

const MessageModel = mongoose.model<IMessage>('Message', messageSchema);

export default MessageModel;
