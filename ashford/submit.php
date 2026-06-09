<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed.'
    ]);
    exit;
}

/* ── Config ───────────────────────────────────────────────────────────── */

$RECIPIENT  = 'info@ashfordcollege.ca';
$BCC        = ['manjot15857@gmail.com'];

$FROM_EMAIL = 'info@ashfordcollege.ca';
$FROM_NAME  = 'Ashford Career College Website';
$SITE_NAME  = 'Ashford Career College';

/* ── Honeypot ─────────────────────────────────────────────────────────── */

if (!empty($_POST['botcheck'])) {
    echo json_encode(['success' => true]);
    exit;
}

/* ── Cloudflare Turnstile ─────────────────────────────────────────────── */

$isPartial = (
    strpos((string)($_POST['subject'] ?? ''), '[Partial Lead]') !== false
);

if (!$isPartial) {

    $TURNSTILE_SECRET = '0x4AAAAAADY2mXwKFAymwQaIDvKoAL-vlnA';

    $token = $_POST['cf-turnstile-response'] ?? '';

    if ($token === '') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Please complete the captcha.'
        ]);
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
            ],
        ])
    );

    $verifyOk = $verify &&
        (json_decode($verify, true)['success'] ?? false);

    if (!$verifyOk) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Captcha verification failed.'
        ]);
        exit;
    }
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

function clean_header(string $value): string
{
    return trim(
        preg_replace('/[\r\n]+/', ' ', $value)
    );
}

function pretty_label(string $key): string
{
    return ucwords(
        str_replace(['_', '-'], ' ', $key)
    );
}

/* ── Subject ──────────────────────────────────────────────────────────── */

$subject = clean_header(
    (string)($_POST['subject'] ?? '')
);

if ($subject === '') {
    $subject = $SITE_NAME . ' - Form Submission';
}

// RFC 2047 encode so non-ASCII characters don't corrupt the Subject header.
if (preg_match('/[^\x20-\x7E]/', $subject)) {
    $subject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
}

/* ── Reply-To ─────────────────────────────────────────────────────────── */

$replyEmail = '';

if (
    !empty($_POST['email']) &&
    filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)
) {
    $replyEmail = $_POST['email'];
}

/* ── Build Email Body ─────────────────────────────────────────────────── */

$skip = [
    'access_key',
    'botcheck',
    'subject',
    'from_name',
    'captcha',
    'cf-turnstile-response',
    'g-recaptcha-response',
    'h-captcha-response'
];

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
$body .= 'User-Agent: ' .
    clean_header((string)($_SERVER['HTTP_USER_AGENT'] ?? 'unknown'));

/* ── Headers ──────────────────────────────────────────────────────────── */

$headers = [];

$headers[] = 'From: ' . clean_header($FROM_NAME) .
             ' <' . $FROM_EMAIL . '>';

if ($replyEmail) {
    $headers[] = 'Reply-To: ' . clean_header($replyEmail);
}

if (!empty($BCC)) {
    $headers[] = 'Bcc: ' .
        implode(', ', array_map('clean_header', $BCC));
}

$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'X-Mailer: PHP/' . phpversion();

/* ── Send ─────────────────────────────────────────────────────────────── */

$sent = @mail(
    $RECIPIENT,
    $subject,
    $body,
    implode("\r\n", $headers)
);

if ($sent) {

    echo json_encode([
        'success' => true
    ]);

} else {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to send email at this time.'
    ]);
}