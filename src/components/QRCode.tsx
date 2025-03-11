
import { useState } from 'react';
import { Outpass } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import QRCodeLib from 'qrcode';
import { Download, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRCodeProps {
  outpass: Outpass;
  onClose?: () => void;
}

export function QRCode({ outpass, onClose }: QRCodeProps) {
  const { toast } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  
  useState(() => {
    // Generate QR code data URL
    QRCodeLib.toDataURL(
      JSON.stringify({
        id: outpass.id,
        student: outpass.studentName,
        enrollmentNumber: outpass.enrollmentNumber,
        exitDateTime: outpass.exitDateTime
      }),
      {
        width: 200,
        margin: 1,
        color: {
          dark: '#000',
          light: '#fff'
        }
      },
      (err, url) => {
        if (err) {
          console.error(err);
          return;
        }
        setQrDataUrl(url);
      }
    );
  }, [outpass]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(outpass.id);
    toast({
      title: "Copied!",
      description: "Outpass ID copied to clipboard",
    });
  };

  const handleDownloadPDF = async () => {
    // Create a new jsPDF instance
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Create a canvas element to render the QR code with logo
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = 200;
    canvas.height = 200;
    
    // Draw QR code
    const qrImage = new Image();
    qrImage.src = qrDataUrl;
    
    // Wait for QR code image to load
    await new Promise(resolve => {
      qrImage.onload = resolve;
    });
    
    // Draw QR code
    ctx.drawImage(qrImage, 0, 0, 200, 200);
    
    // Load and draw logo in center
    const logoImg = new Image();
    logoImg.src = '/lovable-uploads/945f9f70-9eb7-406e-bf17-148621ddf5cb.png';
    
    // Wait for logo to load
    await new Promise(resolve => {
      logoImg.onload = resolve;
    });
    
    // Draw logo in center of QR code (with 30% size of QR code)
    const logoSize = 60; // 30% of 200
    const logoX = (200 - logoSize) / 2;
    const logoY = (200 - logoSize) / 2;
    
    // Add white background behind logo
    ctx.fillStyle = 'white';
    ctx.fillRect(logoX, logoY, logoSize, logoSize);
    
    // Draw logo
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    
    // Convert canvas to data URL and add to PDF
    const finalQRCode = canvas.toDataURL('image/png');
    
    // Add university logo at top
    pdf.addImage('/lovable-uploads/945f9f70-9eb7-406e-bf17-148621ddf5cb.png', 'PNG', 85, 10, 40, 40);
    
    // Add title
    pdf.setFontSize(22);
    pdf.setTextColor(0, 0, 128);
    pdf.text('AMITY UNIVERSITY', 105, 60, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('STUDENT OUTPASS', 105, 70, { align: 'center' });
    
    // Add horizontal line
    pdf.setLineWidth(0.5);
    pdf.line(20, 75, 190, 75);
    
    // Add outpass details
    pdf.setFontSize(12);
    
    pdf.text(`Outpass ID: ${outpass.id}`, 20, 90);
    pdf.text(`Student: ${outpass.studentName}`, 20, 100);
    pdf.text(`Enrollment No: ${outpass.enrollmentNumber}`, 20, 110);
    pdf.text(`Exit Time: ${formatDateTime(outpass.exitDateTime)}`, 20, 120);
    pdf.text(`Reason: ${outpass.reason}`, 20, 130);
    pdf.text(`Approved By: ${outpass.mentorName || 'Pending'}`, 20, 140);
    pdf.text(`Status: ${outpass.status.toUpperCase()}`, 20, 150);
    
    // Add QR code
    pdf.addImage(finalQRCode, 'PNG', 65, 160, 80, 80);
    
    // Add disclaimer
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('This outpass must be shown to security personnel when exiting the campus.', 105, 250, { align: 'center' });
    
    // Add footer
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text('© Amity University - AmiPass System', 105, 280, { align: 'center' });
    
    // Generate timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Save the PDF
    pdf.save(`outpass-${outpass.enrollmentNumber}-${timestamp}.pdf`);
    
    toast({
      title: "Success!",
      description: "Outpass PDF downloaded successfully",
    });
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h2 className="text-xl font-semibold mb-4">Your Outpass QR Code</h2>
      
      <div className="mb-6 p-2 bg-white rounded-md shadow-md relative">
        {qrDataUrl ? (
          <div className="relative">
            <img src={qrDataUrl} alt="Outpass QR Code" className="w-64 h-64" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white p-2 rounded-md">
                <img 
                  src="/lovable-uploads/945f9f70-9eb7-406e-bf17-148621ddf5cb.png" 
                  alt="Amity University" 
                  className="w-12 h-12 object-contain"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-64 h-64 bg-gray-100 flex items-center justify-center">
            Loading QR Code...
          </div>
        )}
      </div>
      
      <div className="space-y-2 w-full max-w-xs">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">ID:</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono">{outpass.id.substring(0, 10)}...</span>
            <Button variant="ghost" size="icon" onClick={handleCopyId}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Exit Time:</span>
          <span className="text-sm">{formatDateTime(outpass.exitDateTime)}</span>
        </div>
        
        <div className="pt-4">
          <Button className="w-full" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
