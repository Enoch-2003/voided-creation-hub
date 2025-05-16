
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// import { Resend } from "npm:resend@2.0.0"; // Resend client, commented out
import Mailjet from "npm:node-mailjet@3.3.4"; // Mailjet client

// const resend = new Resend(Deno.env.get("RESEND_API_KEY")); // Resend initialization, commented out

const mailjetApiKey = Deno.env.get("MAILJET_PUB_KEY");
const mailjetApiSecret = Deno.env.get("MAILJET_PRIV_KEY");

if (!mailjetApiKey) {
  console.error("MAILJET_PUB_KEY is not configured in environment variables. This should be mapped from the MAILJET_API_KEY Supabase secret.");
  // Throw an error or handle as appropriate for your application startup
}
if (!mailjetApiSecret) {
  console.error("MAILJET_PRIV_KEY is not configured in environment variables. This should be mapped from the MAILJET_API_SECRET Supabase secret.");
  // Throw an error or handle
}

// Initialize Mailjet client only if keys are present
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
  // studentSection is received from OutpassForm but not explicitly in this interface before.
  // It's not used in the email body directly, so its absence in the interface is acceptable.
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
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
      mentorName = "N/A", // Default to N/A if not provided
      mentorEmail = "N/A",
      mentorContact = "N/A",
    }: GuardianEmailRequest = await req.json();

    // Correctly get the sender email using the environment variable name from config.toml (MAILJET_FROM_EMAIL)
    const senderEmail = Deno.env.get("MAILJET_FROM_EMAIL");
    if (!senderEmail) {
      // Update console log to reflect the correct environment variable name
      console.error("Mailjet sender email (MAILJET_FROM_EMAIL) is not configured. This should be mapped from MAILJET_SENDER_EMAIL Supabase secret.");
      return new Response(
        JSON.stringify({ error: "Email service is not properly configured (missing sender email)." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Attempting to send email to guardian via Mailjet:", guardianEmail);
    console.log("Using sender email:", senderEmail); // Log sender email

    const emailHtml = `
      <h2>Outpass Request Approval Required</h2>
      <p>Dear Guardian,</p>
      <p>Your ward ${studentName} has requested an outpass with the following details:</p>
      <ul>
        <li><strong>Exit Date & Time:</strong> ${new Date(exitDateTime).toLocaleString()}</li>
        <li><strong>Reason:</strong> ${reason}</li>
      </ul>
      <p>Please contact the mentor to provide your approval for this request:</p>
      <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
        <p><strong>Mentor Details:</strong></p>
        <ul>
          <li><strong>Name:</strong> ${mentorName}</li>
          <li><strong>Email:</strong> ${mentorEmail}</li>
          <li><strong>Contact:</strong> ${mentorContact}</li>
        </ul>
      </div>
      <p>This is an automated message. Please do not reply to this email.</p>
    `;

    const mailjetRequest = mailjetClient
      .post("send", { version: "v3.1" })
      .request({
        Messages: [
          {
            From: {
              Email: senderEmail,
              Name: "Outpass System",
            },
            To: [
              {
                Email: guardianEmail,
                // Name: "Guardian" // Optional: Mailjet can derive name or you can pass it
              },
            ],
            Subject: `Outpass Request Approval Required - ${studentName}`,
            HTMLPart: emailHtml,
            // TextPart: `Dear Guardian, Your ward ${studentName} has requested an outpass...` // Optional plain text version
          },
        ],
      });

    const emailResponse = await mailjetRequest;
    
    console.log("Mailjet email send attempt response:", JSON.stringify(emailResponse.body));

    const firstMessageStatus = emailResponse.body?.Messages?.[0]?.Status;
    if (firstMessageStatus !== 'success') {
        console.error("Mailjet email sending failed. Status:", firstMessageStatus, "Full response:", emailResponse.body);
        // Check for common Mailjet error messages in the response body
        const errorMessage = emailResponse.body?.Messages?.[0]?.Errors?.[0]?.ErrorMessage || `Mailjet sending error: ${firstMessageStatus || 'Unknown error'}`;
        throw new Error(errorMessage);
    }

    console.log("Email sent successfully via Mailjet to:", guardianEmail);

    return new Response(JSON.stringify({ message: "Email sent successfully via Mailjet", details: emailResponse.body }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
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

