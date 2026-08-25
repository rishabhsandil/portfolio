<?php
declare(strict_types=1);

/*
 * Aspire — form handler (adapted from the Ashford Career College submit.php).
 * Sends application/contact submissions to the address in $RECIPIENT below.
 * NOTE: update the placeholder aspirecareers.ca addresses once the real
 * domain/mailbox is confirmed by the client.
 * Cloudflare Turnstile was removed (no keys); honeypot spam check kept.
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

/* ── Config ───────────────────────────────────────────────────────────── */

$RECIPIENT  = 'info@acesglobal.ca';
$BCC        = ['manjot15857@gmail.com'];

$FROM_EMAIL = 'info@acesglobal.ca';
$FROM_NAME  = 'Aspire Career & Educational Services Website';
$SITE_NAME  = 'Aspire Career & Educational Services';

/* Auto-reply to the applicant: confirmation + link to book a Zoom consultation.
 * >>> ACTION REQUIRED <<<
 * Paste the real scheduling link below. Any tool that produces a public booking
 * URL works (Calendly, Zoom Scheduler, Microsoft Bookings, Google Appointment
 * Schedules). Configure that tool to generate the Zoom link on booking so the
 * student gets the meeting invite automatically.
 * Set $AUTOREPLY = false to switch the auto-reply off entirely. */
$AUTOREPLY         = true;
$BOOKING_URL       = 'https://calendly.com/acesglobal/consultation'; // <-- replace with the client's real booking link
$REPLY_FROM_EMAIL  = 'info@acesglobal.ca';
$REPLY_FROM_NAME   = 'Aspire Career & Educational Services';
$REPLY_SUBJECT     = 'Book your free consultation with Aspire';
$CONTACT_PHONE     = '+1 (604) 316-8015';

/* ── Honeypot ─────────────────────────────────────────────────────────── */

if (!empty($_POST['botcheck'])) {
    echo json_encode(['success' => true]);
    exit;
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

function clean_header(string $value): string
{
    return trim(preg_replace('/[\r\n]+/', ' ', $value));
}

function pretty_label(string $key): string
{
    return ucwords(str_replace(['_', '-'], ' ', $key));
}

/* ── Subject ──────────────────────────────────────────────────────────── */

$subject = clean_header((string)($_POST['subject'] ?? ''));

if ($subject === '') {
    $subject = $SITE_NAME . ' - Form Submission';
}

if (preg_match('/[^\x20-\x7E]/', $subject)) {
    $subject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
}

/* ── Reply-To ─────────────────────────────────────────────────────────── */

$replyEmail = '';

if (!empty($_POST['email']) && filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
    $replyEmail = $_POST['email'];
}

/* ── Build Email Body ─────────────────────────────────────────────────── */

$skip = ['access_key', 'botcheck', 'subject', 'from_name', 'captcha'];

$rows = [];

foreach ($_POST as $key => $value) {

    if (in_array($key, $skip, true)) {
        continue;
    }

    if (is_array($value)) {
        $value = implode(', ', $value);
    }

    $value = trim((string)$value);

    if ($value === '') {
        continue;
    }

    $rows[] = pretty_label($key) . ': ' . $value;
}

$body  = "New submission from {$SITE_NAME}\n";
$body .= str_repeat('-', 60) . "\n\n";
$body .= implode("\n", $rows);
$body .= "\n\n" . str_repeat('-', 60) . "\n";
$body .= 'Submitted: ' . date('Y-m-d H:i:s T') . "\n";
$body .= 'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";
$body .= 'User-Agent: ' . clean_header((string)($_SERVER['HTTP_USER_AGENT'] ?? 'unknown'));

/* ── Headers ──────────────────────────────────────────────────────────── */

$headers = [];
$headers[] = 'From: ' . clean_header($FROM_NAME) . ' <' . $FROM_EMAIL . '>';

if ($replyEmail) {
    $headers[] = 'Reply-To: ' . clean_header($replyEmail);
}

if (!empty($BCC)) {
    $headers[] = 'Bcc: ' . implode(', ', array_map('clean_header', $BCC));
}

$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'X-Mailer: PHP/' . phpversion();

/* ── Send ─────────────────────────────────────────────────────────────── */

$sent = @mail($RECIPIENT, $subject, $body, implode("\r\n", $headers));

/* ── Auto-reply to the applicant (booking link) ───────────────────────── */

/*
 * Skipped for partial leads: main.js fires a "Partial Lead" POST when the user
 * moves from step 1 to step 2, so without this guard anyone who completes the
 * form would receive the booking email twice.
 */
$isPartial = stripos($subject, 'Partial') !== false;

if ($AUTOREPLY && $replyEmail && !$isPartial) {
    send_auto_reply(
        $replyEmail,
        (string)($_POST['name'] ?? ''),
        $BOOKING_URL,
        $REPLY_SUBJECT,
        $REPLY_FROM_NAME,
        $REPLY_FROM_EMAIL,
        $CONTACT_PHONE
    );
}

if ($sent) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to send email at this time.']);
}

