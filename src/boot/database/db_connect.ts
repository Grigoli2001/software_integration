import { Pool, PoolConfig } from "pg";
import logger from "../../middleware/winston";

console.log("DB_USER", process.env.DB_USER);
console.log("DB_HOST", process.env.DB_HOST);
console.log("DB_NAME", process.env.DB_NAME);
console.log("DB_PASSWORD", process.env.DB_PASSWORD);
const db_config: PoolConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
  max: 10,
};

const pool = new Pool(db_config);

// pool.on("connect", () => {
//   logger.info("Database connected");
// });

// pool.on("error", (err) => {
//   logger.error("Unexpected error on idle client", err);
//   process.exit(-1);
// });

export const connectToDB = async () => {
  try {
    await pool.connect();
    logger.info("Connected to database");
  } catch (error) {
    logger.error("Error connecting to database", error);
  }
};

export default pool;
