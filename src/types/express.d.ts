import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: jwt.JwtPayload & {
        userId: number;
      };
    }
  }
}
