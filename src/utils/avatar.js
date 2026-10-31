import maleImg from "@/assets/img/male.png";
import femaleImg from "@/assets/img/female.png";
import profileImg from "@/assets/img/profile.png";

// Default picture for a person without a photo
export function genderAvatar(gender) {
  const g = String(gender || "").trim().toLowerCase();
  if (g === "f" || g.startsWith("female")) return femaleImg;
  if (g === "m" || g.startsWith("male")) return maleImg;
  return profileImg;
}

// A stored photo as an <img> src: URLs and data URIs as they are, raw base64 gets a data URI prefix
export function photoSrc(photo) {
  if (!photo || typeof photo !== "string") return "";
  const p = photo.trim();
  if (!p) return "";
  if (/^(data:|https?:|blob:|\/)/i.test(p)) return p;
  const mime = p.startsWith("/9j/") ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${p}`;
}

// First photo field a person record carries
export function personPhoto(person) {
  if (!person) return "";
  return person.profile || person.photoBase64 || person.profilePictureBase64 || person.photoUrl || "";
}
