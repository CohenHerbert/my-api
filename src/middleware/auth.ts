import jwt from "jsonwebtoken";
import { type NextFunction, type Request, type Response } from "express";

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export default authenticateToken;
