import { uploadFile } from "@/shared/lib/storage/file-storage";

export const uploadService = {
  /**
   * Upload and process a single image
   */
  async uploadImage(file: File): Promise<string> {
    return uploadFile(file);
  },

  /**
   * Upload multiple images
   */
  async uploadImages(files: File[]): Promise<string[]> {
    return Promise.all(files.map(file => uploadFile(file)));
  },

  /**
   * Delete file (optional implementation if needed)
   */
  async deleteFile(url: string): Promise<void> {
    // In local storage, we would delete from /uploads folder
    // But for MVP we can skip or implement via fs.unlink
    console.log("Delete file requested:", url);
  }
};
