import express, { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import multer from "multer";
import { db } from "@/prisma/db";
import { unlink } from "node:fs/promises";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/tmp/my-uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

const upload = multer({ storage: storage });

router.get("/", (req: Request, res: Response) => {
  const dirPath = "/tmp/my-uploads";

  fs.readdir(dirPath, (err, files) => {
    if (err) {
      return res.status(500).json({
        message: "Unable to scan directory",
        details: err.message,
      });
    }

    return res.status(200).json({ files });
  });
});

router.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    const file = req.file;
    const authHeader = req.headers["authorization"];

    if (!file) {
      return res.status(400).json({ message: "No file provided" });
    }

    if (!authHeader) {
      await unlink(file.path);
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: number;
      };

      const newFile = await db.orm.public.File.create({
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,

        ownerId: decoded.userId,
      });

      res.status(200).json({ newFile });
    } catch (error) {
      await unlink(file.path);

      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

router.get("/:filepath", (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];

  const { filepath } = req.params as { filepath: string };

  const baseDir = path.resolve("/tmp/my-uploads");
  const fullPath = path.resolve(baseDir, filepath);

  if (!fullPath.startsWith(baseDir)) {
    return res.status(403).json({ message: "Access Denied: Invalid path" });
  }

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
    };

    return res.download(fullPath, (err) => {
      if (err && !res.headersSent) {
        return res.status(404).json({ message: "File not found" });
      }
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
