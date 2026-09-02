import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import jwt from "jsonwebtoken";
import { db } from "@/prisma/db";

const router = express.Router();

router.post("/upload", (req: Request, res: Response) => {
  const { token } = req.params;
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as ( userId: number );
});

export default router;
