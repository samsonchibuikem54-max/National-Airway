import sgMail from "@sendgrid/mail";

sgMail.setApiKey(Deno.env.get("SENDGRID_API_KEY"));

export default async function handler(req) {
  const { email, trackingId, amount } = await req.json();

  const msg = {
    to: email,
    from: "yourverified@domain.com",
    subject: "Payment Confirmed - Your Tracking ID",
    text: `Hello! Your payment of $${amount} is confirmed. Tracking ID: ${trackingId}`,
    html: `<strong>Hello!</strong><p>Your payment of $${amount} is confirmed. Tracking ID: ${trackingId}</p>`,
  };

  await sgMail.send(msg);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
