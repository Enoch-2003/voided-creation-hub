
import { jsPDF } from "jspdf";
import { Outpass } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export const generateOutpassPDF = (outpass: Outpass, serialCode: string, isVerified: boolean): void => {
  if (!outpass) return;
  
  // Ensure we have the serial code
  const actualSerialCode = outpass.serialCode || serialCode || `AUMP-XYZ-${outpass.id.substring(0, 6).toUpperCase()}`;
  
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  
  pdf.setFontSize(18);
  pdf.text("AmiPass - Campus Exit Permit", 105, 20, { align: "center" });
  
  pdf.setFontSize(14);
  pdf.text(`Verification Status: ${isVerified ? 'Verified' : 'Newly Verified'}`, 105, 30, { align: "center" });
  pdf.text(`Verification Time: ${formatDateTime(outpass.scanTimestamp || new Date().toISOString())}`, 105, 38, { align: "center" });
  
  pdf.setDrawColor(200, 200, 200);
  pdf.line(20, 45, 190, 45);
  
  pdf.setFontSize(12);
  pdf.text("Exit Permit Details", 20, 55);
  
  pdf.setFontSize(10);
  pdf.text(`Student Name: ${outpass.studentName}`, 20, 65);
  pdf.text(`Enrollment Number: ${outpass.enrollmentNumber}`, 20, 73);
  pdf.text(`Section: ${outpass.studentSection || 'N/A'}`, 20, 81);
  pdf.text(`Exit Date & Time: ${formatDateTime(outpass.exitDateTime)}`, 20, 89);
  pdf.text(`Reason: ${outpass.reason}`, 20, 97);
  pdf.text(`Serial Code: ${actualSerialCode}`, 20, 105);
  
  pdf.setFontSize(12);
  pdf.text("Approval Information", 20, 120);
  
  pdf.setFontSize(10);
  pdf.text(`Status: Approved`, 20, 130);
  pdf.text(`Approved By: ${outpass.mentorName || "Not specified"}`, 20, 138);
  pdf.text(`Approved On: ${formatDateTime(outpass.updatedAt)}`, 20, 146);
  
  pdf.setFontSize(8);
  pdf.setTextColor(255, 0, 0);
  pdf.text("THIS OUTPASS IS VALID FOR ONE-TIME USE ONLY", 105, 170, { align: "center" });
  pdf.setTextColor(0, 0, 0);
  
  pdf.setFontSize(8);
  pdf.text("This outpass has been verified by the AmiPass system.", 105, 220, { align: "center" });
  pdf.text("Please show this to the security personnel when exiting the campus.", 105, 225, { align: "center" });
  pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 230, { align: "center" });
  
  pdf.save(`AmiPass-Verification-${outpass.id}.pdf`);
};
