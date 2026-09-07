import express, { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import multer from "multer";
import { db } from "@/prisma/db";
import { unlink } from "node:fs/promises";
import authenticateToken from "@/middleware/auth";

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
  authenticateToken,
  upload.single("file"),
  async (req: Request, res: Response) => {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file provided" });
    }

    try {
      const decoded = req.user as {
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

      res.status(500).json({ message: "Internal server error" });
    }
  },
);

router.get(
  "/:filepath",
  authenticateToken,
  async (req: Request, res: Response) => {
    const { filepath } = req.params as { filepath: string };

    const baseDir = path.resolve("/tmp/my-uploads");
    const fullPath = path.resolve(baseDir, filepath);

    if (!fullPath.startsWith(baseDir)) {
      return res.status(403).json({ message: "Access Denied: Invalid path" });
    }

    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Missing session context" });
    }

    const userId = req.user.userId;

    try {
      const fileRecord = await db.orm.public.File.where({
        path: fullPath,
        userId: userId,
      });

      if (!fileRecord) {
        return res.status(404).json({ message: "File not found" });
      }

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
  },
);

export default router;
