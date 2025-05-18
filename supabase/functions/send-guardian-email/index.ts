
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Mailjet from "npm:node-mailjet@3.3.4"; 
import { format } from "npm:date-fns@3.6.0";
import { toZonedTime } from "npm:date-fns-tz@3.0.0";

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
  exitDateTime: string; // Expected to be an ISO string (UTC)
  reason: string;
  guardianEmail: string;
  mentorName?: string | null; 
  mentorEmail?: string | null;
  mentorContact?: string | null;
  studentSection?: string;
  formattedExitDateTime?: string; // Pre-formatted time from frontend - THIS IS THE KEY FIELD
}

// Indian timezone constant
const INDIAN_TIMEZONE = 'Asia/Kolkata';

// Convert UTC string to Indian time and format
const formatToIndianTimeDisplay = (utcDateString: string): string => {
  try {
    const date = new Date(utcDateString);
    const indianTime = toZonedTime(date, INDIAN_TIMEZONE);
    return format(indianTime, 'MMMM d, yyyy h:mm a (IST)');
  } catch (error) {
    console.error("Error formatting UTC date to Indian time for display:", error, "Original string:", utcDateString);
    try {
        return new Date(utcDateString).toLocaleString("en-IN", { timeZone: INDIAN_TIMEZONE, hour12: true, year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }) + " (IST)";
    } catch (e) {
        return utcDateString;
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
      exitDateTime,
      reason,
      guardianEmail,
      mentorName,
      mentorEmail,
      mentorContact,
      studentSection,
      formattedExitDateTime // This contains the formatted time as selected by student
    } = requestBody;

    console.log("Mentor details received in request:", {
      name: mentorName,
      email: mentorEmail,
      contact: mentorContact
    });

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
    
    const logoUrl = siteUrl ? `${siteUrl}/lovable-uploads/945f9f70-9eb7-406e-bf17-148621ddf5cb.png` : '';

    // IMPORTANT: We prioritize the pre-formatted time from frontend
    // This ensures we display exactly what the student selected
    const displayExitTime = formattedExitDateTime || formatToIndianTimeDisplay(exitDateTime);
    
    console.log("Time being displayed in email:", {
      originalExitDateTime: exitDateTime,
      displayTime: displayExitTime,
      wasPreFormatted: !!formattedExitDateTime
    });

    const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Outpass Request Approval</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; color: #333;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f5f5f5">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #e0e0e0;">
              
              <!-- Header with Logo and University Branding -->
              <tr>
                <td align="center" style="padding: 25px 30px; background: linear-gradient(135deg, #1A237E 0%, #283593 100%); border-top-left-radius: 8px; border-top-right-radius: 8px;">
                  ${logoUrl ? 
                    `<img src="${logoUrl}" alt="Amity University Logo" width="180" style="display: block; margin-bottom: 15px;">` : 
                    '<h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Amity University</h1>'
                  }
                  <h2 style="color: #ffffff; margin: 5px 0 0; font-size: 20px; font-weight: 400;">Outpass Management System</h2>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 35px 30px; color: #333333;">
                  <h2 style="color: #1A237E; font-size: 22px; margin-top: 0; margin-bottom: 20px; font-weight: 600; border-bottom: 2px solid #E8EAF6; padding-bottom: 10px;">Outpass Request Approval Required</h2>
                  
                  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">Dear Guardian,</p>
                  
                  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Your ward, <strong style="color: #1A237E;">${studentName}</strong> (Section: ${studentSection || 'N/A'}), has requested an outpass with the following details:</p>
                  
                  <!-- Outpass Details Box -->
                  <div style="background-color: #E8EAF6; padding: 20px; border-radius: 6px; margin-bottom: 25px; border-left: 4px solid #3F51B5;">
                    <table width="100%" style="font-size: 16px; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; font-weight: 600; width: 140px;">Exit Date & Time:</td>
                        <td style="padding: 8px 0;">${displayExitTime}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: 600; border-top: 1px solid #C5CAE9;">Reason:</td>
                        <td style="padding: 8px 0; border-top: 1px solid #C5CAE9;">${reason}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">Please contact the assigned mentor to provide your approval for this request:</p>
                  
                  <!-- Mentor Details Box -->
                  <div style="background-color: #FFF8E1; padding: 25px; border-radius: 6px; margin: 25px 0; border: 1px solid #FFE082; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 18px; color: #FF8F00; font-weight: 600;">MENTOR DETAILS</h3>
                    
                    <table width="100%" style="font-size: 16px; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; font-weight: 600; width: 100px;">Name:</td>
                        <td style="padding: 8px 0;">${mentorNameToUse}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: 600; border-top: 1px solid #FFE082;">Email:</td>
                        <td style="padding: 8px 0; border-top: 1px solid #FFE082;">
                          ${mentorEmailToUse !== "Not specified" ? 
                            `<a href="mailto:${mentorEmailToUse}" style="color: #1565C0; text-decoration: none;">${mentorEmailToUse}</a>` : 
                            mentorEmailToUse
                          }
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: 600; border-top: 1px solid #FFE082;">Contact:</td>
                        <td style="padding: 12px 0 8px; border-top: 1px solid #FFE082;">
                          ${mentorContactToUse && mentorContactToUse !== "Not specified" ?
                            `<a href="tel:${mentorContactToUse}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: 500;">${mentorContactToUse} &nbsp;📞</a>` :
                            mentorContactToUse
                          }
                        </td>
                      </tr>
                    </table>
                  </div>
                  
                  <div style="background-color: #E8F5E9; border-left: 4px solid #4CAF50; padding: 15px; margin-bottom: 25px;">
                    <p style="margin: 0; font-size: 15px; line-height: 1.5;">
                      <strong style="color: #2E7D32;">Note:</strong> Please ensure that your ward returns to campus within the allotted time. Contact the mentor immediately if there are any concerns.
                    </p>
                  </div>
                  
                  <p style="font-size: 14px; color: #757575; line-height: 1.6; margin-top: 30px; font-style: italic; text-align: center;">
                    This is an automated message from the Amity University Outpass System. Please do not reply to this email.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 30px; background: linear-gradient(135deg, #283593 0%, #1A237E 100%); border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="color: #ffffff; font-size: 14px; text-align: center;">
                        <p style="margin: 0; padding-bottom: 5px; font-weight: 500;">Amity University Outpass Management System</p>
                        <p style="margin: 0; font-size: 12px; opacity: 0.8;">&copy; ${new Date().getFullYear()} Amity University. All rights reserved.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
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
    console.error("Error sending guardian email via Mailjet:", error.message, error.stack);
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
