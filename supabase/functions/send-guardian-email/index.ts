
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Mailjet from "npm:node-mailjet@3.3.4"; 

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
  exitDateTime: string;
  reason: string;
  guardianEmail: string;
  mentorName?: string | null; 
  mentorEmail?: string | null;
  mentorContact?: string | null;
  studentSection?: string;
}

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
    console.log("Received request body for email function (raw):", JSON.stringify(requestBody, null, 2));

    const {
      studentName,
      exitDateTime,
      reason,
      guardianEmail,
      // studentSection is in requestBody but not explicitly destructured here
    } = requestBody;

    // FIXED: Explicitly handle mentor details as potentially null values
    // This matches how we're sending them from the form
    const rawMentorName = requestBody.mentorName;
    const rawMentorEmail = requestBody.mentorEmail;
    const rawMentorContact = requestBody.mentorContact;

    console.log("Raw mentor details received by email function:", { 
      rawMentorName, 
      rawMentorEmail, 
      rawMentorContact,
      isNameNull: rawMentorName === null,
      isEmailNull: rawMentorEmail === null,
      isContactNull: rawMentorContact === null
    });

    // FIXED: More robust check for valid mentor data
    // Only use "Not specified" if the value is null, undefined, empty string, or "Not Available"
    const mentorNameToUse = rawMentorName && String(rawMentorName).trim() !== "" ? 
      String(rawMentorName) : 
      "Not specified";
    
    const mentorEmailToUse = rawMentorEmail && String(rawMentorEmail).trim() !== "" ? 
      String(rawMentorEmail) : 
      "Not specified";
    
    const mentorContactToUse = rawMentorContact && String(rawMentorContact).trim() !== "" ? 
      String(rawMentorContact) : 
      "Not specified";
    
    console.log("Processed mentor details for email template:", { 
      name: mentorNameToUse, 
      email: mentorEmailToUse, 
      contact: mentorContactToUse 
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

    // Amity Colors:
    // Primary Blue: #3B82F6 (blue-500)
    // Darker Blue: #1D4ED8 (blue-700)
    // Lighter Blue for accents/borders: #BFDBFE (blue-200)
    // Very Light Blue/Almost White: #EFF6FF (blue-50)
    // Yellow: #FFD700 (yellow)
    // Soft Yellow: #FEF7CD

    const emailHtml = `
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #EFF6FF;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#EFF6FF">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <!-- Header with Logo -->
              <tr>
                <td align="center" style="padding: 20px 30px; background-color: #3B82F6; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                  ${logoUrl ? `<img src="${logoUrl}" alt="Amity Logo" width="150" style="display: block;">` : '<h1 style="color: #ffffff; margin: 0; font-size: 24px;">Amity Outpass System</h1>'}
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 30px; color: #1A1F2C;">
                  <h2 style="color: #1D4ED8; font-size: 22px; margin-top: 0; margin-bottom: 20px;">Outpass Request Approval Required</h2>
                  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">Dear Guardian,</p>
                  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">Your ward, <strong>${studentName}</strong>, has requested an outpass with the following details:</p>
                  <ul style="font-size: 16px; line-height: 1.6; list-style-type: none; padding-left: 0; margin-bottom: 25px; background-color: #FFD700; padding: 15px; border-radius: 6px;">
                    <li style="margin-bottom: 8px;"><strong>Exit Date & Time:</strong> ${new Date(exitDateTime).toLocaleString()}</li>
                    <li><strong>Reason:</strong> ${reason}</li>
                  </ul>
                  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">Please contact the assigned mentor to provide your approval for this request:</p>
                  
                  <!-- Mentor Details -->
                  <div style="background-color: #f8f9fa; padding: 20px; margin: 25px 0; border-radius: 8px; border: 1px solid #BFDBFE;">
                    <p style="margin-top: 0; margin-bottom: 15px; font-size: 1.2em; color: #1D4ED8;"><strong>Mentor Details:</strong></p>
                    <ul style="list-style-type: none; padding-left: 0; margin: 0; font-size: 16px; line-height: 1.6;">
                      <li style="margin-bottom: 10px;"><strong>Name:</strong> ${mentorNameToUse}</li>
                      <li style="margin-bottom: 10px;">
                        <strong>Email:</strong> 
                        ${mentorEmailToUse !== "Not specified" ? `<a href="mailto:${mentorEmailToUse}" style="color: #3B82F6; text-decoration: none;">${mentorEmailToUse}</a>` : mentorEmailToUse}
                      </li>
                      <li>
                        <strong>Contact:</strong> 
                        ${mentorContactToUse && mentorContactToUse !== "Not specified"
                          ? `<a href="tel:${mentorContactToUse}" style="color: #ffffff; text-decoration: none; padding: 6px 12px; border-radius: 4px; display: inline-block; background-color: #3B82F6; margin-left: 8px;">${mentorContactToUse}</a> <span style="font-size:0.9em; color:#555; margin-left: 5px;">(Tap to call)</span>`
                          : mentorContactToUse
                        }
                      </li>
                    </ul>
                  </div>
                  
                  <p style="font-size: 14px; color: #777777; line-height: 1.6; margin-top: 30px;">This is an automated message. Please do not reply to this email.</p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td align="center" style="padding: 20px 30px; background-color: #2563EB; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                  <p style="color: #EFF6FF; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Amity Outpass System. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    `;

    const mailjetRequest = mailjetClient
      .post("send", { version: "v3.1" })
      .request({
        Messages: [
          {
            From: {
              Email: senderEmail,
              Name: "Amity Outpass System",
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
