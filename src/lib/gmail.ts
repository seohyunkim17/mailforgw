const RECIPIENTS = [
  "wakeione@wake-one.com",
  "protect@wake-one.com",
];

function buildRawEmail(from: string, subject: string, body: string): string {
  const to = RECIPIENTS.join(", ");
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    btoa(unescape(encodeURIComponent(body))),
  ].join("\r\n");

  // Gmail API expects URL-safe base64
  return btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendEmail(
  accessToken: string,
  fromEmail: string,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  const raw = buildRawEmail(fromEmail, subject, body);

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    return { success: false, error: error.error?.message || "발송 실패" };
  }

  return { success: true };
}
