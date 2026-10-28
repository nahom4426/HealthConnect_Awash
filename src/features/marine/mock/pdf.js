// Certificate PDF for the mock backend (the real one renders it server-side, MAR-37).
// One A4 page: insurer header, certificate facts, cover, LC loss payee and a QR code to the
// public verify page.
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { formatAmount } from "../utils/money";
import { formatDate } from "../utils/format";
import { clauseLabel, modeLabel } from "../constants";

export async function buildCertificatePdf(cert, quote, verifyLink) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const qr = await QRCode.toDataURL(verifyLink, { margin: 0, width: 240 });

  doc.setFillColor(12, 74, 110);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Standard Insurance S.C.", 15, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Marine Cargo Insurance Certificate", 15, 20);
  doc.text(`${cert.certNo}  ·  version ${cert.version}`, 195, 13, { align: "right" });
  doc.text(`Policy ${cert.policy?.policyNo ?? ""}`, 195, 20, { align: "right" });

  doc.setTextColor(20);
  let y = 40;
  const row = (label, value) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(label, 15, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(String(value ?? "—"), 120);
    doc.text(lines, 60, y);
    y += 6 * lines.length;
  };

  row("Insured", cert.insured?.name);
  row("Vessel", cert.vessel ? `${cert.vessel.name} (IMO ${cert.vessel.imo}, ${cert.vessel.flag})` : modeLabel(quote.mode));
  row("Voyage", `${cert.loadingPort?.name ?? "—"} to ${cert.dischargePort?.name ?? "—"}, then ${cert.finalDestination ?? "—"}`);
  row("Sailing date", formatDate(cert.sailingDate));
  row("Goods", cert.goodsDescription);
  if (quote.packing) row("Packing", quote.packing);
  if (quote.blNo) row("Bill of lading", quote.blNo);
  if (quote.containers?.length) row("Containers", quote.containers.join(", "));
  row("Sum insured", `${cert.currency} ${formatAmount(cert.sumInsured)} (invoice + freight + 10%)`);
  y += 2;
  row("Conditions", `Institute Cargo Clauses ${clauseLabel(quote.clause).replace("ICC ", "(")})${quote.warCover ? ", Institute War Clauses (Cargo)" : ""}${quote.strikesCover ? ", Institute Strikes Clauses (Cargo)" : ""}`);
  if (quote.deductible) row("Deductible", `${quote.currency} ${formatAmount(quote.deductible)}`);
  if (quote.specialConditions) row("Special conditions", quote.specialConditions);
  if (quote.lc?.enabled) row("Loss payee", `${cert.lcBank?.name ?? "Issuing bank"} under LC ${quote.lc.number}`);
  y += 4;
  row("Issued", formatDate(cert.issuedAt));

  doc.addImage(qr, "PNG", 155, 230, 40, 40);
  doc.setFontSize(8);
  doc.setTextColor(90);
  doc.text("Scan to verify this certificate", 175, 275, { align: "center" });
  doc.text(doc.splitTextToSize("Claims: notify Standard Insurance S.C. and the nearest Lloyd's agent immediately. This certificate is not valid unless it verifies online.", 125), 15, 240);

  return doc.output("blob");
}
