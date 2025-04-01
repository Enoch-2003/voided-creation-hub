
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import storageSync from "@/lib/storageSync";
import { Outpass } from "@/lib/types";

// Import refactored components
import { VerificationStatus } from "@/components/OutpassVerify/VerificationStatus";
import { ExpiredDialog } from "@/components/OutpassVerify/ExpiredDialog";
import { VerificationCard } from "@/components/OutpassVerify/VerificationCard";
import { generateOutpassPDF } from "@/components/OutpassVerify/PDFGenerator";

export default function OutpassVerify() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [outpass, setOutpass] = useState<Outpass | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serialCode, setSerialCode] = useState<string>("");
  const [showExpiredDialog, setShowExpiredDialog] = useState(false);
  const [alreadyScanned, setAlreadyScanned] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  
  const navigateBack = () => {
    const returnPath = sessionStorage.getItem("return_from_verification");
    
    if (returnPath) {
      // Clear the return path
      sessionStorage.removeItem("return_from_verification");
      navigate(returnPath);
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      const currentUser = storageSync.getUser();
      const currentUserRole = storageSync.getUserRole();
      
      if (currentUser) {
        if (currentUserRole === 'student') {
          navigate("/student");
        } else if (currentUserRole === 'mentor') {
          navigate("/mentor");
        } else if (currentUserRole === 'admin') {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else {
        navigate("/");
      }
    }
  };
  
  useEffect(() => {
    if (!id) {
      setError("Invalid outpass ID");
      setIsLoading(false);
      return;
    }
    
    const fetchOutpass = async () => {
      try {
        console.log("Fetching outpass with ID:", id);
        
        // Fetch from Supabase first
        const { data: outpassData, error: outpassError } = await supabase
          .from("outpasses")
          .select("*")
          .eq("id", id)
          .single();
        
        if (outpassError) {
          console.error("Error fetching from Supabase:", outpassError);
          throw outpassError;
        }
        
        if (!outpassData) {
          throw new Error("Outpass not found in database");
        }
        
        console.log("Found outpass in Supabase:", outpassData);
        
        // Process the outpass from Supabase
        const mappedOutpass: Outpass = {
          id: outpassData.id,
          studentId: outpassData.student_id,
          studentName: outpassData.student_name,
          enrollmentNumber: outpassData.enrollment_number,
          exitDateTime: outpassData.exit_date_time,
          reason: outpassData.reason,
          status: outpassData.status as "pending" | "approved" | "denied",
          mentorId: outpassData.mentor_id,
          mentorName: outpassData.mentor_name,
          qrCode: outpassData.qr_code,
          createdAt: outpassData.created_at,
          updatedAt: outpassData.updated_at,
          scanTimestamp: outpassData.scan_timestamp,
          denyReason: outpassData.deny_reason,
          studentSection: outpassData.student_section,
          serialCode: outpassData.serial_code
        };
        
        processOutpass(mappedOutpass);
      } catch (dbError) {
        console.error("Database fetch error:", dbError);
        
        // If not found in Supabase, try local storage as fallback
        try {
          const storedOutpasses = localStorage.getItem("outpasses");
          if (!storedOutpasses) {
            setError("Outpass not found");
            setIsLoading(false);
            return;
          }
          
          const allOutpasses = JSON.parse(storedOutpasses);
          const foundOutpass = allOutpasses.find((o: any) => o.id === id);
          
          if (!foundOutpass) {
            setError("Outpass not found");
            setIsLoading(false);
            return;
          }
          
          console.log("Found outpass in localStorage:", foundOutpass);
          processOutpass(foundOutpass);
        } catch (localError) {
          console.error("LocalStorage fetch error:", localError);
          setError("Error loading outpass data");
          setIsLoading(false);
        }
      }
    };
    
    fetchOutpass();
  }, [id]);
  
  const processOutpass = async (foundOutpass: Outpass) => {
    if (foundOutpass.status !== "approved") {
      setError("This outpass has not been approved");
      setIsLoading(false);
      return;
    }
    
    // Check if the outpass has already been scanned before
    if (foundOutpass.scanTimestamp) {
      setAlreadyScanned(true);
      setIsVerified(true);
      
      // Check if this is a return visit by looking for a flag in sessionStorage
      const hasViewedBefore = sessionStorage.getItem(`outpass_viewed_${id}`);
      if (hasViewedBefore) {
        setIsFirstVisit(false);
        // Immediately show the dialog for subsequent visits
        setTimeout(() => {
          setShowExpiredDialog(true);
        }, 500);
      }
    }
    
    let prefix = "XYZ";
    
    try {
      // Try to get serial code prefix from database
      const { data: serialLogs, error: serialError } = await supabase
        .from("serial_code_logs")
        .select("prefix")
        .order("created_at", { ascending: false })
        .limit(1);
      
      if (serialError) throw serialError;  
        
      if (serialLogs && serialLogs.length > 0) {
        prefix = serialLogs[0].prefix;
        console.log("Using prefix from database:", prefix);
      } else {
        // Fallback to local storage
        const serialCodeLogs = localStorage.getItem("serialCodeLogs");
        if (serialCodeLogs) {
          try {
            const logs = JSON.parse(serialCodeLogs);
            if (logs && logs.length > 0) {
              const sortedLogs = logs.sort((a: any, b: any) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              
              if (sortedLogs.length > 0 && sortedLogs[0].prefix) {
                prefix = sortedLogs[0].prefix;
                console.log("Using prefix from localStorage:", prefix);
              }
            }
          } catch (error) {
            console.error("Error parsing serial code logs:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error getting serial prefix:", error);
    }
    
    if (foundOutpass.serialCode) {
      console.log("Using existing serial code:", foundOutpass.serialCode);
      setSerialCode(foundOutpass.serialCode);
    } else {
      // Generate a random 6-digit number for the serial code
      const generatedRandomDigits = Math.floor(100000 + Math.random() * 900000).toString();
      const newSerialCode = `AUMP-${prefix}-${generatedRandomDigits}`;
      setSerialCode(newSerialCode);
      
      try {
        // Update the outpass with the new serial code in Supabase
        const { error: updateError } = await supabase
          .from("outpasses")
          .update({ serial_code: newSerialCode })
          .eq("id", foundOutpass.id);
        
        if (updateError) throw updateError;
        
        console.log("Updated serial code in database:", newSerialCode);
        
        // Also update in localStorage if we're using it
        const storedOutpasses = localStorage.getItem("outpasses");
        if (storedOutpasses) {
          const allOutpasses = JSON.parse(storedOutpasses);
          const updatedOutpasses = allOutpasses.map((o: Outpass) => {
            if (o.id === id) {
              return {
                ...o,
                serialCode: newSerialCode
              };
            }
            return o;
          });
          
          localStorage.setItem("outpasses", JSON.stringify(updatedOutpasses));
        }
        
        foundOutpass.serialCode = newSerialCode;
      } catch (error) {
        console.error("Error updating serial code:", error);
      }
    }
    
    // If outpass wasn't previously scanned, mark it as scanned now
    if (!foundOutpass.scanTimestamp) {
      const scanTimestamp = new Date().toISOString();
      
      try {
        // Update Supabase
        const { error: scanError } = await supabase
          .from("outpasses")
          .update({ 
            scan_timestamp: scanTimestamp,
            serial_code: foundOutpass.serialCode || serialCode 
          })
          .eq("id", foundOutpass.id);
        
        if (scanError) throw scanError;
        
        console.log("Updated scan timestamp in database:", scanTimestamp);
        
        // Update local storage as well
        const storedOutpasses = localStorage.getItem("outpasses");
        if (storedOutpasses) {
          const allOutpasses = JSON.parse(storedOutpasses);
          const updatedOutpasses = allOutpasses.map((o: Outpass) => {
            if (o.id === id) {
              return {
                ...o,
                scanTimestamp,
                serialCode: foundOutpass.serialCode || serialCode
              };
            }
            return o;
          });
          
          localStorage.setItem("outpasses", JSON.stringify(updatedOutpasses));
        }
        
        foundOutpass.scanTimestamp = scanTimestamp;
        if (!foundOutpass.serialCode && serialCode) {
          foundOutpass.serialCode = serialCode;
        }
      } catch (error) {
        console.error("Error updating scan timestamp:", error);
      }
    }
    
    setOutpass(foundOutpass);
    setIsLoading(false);
  };

  // Set session storage flag on first load if it's already scanned
  useEffect(() => {
    if (!isLoading && outpass && alreadyScanned && isFirstVisit && id) {
      // Mark this as viewed for future visits
      sessionStorage.setItem(`outpass_viewed_${id}`, 'true');
    }
  }, [isLoading, outpass, alreadyScanned, isFirstVisit, id]);
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(serialCode);
    toast.success("Serial code copied to clipboard");
  };
  
  const handleDownloadPDF = () => {
    if (!outpass) return;
    generateOutpassPDF(outpass, serialCode, isVerified);
    toast.success("Verification PDF downloaded successfully");
  };
  
  const handleNavigateToStudent = () => {
    // Mark that this outpass has been viewed in this session
    if (id) {
      sessionStorage.setItem(`outpass_viewed_${id}`, 'true');
    }
    navigateBack();
  };
  
  const handleExpiredDialogClose = () => {
    setShowExpiredDialog(false);
    navigateBack();
  };
  
  if (isLoading || error || !outpass) {
    return (
      <VerificationStatus 
        isLoading={isLoading} 
        error={error} 
        navigateBack={navigateBack} 
      />
    );
  }
  
  return (
    <>
      <ExpiredDialog
        open={showExpiredDialog}
        onOpenChange={setShowExpiredDialog}
        scanTimestamp={outpass?.scanTimestamp}
        serialCode={outpass?.serialCode}
        onClose={handleExpiredDialogClose}
        onDownload={handleDownloadPDF}
      />
      
      <VerificationCard
        outpass={outpass}
        serialCode={serialCode}
        isVerified={isVerified}
        onCopyToClipboard={handleCopyToClipboard}
        onDownloadPDF={handleDownloadPDF}
        onNavigateToStudent={handleNavigateToStudent}
      />
    </>
  );
}
