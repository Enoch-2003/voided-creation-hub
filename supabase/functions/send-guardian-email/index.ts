import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Mailjet from "npm:node-mailjet@3.3.4"; 
import { format } from "npm:date-fns@3.6.0";
import { toZonedTime, fromZonedTime } from "npm:date-fns-tz@3.0.0"; // fromZonedTime might not be needed if we rely on pre-formatted string

const mailjetApiKey = Deno.env.get("MAILJET_PUB_KEY");
const mailjetApiSecret = Deno.env.get("MAILJET_PRIV_KEY");
const siteUrl = Deno.env.get("SITE_URL");

if (!mailjetApiKey) {
  console.error("MAILJET_PUB_KEY is not configured in environment variables. This should be mapped from the MAILJET_API_KEY Supabase secret.");
}
if (!mailjetApiSecret) {
  console.error("MAILJET_PRIV_KEY is not configured in environment variables. This should be mapped from the MAILJET_API_SECRET Supabase secret.");
}
if (!siteUrl) {
  console.warn("SITE_URL environment variable is not set for the send-guardian-email function. The Amity logo in emails might not display correctly. Please set this in your Supabase project secrets and map it in config.toml.");
}

const mailjetClient = mailjetApiKey && mailjetApiSecret 
  ? Mailjet.connect(mailjetApiKey, mailjetApiSecret)
  : null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GuardianEmailRequest {
  studentName: string;
  exitDateTime: string; // Expected to be an ISO string (UTC) from frontend
  reason: string;
  guardianEmail: string;
  mentorName?: string | null; 
  mentorEmail?: string | null;
  mentorContact?: string | null;
  studentSection?: string;
  formattedExitDateTime?: string; // Pre-formatted time string from frontend (e.g., "May 19, 2025, 9:15 AM")
}

const INDIAN_TIMEZONE = 'Asia/Kolkata';

// Fallback formatter: Convert UTC ISO string to Indian time display
const formatUtcToIndianTimeDisplay = (utcDateString: string): string => {
  try {
    const date = new Date(utcDateString); // Parses ISO string as UTC
    const indianTime = toZonedTime(date, INDIAN_TIMEZONE);
    // Format like: May 19, 2025, 9:15 AM (IST)
    return format(indianTime, "MMMM d, yyyy, h:mm a '(IST)'"); 
  } catch (error) {
    console.error("Error formatting UTC date to Indian time for display (fallback):", error, "Original string:", utcDateString);
    // Minimal fallback if primary formatting fails
    try {
        return new Date(utcDateString).toLocaleString("en-IN", { timeZone: INDIAN_TIMEZONE, hour12: true, year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }) + " (IST)";
    } catch (e) {
        console.error("Further error in minimal fallback date formatting:", e);
        return utcDateString + " (UTC)"; // Last resort
    }
  }
};


