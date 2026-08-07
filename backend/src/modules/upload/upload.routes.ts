import fs from "fs";
import { Router, Request, Response } from "express";
import { upload } from "../../middleware/upload.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { uploadImage } from "../../config/cloudinary";

const router = Router();

// POST /upload — authenticate, upload single image
router.post("/", authenticate, upload.single("image"), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No image file provided" });
      return;
    }

    const folder = process.env.CLOUDINARY_FOLDER || "my-church-platform";
    const uploadResult = await uploadImage(req.file.path, folder);

    fs.unlink(req.file.path, () => {});

    res.status(201).json({
      success: true,
      data: {
        url: uploadResult.secure_url,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to upload image";
    res.status(400).json({ success: false, message });
  }
});

export default router;