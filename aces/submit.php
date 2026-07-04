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

$RECIPIENT  = 'info@aspirecareers.ca';
$BCC        = [];

$FROM_EMAIL = 'info@aspirecareers.ca';
$FROM_NAME  = 'Aspire Career & Educational Services Website';
$SITE_NAME  = 'Aspire Career & Educational Services';

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

if ($sent) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to send email at this time.']);
}
