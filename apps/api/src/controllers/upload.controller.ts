import { Request, Response, NextFunction } from "express";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import multer from "multer";

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "products");

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer disk storage for multipart file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const uniqueId = crypto.randomBytes(8).toString("hex");
    const safeName = file.originalname
      .replace(ext, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 30);
    cb(null, `vyre-${safeName}-${uniqueId}${ext}`);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, PNG, WebP, AVIF, GIF) are allowed."));
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter,
});

export class UploadController {
  /**
   * Upload one or multiple images via multipart/form-data or base64 JSON payload
   */
  async uploadImages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const results: { url: string; altText?: string; filename: string }[] = [];
      const host = req.get("host") || "localhost:5000";
      const protocol = req.protocol || "http";
      const baseUrl = `${protocol}://${host}`;

      // 1. Handle multipart files if uploaded via form-data
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        for (const file of req.files) {
          const fileUrl = `${baseUrl}/uploads/products/${file.filename}`;
          results.push({
            url: fileUrl,
            altText: file.originalname,
            filename: file.filename,
          });
        }
      } else if (req.file) {
        const fileUrl = `${baseUrl}/uploads/products/${req.file.filename}`;
        results.push({
          url: fileUrl,
          altText: req.file.originalname,
          filename: req.file.filename,
        });
      }

      // 2. Handle base64 encoded images if uploaded via JSON body
      const base64List = Array.isArray(req.body.images)
        ? req.body.images
        : req.body.image
          ? [{ data: req.body.image, name: req.body.name }]
          : [];

      for (const item of base64List) {
        const rawData = typeof item === "string" ? item : item.data;
        const rawName = (typeof item === "object" && item.name) || "product-image";

        if (!rawData || typeof rawData !== "string") continue;

        // Parse data URL: data:image/png;base64,xxxx
        const matches = rawData.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
        let ext = ".jpg";
        let base64Buffer: Buffer;

        if (matches) {
          const mimeSub = matches[1].toLowerCase();
          ext = mimeSub === "jpeg" ? ".jpg" : `.${mimeSub}`;
          base64Buffer = Buffer.from(matches[2], "base64");
        } else {
          base64Buffer = Buffer.from(rawData, "base64");
        }

        const uniqueId = crypto.randomBytes(8).toString("hex");
        const safeBase = rawName
          .replace(/\.[^/.]+$/, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 30);
        const filename = `vyre-${safeBase}-${uniqueId}${ext}`;
        const filePath = path.join(UPLOADS_DIR, filename);

        await fs.promises.writeFile(filePath, base64Buffer);

        results.push({
          url: `${baseUrl}/uploads/products/${filename}`,
          altText: rawName,
          filename,
        });
      }

      if (results.length === 0) {
        res.status(400).json({
          success: false,
          error: "No valid image files or base64 payloads provided for upload.",
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: `Successfully uploaded ${results.length} image(s).`,
        data: {
          urls: results.map((r) => r.url),
          images: results.map((r, idx) => ({
            url: r.url,
            altText: r.altText,
            displayOrder: idx,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const uploadController = new UploadController();
