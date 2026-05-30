<?php
declare(strict_types=1);

/**
 * Ashford Career College — Form submission handler
 *
 * Receives POST from any site form, sends the contents to the configured
 * recipient via PHP mail(), and returns JSON so the existing front-end JS
 * (fetch + {success:true}) continues to work without changes.
 *
 * Spam protection in this version:
 *   - Honeypot field "botcheck" (must be empty)
 *   - Header-injection sanitisation on all values that touch mail headers
 *
 * CAPTCHA:
 *   - See the "CAPTCHA HOOK" block below. Once a provider (Cloudflare
 *     Turnstile / hCaptcha / reCAPTCHA) is wired into the forms, verify
 *     the token there before the message is sent.
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

/* ── Config ───────────────────────────────────────────────────────────── */
$RECIPIENT  = 'info@ashfordcollege.ca';
$BCC        = ['rishabhsandil@gmail.com'];   // silent copy recipients (admin/dev monitoring)
$FROM_EMAIL = 'info@ashfordcollege.ca';      // must be a valid mailbox on the sending domain
$FROM_NAME  = 'Ashford Career College Website';
$SITE_NAME  = 'Ashford Career College';

/* ── Honeypot ─────────────────────────────────────────────────────────── */
if (!empty($_POST['botcheck'])) {
    // Bot — pretend success so the trap stays hidden
    echo json_encode(['success' => true]);
    exit;
}

/* ── CAPTCHA (Cloudflare Turnstile) ───────────────────────────────────── */
// Partial leads (fired on Step 1 of the multi-step form, before the user
// reaches the captcha on Step 2) are exempt — honeypot still applies.
$isPartial = (strpos((string)($_POST['subject'] ?? ''), '[Partial Lead]') !== false);

if (!$isPartial) {
$TURNSTILE_SECRET = '0x4AAAAAADY2mXwKFAymwQaIDvKoAL-vlnA';
$token = $_POST['cf-turnstile-response'] ?? '';
if ($token === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please complete the captcha and try again.']);
    exit;
}
$verify = @file_get_contents(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    false,
    stream_context_create([
        'http' => [
            'method'  => 'POST',
            'header'  => 'Content-Type: application/x-www-form-urlencoded',
            'content' => http_build_query([
                'secret'   => $TURNSTILE_SECRET,
                'response' => $token,
                'remoteip' => $_SERVER['REMOTE_ADDR'] ?? '',
            ]),
            'timeout' => 5,
            'ignore_errors' => true,
        ],
    ])
);
$verifyOk = $verify && (json_decode($verify, true)['success'] ?? false);
if (!$verifyOk) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Captcha verification failed. Please try again.']);
    exit;
}
} // end if (!$isPartial)

/* ── Helpers ──────────────────────────────────────────────────────────── */
function clean_header(string $s): string {
    return trim(preg_replace('/[\r\n]+/', ' ', $s));
}
function pretty_label(string $key): string {
    return ucwords(str_replace(['_', '-'], ' ', $key));
}

/* ── Build email ──────────────────────────────────────────────────────── */
$subject = clean_header((string)($_POST['subject'] ?? ''));
if ($subject === '') $subject = "$SITE_NAME — Form submission";

$replyEmail = '';
if (!empty($_POST['email']) && filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
    $replyEmail = $_POST['email'];
}

// Fields that shouldn't appear in the email body
$skip = [
    'access_key', 'botcheck', 'subject', 'from_name', 'captcha',
    'cf-turnstile-response', 'h-captcha-response', 'g-recaptcha-response',
];

$rows = [];
foreach ($_POST as $key => $value) {
    if (in_array($key, $skip, true)) continue;
    if (is_array($value)) $value = implode(', ', array_map('strval', $value));
    $value = trim((string)$value);
    if ($value === '') continue;
    $rows[] = pretty_label($key) . ': ' . $value;
}

$body  = "New submission from the $SITE_NAME website\n";
$body .= str_repeat('-', 50) . "\n\n";
$body .= implode("\n", $rows) . "\n\n";
$body .= str_repeat('-', 50) . "\n";
$body .= 'Submitted: ' . date('Y-m-d H:i:s T') . "\n";
$body .= 'IP:        ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";
$body .= 'User-Agent: ' . clean_header((string)($_SERVER['HTTP_USER_AGENT'] ?? 'unknown')) . "\n";

/* ── Mail headers ─────────────────────────────────────────────────────── */
$headers   = [];
$headers[] = 'From: ' . clean_header($FROM_NAME) . ' <' . $FROM_EMAIL . '>';
if ($replyEmail) $headers[] = 'Reply-To: ' . clean_header($replyEmail);
if (!empty($BCC)) $headers[] = 'Bcc: ' . implode(', ', array_map('clean_header', $BCC));
$headers[] = 'X-Mailer: PHP/' . phpversion();
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';

/* ── Send ─────────────────────────────────────────────────────────────── */
$sent = @mail($RECIPIENT, $subject, $body, implode("\r\n", $headers));

if ($sent) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Sorry — the message could not be sent right now. Please email info@ashfordcollege.ca directly.',
    ]);
}
