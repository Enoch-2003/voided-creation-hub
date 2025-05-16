
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// import { Resend } from "npm:resend@2.0.0"; // Resend client, commented out
import Mailjet from "npm:node-mailjet@3.3.4"; // Mailjet client

// const resend = new Resend(Deno.env.get("RESEND_API_KEY")); // Resend initialization, commented out

const mailjetClient = Mailjet.apiConnect(
  Deno.env.get("MAILJET_PUB_KEY")!,
  Deno.env.get("MAILJET_PRIV_KEY")!
);

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
  mentorName?: string; // Made optional as they might not be passed
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

    const senderEmail = Deno.env.get("MAILJET_SENDER_EMAIL");
    if (!senderEmail) {
      console.error("Mailjet sender email (MAILJET_SENDER_EMAIL) is not configured.");
      return new Response(
        JSON.stringify({ error: "Email service is not properly configured (missing sender email)." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Attempting to send email to guardian via Mailjet:", guardianEmail);

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
    
    // Mailjet API v3.1 send response structure is different from Resend.
    // It usually returns a Messages array with status for each message.
    // Example: { Messages: [ { Status: 'success', ... } ] }
    console.log("Mailjet email send attempt response:", JSON.stringify(emailResponse.body));

    // Check if the first message was successful, adjust based on actual Mailjet response if needed
    const firstMessageStatus = emailResponse.body?.Messages?.[0]?.Status;
    if (firstMessageStatus !== 'success') {
        console.error("Mailjet email sending failed:", emailResponse.body);
        throw new Error(`Mailjet sending error: ${firstMessageStatus || 'Unknown error'}`);
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
    // Log the full error if available, Mailjet errors might have more details
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

