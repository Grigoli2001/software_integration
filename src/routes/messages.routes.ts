import express from 'express';
import messageService from '../controllers/message.controller';

const router = express.Router();

router.post('/create', messageService.createMessage);
export default router;
