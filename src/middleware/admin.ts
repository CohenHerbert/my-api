import { type NextFunction, type Request, type Response } from "express";

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden. Admin role required." });
  }

  return next();
};

export default requireAdmin;
