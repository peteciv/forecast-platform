import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { region, submittedAt } = await request.json();
    
    const emailTo = "peter@ayertime.com";
    const subject = `Forecast Submitted - ${region}`;
    const body = `
Hello,

A new forecast has been submitted:

Region: ${region}
Submitted At: ${new Date(submittedAt).toLocaleString()}

Please review the data in the admin portal.

Best regards,
Forecast Platform
    `.trim();

    // For now, just log it (you'll need to configure an email service)
    console.log("Email notification:");
    console.log("To:", emailTo);
    console.log("Subject:", subject);
    console.log("Body:", body);

    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // Example with Resend:
    // const response = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     from: 'noreply@yourdomain.com',
    //     to: emailTo,
    //     subject: subject,
    //     text: body
    //   })
    // });

    return NextResponse.json({ 
      success: true, 
      message: "Notification logged (email service not yet configured)" 
    });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
