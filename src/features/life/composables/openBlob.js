/** Opens a downloaded file (an ApiResponseHandler result whose data is a Blob) in a new tab, or saves it when pop-ups are blocked. */
export function openBlob(res, fileName = "document") {
  if (!res?.success || !(res.data instanceof Blob)) return false;
  const url = URL.createObjectURL(res.data);
  const w = window.open(url, "_blank", "noopener");
  if (!w) {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return true;
}