const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!mailjetClient) {
    console.error("Mailjet client is not initialized. Check MAILJET_PUB_KEY and MAILJET_PRIV_KEY configuration.");
    return new Response(
      JSON.stringify({ error: "Email service is not properly configured (missing API keys)." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const requestBody: GuardianEmailRequest = await req.json();
    console.log("Received request body for email function:", JSON.stringify(requestBody, null, 2));

    const {
      studentName,
      exitDateTime, // This is the UTC ISO string
      reason,
      guardianEmail,
      mentorName,
      mentorEmail,
      mentorContact,
      studentSection,
      formattedExitDateTime // This is the pre-formatted string from frontend
    } = requestBody;

    console.log("Received mentor details in request:", { name: mentorName, email: mentorEmail, contact: mentorContact });
    console.log("Received formattedExitDateTime from payload:", formattedExitDateTime);
    console.log("Received UTC exitDateTime from payload:", exitDateTime);


    // Check if mentor data exists and is not null/undefined
    const hasMentorData = mentorName && mentorEmail && mentorContact;
    
    // Only use "Not specified" if the value is null, undefined, empty string
    const mentorNameToUse = mentorName && String(mentorName).trim() !== "" ? 
      String(mentorName) : 
      "Not specified";
    
    const mentorEmailToUse = mentorEmail && String(mentorEmail).trim() !== "" ? 
      String(mentorEmail) : 
      "Not specified";
    
    const mentorContactToUse = mentorContact && String(mentorContact).trim() !== "" ? 
      String(mentorContact) : 
      "Not specified";
    
    console.log("Processed mentor details for email template:", { 
      name: mentorNameToUse, 
      email: mentorEmailToUse, 
      contact: mentorContactToUse,
      hasMentorData: hasMentorData
    });
    
    const senderEmail = Deno.env.get("MAILJET_FROM_EMAIL");
    if (!senderEmail) {
      console.error("Mailjet sender email (MAILJET_FROM_EMAIL) is not configured. This should be mapped from MAILJET_SENDER_EMAIL Supabase secret.");
      return new Response(
        JSON.stringify({ error: "Email service is not properly configured (missing sender email)." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    let actualSiteUrl = siteUrl || '';
    if (actualSiteUrl && !actualSiteUrl.startsWith('http://') && !actualSiteUrl.startsWith('https://')) {
      actualSiteUrl = 'https://' + actualSiteUrl; // Default to https if no protocol
      console.log("SITE_URL was missing protocol, prepended https. New URL:", actualSiteUrl);
    }
    const logoUrl = actualSiteUrl ? `${actualSiteUrl}/lovable-uploads/945f9f70-9eb7-406e-bf17-148621ddf5cb.png` : '';
    console.log("Constructed logo URL:", logoUrl || "Logo URL not generated (SITE_URL missing or empty)");

    let displayExitTime: string;
    let usedPreFormatted = false;

    if (formattedExitDateTime && typeof formattedExitDateTime === 'string' && formattedExitDateTime.trim() !== "") {
        displayExitTime = formattedExitDateTime;
        usedPreFormatted = true;
        console.log("Using pre-formatted time from frontend for email display:", displayExitTime);
    } else {
        console.warn("`formattedExitDateTime` was missing, empty, or not a string in payload. Falling back to formatting the UTC `exitDateTime` field.");
        displayExitTime = formatUtcToIndianTimeDisplay(exitDateTime); // Fallback to formatting the UTC string
        console.log("Fallback: Formatted UTC exitDateTime to Indian time for email display:", displayExitTime);
    }
    
    console.log("Final time determination for email:", {
      inputUtcExitDateTime: exitDateTime,
      inputFormattedExitDateTime: formattedExitDateTime,
      finalDisplayTimeInEmail: displayExitTime,
      wasPreFormattedSuccessfullyUsed: usedPreFormatted
    });

    const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Outpass Request Approval</title>
      <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; color: #333; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        .email-container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid #dee2e6;}
        .email-header { background: linear-gradient(135deg, #003366 0%, #004080 100%); color: #ffffff; padding: 30px 20px; text-align: center; }
        .email-header img { max-width: 180px; margin-bottom: 15px; }
        .email-header h1 { margin: 0; font-size: 26px; font-weight: 600; }
        .email-header p { margin: 5px 0 0; font-size: 16px; font-weight: 300; opacity: 0.9; }
        .email-content { padding: 30px; color: #495057; line-height: 1.65; }
        .email-content h2 { color: #003366; font-size: 22px; margin-top: 0; margin-bottom: 20px; font-weight: 600; border-bottom: 2px solid #e9ecef; padding-bottom: 10px; }
        .email-content p { font-size: 16px; margin-bottom: 18px; }
        .details-box { background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px; border-left: 4px solid #0056b3; }
        .details-box table { width: 100%; font-size: 15px; border-collapse: collapse; }
        .details-box td { padding: 10px 0; vertical-align: top; }
        .details-box td:first-child { font-weight: 600; width: 150px; color: #343a40; }
        .details-box tr:not(:last-child) td { border-bottom: 1px solid #e9ecef; }
        .mentor-box { background-color: #fff9e6; padding: 20px; border-radius: 6px; margin: 25px 0; border: 1px solid #ffe58f; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .mentor-box h3 { margin-top: 0; margin-bottom: 15px; font-size: 18px; color: #ff8c00; font-weight: 600; }
        .mentor-box table td:first-child { width: 100px; }
        .mentor-box a { color: #0056b3; text-decoration: none; font-weight: 500; }
        .mentor-box a.contact-button { display: inline-block; background-color: #28a745; color: white !important; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: 500; }
        .note-box { background-color: #e6f7ff; border-left: 4px solid #007bff; padding: 15px; margin-bottom: 25px; font-size: 15px; }
        .note-box strong { color: #0056b3; }
        .email-footer { background-color: #343a40; color: #adb5bd; padding: 25px; text-align: center; font-size: 13px; }
        .email-footer p { margin: 0 0 5px 0; }
        .email-footer a { color: #ced4da; text-decoration: none; }
        .strong { font-weight: 600; color: #003366; }
      </style>
    </head>
    <body>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f4f7f6">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <div class="email-container">
              <div class="email-header">
                ${logoUrl ? 
                  `<img src="${logoUrl}" alt="Amity University Logo">` : 
                  '<h1>Amity University</h1>'
                }
                <p>Outpass Management System</p>
              </div>
              
              <div class="email-content">
                <h2>Outpass Request – Action Required</h2>
                <p>Dear Guardian,</p>
                <p>This email is to inform you that your ward, <span class="strong">${studentName}</span> (Section: ${studentSection || 'N/A'}), has submitted an outpass request with the following details:</p>
                
                <div class="details-box">
                  <table>
                    <tr>
                      <td>Exit Time:</td>
                      <td>${displayExitTime}</td>
                    </tr>
                    <tr>
                      <td>Reason:</td>
                      <td>${reason}</td>
                    </tr>
                  </table>
                </div>
                
                <p>To approve this request, please contact the assigned mentor:</p>
                
                <div class="mentor-box">
                  <h3>MENTOR DETAILS</h3>
                  <table>
                    <tr>
                      <td>Name:</td>
                      <td>${mentorNameToUse}</td>
                    </tr>
                    <tr>
                      <td>Email:</td>
                      <td>${mentorEmailToUse !== "Not specified" ? `<a href="mailto:${mentorEmailToUse}">${mentorEmailToUse}</a>` : mentorEmailToUse}</td>
                    </tr>
                    <tr>
                      <td>Contact:</td>
                      <td>
                        ${mentorContactToUse && mentorContactToUse !== "Not specified" ?
                          `<a href="tel:${mentorContactToUse}" class="contact-button">${mentorContactToUse} &nbsp;📞</a>` :
                          mentorContactToUse
                        }
                      </td>
                    </tr>
                  </table>
                </div>
                
                <div class="note-box">
                  <p><strong style="color: #0056b3;">Important:</strong> Kindly ensure your ward adheres to the approved outpass timeline. Should there be any concerns or delays, please inform the mentor immediately.</p>
                </div>
                
                <p style="font-size: 14px; color: #6c757d; line-height: 1.6; margin-top: 30px; text-align: center; font-style: italic;">
                  This is an automated notification from the Amity University Outpass System. Please do not reply directly to this email.
                </p>
              </div>
              
              <div class="email-footer">
                <p>&copy; ${new Date().getFullYear()} Amity University. All rights reserved.</p>
                <p>Amity Outpass Management System</p>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    const mailjetRequest = mailjetClient
      .post("send", { version: "v3.1" })
      .request({
        Messages: [
          {
            From: {
              Email: senderEmail,
              Name: "Amity University Outpass System",
            },
            To: [ { Email: guardianEmail } ],
            Subject: `Outpass Request for ${studentName} - Action Required`,
            HTMLPart: emailHtml,
          },
        ],
      });

    const emailResponse = await mailjetRequest;
    
    console.log("Mailjet email send attempt response:", JSON.stringify(emailResponse.body));

    const firstMessageStatus = emailResponse.body?.Messages?.[0]?.Status;
    if (firstMessageStatus !== 'success') {
        console.error("Mailjet email sending failed. Status:", firstMessageStatus, "Full response:", emailResponse.body);
        const errorMessage = emailResponse.body?.Messages?.[0]?.Errors?.[0]?.ErrorMessage || `Mailjet sending error: ${firstMessageStatus || 'Unknown error'}`;
        throw new Error(errorMessage);
    }

    console.log("Email sent successfully via Mailjet to:", guardianEmail);

    return new Response(JSON.stringify({ message: "Email sent successfully via Mailjet", details: emailResponse.body }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-guardian-email function:", error.message, error.stack);
    if (error.response && error.response.data) {
      console.error("Mailjet API Error Data:", error.response.data);
    }
    return new Response(
      JSON.stringify({ error: `Failed to send email: ${error.message}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
