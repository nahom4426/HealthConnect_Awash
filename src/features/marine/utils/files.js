// Upload rules for claim documents (plan section 3, FileUploader): PDF, JPG or PNG, at most 20 MB each.
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

/** Message for a file that can't be uploaded, or "" when it's fine. */
export function fileError(file) {
  if (!FILE_TYPES.includes(file.type)) return `${file.name}: only PDF, JPG and PNG files can be uploaded`;
  if (file.size > MAX_FILE_BYTES) return `${file.name}: files can be at most 20 MB`;
  return "";
}

export const formatSize = (bytes) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
