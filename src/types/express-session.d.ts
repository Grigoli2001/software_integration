// I am not using this yet
import session from 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: { _id: string };
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    session: session.Session & Partial<session.SessionData>;
  }
}
