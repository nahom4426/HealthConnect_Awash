// Documents (contract 2026-10, G7). Each upload is a new version of that owner's documentType; the
// current one has latest=true. Issued policies' documents are locked (delete returns 409).
import { lifeApi } from "./lifeClient";

/** POST /document · query: ownerType* (APPLICATION | INSURED | BENEFICIARY | CUSTOMER | POLICY | CLAIM), ownerUuid*, documentType* · body: multipart "file" */
export function uploadDocument(formData, params = {}) {
  return lifeApi().post(`/document`, formData, { params, headers: { "Content-Type": "multipart/form-data" } });
}
/** GET /document/list · query: ownerType*, ownerUuid* · returns: LifeDocumentResponse[] (every version) */
export function getDocuments(params = {}) {
  return lifeApi().get(`/document/list`, { params });
}
/** GET /document/{documentUuid}/open · returns: file */
export function openDocument(documentUuid) {
  return lifeApi().get(`/document/${documentUuid}/open`, { responseType: "blob" });
}
/** DELETE /document/{documentUuid} · 409 for an issued policy's document */
export function deleteDocument(documentUuid) {
  return lifeApi().delete(`/document/${documentUuid}`);
}
