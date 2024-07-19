import dotenv from 'dotenv';
dotenv.config();
import app from './boot/index';
import logger from './middleware/winston';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
