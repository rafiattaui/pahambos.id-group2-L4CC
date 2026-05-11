import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  imageUrl: string;
  imageKey: string; // public id for transformation and deletion.
}

/**
 * Uploads a File object to Cloudinary.
 * Converts File → ArrayBuffer → Buffer for the Node SDK.
 */
export async function uploadImage(
  file: File,
  folder = 'quiz-app'
): Promise<UploadResult> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result)
          return reject(error ?? new Error('Upload failed'));
        resolve({
          imageUrl: result.secure_url,
          imageKey: result.public_id,
        });
      }
    );
    stream.end(buffer);
  });
}

/** Deletes an image by its public_id. Useful for rollback on error. */
export async function deleteImage(imageKey: string): Promise<void> {
  await cloudinary.uploader.destroy(imageKey);
}
