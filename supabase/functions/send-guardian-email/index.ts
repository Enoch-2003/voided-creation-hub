
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Mailjet from "npm:node-mailjet@3.3.4"; 

const mailjetApiKey = Deno.env.get("MAILJET_PUB_KEY");
const mailjetApiSecret = Deno.env.get("MAILJET_PRIV_KEY");
const siteUrl = Deno.env.get("SITE_URL"); // URL for the deployed frontend app

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
  mentorName?: string; 
  mentorEmail?: string;
  mentorContact?: string;
  studentSection?: string; // Already present, used for context if needed
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
    const {
      studentName,
      exitDateTime,
      reason,
      guardianEmail,
      mentorName = "N/A", 
      mentorEmail = "N/A",
      mentorContact = "N/A",
    }: GuardianEmailRequest = await req.json();

    const senderEmail = Deno.env.get("MAILJET_FROM_EMAIL");
    if (!senderEmail) {
      console.error("Mailjet sender email (MAILJET_FROM_EMAIL) is not configured. This should be mapped from MAILJET_SENDER_EMAIL Supabase secret.");
      return new Response(
        JSON.stringify({ error: "Email service is not properly configured (missing sender email)." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Attempting to send email to guardian via Mailjet:", guardianEmail);
    console.log("Using sender email:", senderEmail); 
    console.log("Mentor details received:", { mentorName, mentorEmail, mentorContact });
    
    const logoUrl = siteUrl ? `${siteUrl}/lovable-uploads/945f9f70-9eb7-406e-bf17-148621ddf5cb.png` : '';


    const emailHtml = `
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f7fc;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f4f7fc">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <!-- Header with Logo -->
              <tr>
                <td align="center" style="padding: 20px 30px; background-color: #9b87f5; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                  ${logoUrl ? `<img src="${logoUrl}" alt="Amity Logo" width="150" style="display: block;">` : '<h1 style="color: #ffffff; margin: 0; font-size: 24px;">Amity Outpass System</h1>'}
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 30px; color: #1A1F2C;">
                  <h2 style="color: #7E69AB; font-size: 22px; margin-top: 0; margin-bottom: 20px;">Outpass Request Approval Required</h2>
                  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">Dear Guardian,</p>
                  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">Your ward, <strong>${studentName}</strong>, has requested an outpass with the following details:</p>
                  <ul style="font-size: 16px; line-height: 1.6; list-style-type: none; padding-left: 0; margin-bottom: 25px; background-color: #E5DEFF; padding: 15px; border-radius: 6px;">
                    <li style="margin-bottom: 8px;"><strong>Exit Date & Time:</strong> ${new Date(exitDateTime).toLocaleString()}</li>
                    <li><strong>Reason:</strong> ${reason}</li>
                  </ul>
                  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">Please contact the assigned mentor to provide your approval for this request:</p>
                  
                  <!-- Mentor Details -->
                  <div style="background-color: #f9f9f9; padding: 20px; margin: 25px 0; border-radius: 8px; border: 1px solid #D6BCFA;">
                    <p style="margin-top: 0; margin-bottom: 15px; font-size: 1.2em; color: #7E69AB;"><strong>Mentor Details:</strong></p>
                    <ul style="list-style-type: none; padding-left: 0; margin: 0; font-size: 16px; line-height: 1.6;">
                      <li style="margin-bottom: 10px;"><strong>Name:</strong> ${mentorName}</li>
                      <li style="margin-bottom: 10px;"><strong>Email:</strong> <a href="mailto:${mentorEmail}" style="color: #1EAEDB; text-decoration: none;">${mentorEmail}</a></li>
                      <li>
                        <strong>Contact:</strong> 
                        ${mentorContact && mentorContact !== "N/A"
                          ? `<a href="tel:${mentorContact}" style="color: #1EAEDB; text-decoration: none; padding: 5px 10px; border: 1px solid #1EAEDB; border-radius: 4px; display: inline-block; margin-left: 8px; background-color: #E5DEFF;">${mentorContact}</a> <span style="font-size:0.9em; color:#555; margin-left: 5px;">(Tap to call)</span>`
                          : mentorContact
                        }
                      </li>
                    </ul>
                  </div>
                  
                  <p style="font-size: 14px; color: #777777; line-height: 1.6; margin-top: 30px;">This is an automated message. Please do not reply to this email.</p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td align="center" style="padding: 20px 30px; background-color: #6E59A5; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                  <p style="color: #E5DEFF; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Amity Outpass System. All rights reserved.</p>
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
