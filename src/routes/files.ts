import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";

const router = express.Router();

router.get("/", (req: Request, res: Response) => {});

export default router;
