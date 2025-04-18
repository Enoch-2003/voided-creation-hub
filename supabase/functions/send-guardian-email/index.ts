
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
  mentorName: string;
  mentorEmail: string;
  mentorContact: string;
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
      mentorName,
      mentorEmail,
      mentorContact,
    }: GuardianEmailRequest = await req.json();

    console.log("Sending email to guardian:", guardianEmail);

    const emailResponse = await resend.emails.send({
      from: "Outpass System <onboarding@resend.dev>",
      to: [guardianEmail],
      subject: `Outpass Request Approval Required - ${studentName}`,
      html: `
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
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending guardian email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
