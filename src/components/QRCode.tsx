
import { useEffect, useRef } from "react";
import { Outpass } from "@/lib/types";
import QRCodeGenerator from "qrcode";

interface QRCodeProps {
  outpass: Outpass;
  size?: number;
}

export function QRCode({ outpass, size = 150 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (canvasRef.current && outpass.id) {
      // Create QR that links to the outpass detail view
      const appUrl = window.location.origin;
      const qrData = `${appUrl}/scan/${outpass.id}`;
      
      QRCodeGenerator.toCanvas(canvasRef.current, qrData, {
        width: size,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
    }
  }, [outpass.id, size]);
  
  return <canvas ref={canvasRef} />;
}
