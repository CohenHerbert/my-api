import express, { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import multer from "multer";
// import { db } from "@/prisma/db";

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
        error: "Unable to scan directory",
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

    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    console.log(file.filename);

    // const newFile = await db.orm.public.File.create({
    //   originalName: file.filename,
    //   storedName: "",
    //   mimeType: "",
    //   size: 1,
    //   path: "",

    //   ownerId: "",
    // });

    res.status(200).json({
      filename: file.filename,
      url: `http://localhost:3000/files/${file.filename}`,
    });
  },
);

router.get("/:filepath", (req: Request, res: Response) => {
  const token = req.headers["authorization"];

  const { filepath } = req.params as { filepath: string };

  const baseDir = path.resolve("/tmp/my-uploads");
  const fullPath = path.resolve(baseDir, filepath);

  if (!fullPath.startsWith(baseDir)) {
    return res.status(403).json({ error: "Access Denied: Invalid path" });
  }

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return res.download(fullPath, (err) => {
      if (err && !res.headersSent) {
        return res.status(404).json({ error: "File not found" });
      }
    });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