/* ── Auto-reply ───────────────────────────────────────────────────────── */

/*
 * Emails the applicant a confirmation plus a link to book their Zoom
 * consultation. Failures are deliberately swallowed: the lead has already
 * reached the team, so a bounced auto-reply must not turn a good submission
 * into an error for the person who filled in the form.
 */
function send_auto_reply(
    string $to,
    string $name,
    string $bookingUrl,
    string $subject,
    string $fromName,
    string $fromEmail,
    string $phone
): void {
    $parts     = preg_split('/\s+/', trim($name));
    $firstName = ($parts && $parts[0] !== '') ? $parts[0] : '';
    $greeting  = $firstName !== '' ? 'Hi ' . $firstName . ',' : 'Hello,';

    /* ---- Plain-text part ---- */

    $text  = $greeting . "\n\n";
    $text .= "Thanks for reaching out to Aspire Career & Educational Services.\n\n";
    $text .= "The next step is a free one-on-one consultation over Zoom with one of our advisors. ";
    $text .= "Pick a time that suits you here:\n\n";
    $text .= $bookingUrl . "\n\n";
    $text .= "Once you choose a slot you'll get a calendar invite with the Zoom link.\n\n";
    $text .= "In that call we'll go through your goals, the programs that fit, entry requirements, ";
    $text .= "costs and funding, and the timelines for the upcoming intakes.\n\n";
    $text .= "If none of the times work, just reply to this email or call us at " . $phone . ".\n\n";
    $text .= "We look forward to speaking with you.\n\n";
    $text .= "Aspire Career & Educational Services\n";

    /* ---- HTML part ---- */

    $safeGreeting = htmlspecialchars($greeting, ENT_QUOTES, 'UTF-8');
    $safeUrl      = htmlspecialchars($bookingUrl, ENT_QUOTES, 'UTF-8');
    $safePhone    = htmlspecialchars($phone, ENT_QUOTES, 'UTF-8');

    $html  = '<!DOCTYPE html><html lang="en"><body style="margin:0;padding:0;background:#f4f1ea;">';
    $html .= '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:32px 12px;">';
    $html .= '<tr><td align="center">';
    $html .= '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4dfd3;border-radius:10px;padding:36px 32px;font-family:Helvetica,Arial,sans-serif;color:#26221d;">';
    $html .= '<tr><td style="font-size:16px;line-height:1.6;">';
    $html .= '<p style="margin:0 0 18px;">' . $safeGreeting . '</p>';
    $html .= '<p style="margin:0 0 18px;">Thanks for reaching out to Aspire Career &amp; Educational Services.</p>';
    $html .= '<p style="margin:0 0 26px;">The next step is a free one-on-one consultation over Zoom with one of our advisors. Pick a time that suits you:</p>';
    $html .= '<p style="margin:0 0 26px;text-align:center;">';
    $html .= '<a href="' . $safeUrl . '" style="display:inline-block;background:#04758f;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 30px;border-radius:6px;">Book your Zoom consultation</a>';
    $html .= '</p>';
    $html .= '<p style="margin:0 0 22px;font-size:14px;color:#6b645b;">Once you choose a slot you&rsquo;ll get a calendar invite with the Zoom link. If the button does not work, copy this link into your browser:<br>';
    $html .= '<a href="' . $safeUrl . '" style="color:#04758f;word-break:break-all;">' . $safeUrl . '</a></p>';
    $html .= '<p style="margin:0 0 18px;">In that call we&rsquo;ll go through your goals, the programs that fit, entry requirements, costs and funding, and the timelines for the upcoming intakes.</p>';
    $html .= '<p style="margin:0 0 18px;">If none of the times work, just reply to this email or call us at ' . $safePhone . '.</p>';
    $html .= '<p style="margin:0;">We look forward to speaking with you.<br><strong>Aspire Career &amp; Educational Services</strong></p>';
    $html .= '</td></tr></table></td></tr></table></body></html>';

    /* ---- Multipart assembly ---- */

    $boundary = 'aspire-' . bin2hex(random_bytes(12));

    $mime  = "--" . $boundary . "\r\n";
    $mime .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $mime .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $mime .= $text . "\r\n\r\n";
    $mime .= "--" . $boundary . "\r\n";
    $mime .= "Content-Type: text/html; charset=UTF-8\r\n";
    $mime .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $mime .= $html . "\r\n\r\n";
    $mime .= "--" . $boundary . "--";

    $replyHeaders = [
        'From: ' . clean_header($fromName) . ' <' . $fromEmail . '>',
        'Reply-To: ' . $fromEmail,
        'MIME-Version: 1.0',
        'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
        'Auto-Submitted: auto-replied',
        'X-Auto-Response-Suppress: All',
        'X-Mailer: PHP/' . phpversion(),
    ];

    @mail(clean_header($to), $subject, $mime, implode("\r\n", $replyHeaders));
}
