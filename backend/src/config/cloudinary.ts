import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (
  filePath: string,
  folder: string,
): Promise<UploadApiResponse> => {
  const options: UploadApiOptions = {
    folder,
    resource_type: "image",
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  };

  return cloudinary.uploader.upload(filePath, options);
};

export default cloudinary;
