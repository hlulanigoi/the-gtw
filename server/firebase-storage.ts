import admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";
import crypto from "crypto";
import logger from "./logger";

// Initialize Firebase Storage
let storage: ReturnType<typeof getStorage> | null = null;

export function getFirebaseStorage() {
  if (!storage) {
    try {
      storage = getStorage();
    } catch (error) {
      logger.error("Firebase Storage initialization failed", { error });
      throw new Error("Firebase Storage not initialized");
    }
  }
  return storage;
}

export interface UploadResult {
  url: string;
  path: string;
  filename: string;
}

/**
 * Upload a photo to Firebase Storage
 * @param base64Data - Base64 encoded image data
 * @param folder - Storage folder (e.g., 'parcels', 'pickup', 'delivery')
 * @param filename - Optional custom filename
 * @returns Upload result with public URL
 */
export async function uploadPhoto(
  base64Data: string,
  folder: string,
  filename?: string
): Promise<UploadResult> {
  try {
    // Remove data URI prefix if present
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Image, "base64");

    // Generate unique filename if not provided
    const randomId = crypto.randomBytes(16).toString("hex");
    const timestamp = Date.now();
    const finalFilename = filename || `${timestamp}-${randomId}.jpg`;
    const filePath = `${folder}/${finalFilename}`;

    const bucket = getFirebaseStorage().bucket();
    const file = bucket.file(filePath);

    // Upload file
    await file.save(buffer, {
      metadata: {
        contentType: "image/jpeg",
        metadata: {
          uploadedAt: new Date().toISOString(),
        },
      },
      public: true, // Make file publicly accessible
    });

    // Get public URL
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    logger.info("Photo uploaded successfully", {
      path: filePath,
      size: buffer.length,
    });

    return {
      url: publicUrl,
      path: filePath,
      filename: finalFilename,
    };
  } catch (error) {
    logger.error("Photo upload failed", { error, folder });
    throw new Error("Failed to upload photo");
  }
}

/**
 * Delete a photo from Firebase Storage
 * @param filePath - Full path to file in storage
 */
export async function deletePhoto(filePath: string): Promise<boolean> {
  try {
    const bucket = getFirebaseStorage().bucket();
    const file = bucket.file(filePath);
    await file.delete();
    logger.info("Photo deleted successfully", { path: filePath });
    return true;
  } catch (error) {
    logger.error("Photo deletion failed", { error, path: filePath });
    return false;
  }
}

/**
 * Upload multiple photos at once
 * @param photos - Array of {data: base64, folder: string}
 */
export async function uploadMultiplePhotos(
  photos: Array<{ data: string; folder: string; filename?: string }>
): Promise<UploadResult[]> {
  const uploadPromises = photos.map((photo) =>
    uploadPhoto(photo.data, photo.folder, photo.filename)
  );
  return await Promise.all(uploadPromises);
}
