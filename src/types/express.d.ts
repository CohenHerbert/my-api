import jwt from "jsonwebtoken";

export type Role = "user" | "admin";

declare global {
  namespace Express {
    interface Request {
      user?: jwt.JwtPayload & {
        userId: number;
        role: Role;
      };
    }
  }
}
