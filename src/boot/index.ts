import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import session from "express-session";
import mongoose from "mongoose";
import logger from "../middleware/winston";
import healthCheck from "../middleware/healthCheck";
import notFoundMiddleware from "../middleware/notFound";
import validator from "../middleware/validator";
import verifyToken from "../middleware/authentication";
import { connectToDB } from "./database/db_connect";

// routes
import authRoutes from "../routes/auth.routes";

const app = express();

// Connect to MongoDB
try {
  mongoose.connect(process.env.MONGO_URI as string);
  logger.info("Connected to MongoDB");
} catch (error) {
  logger.error("Error connecting to MongoDB", error);
}

app.use(
  morgan("combined", {
    stream: { write: (message: string) => logger.info(message.trim()) },
  })
);
app.use(express.json());
app.use(cors());
app.use(helmet());
// app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// connect to database with await
(async () => {
  await connectToDB();
})();

app.use(healthCheck);
app.use("/auth", authRoutes);
app.use(notFoundMiddleware);
app.use(validator);
app.use(verifyToken);

// app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
//   logger.error(err);
//   res.status(500).json({ error: "Something went wrong" });
// });

export default app;
