// Sends email through the Brevo HTTP API (Render's free plan blocks normal SMTP ports).
// Needs BREVO_API_KEY and MAIL_FROM (a sender you verified in Brevo). Returns true only if Brevo accepted the email.
async function sendEmail({ to, subject, text }) {
  const key = process.env.BREVO_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from) return false; // email is not configured

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': key, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ sender: { name: 'VehicleCare', email: from }, to: [{ email: to }], subject, textContent: text }),
    });
    if (!res.ok) {
      console.error('Email provider returned status', res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Email error:', err.message);
    return false;
  }
}

module.exports = { sendEmail };
