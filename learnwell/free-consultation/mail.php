<?php
declare(strict_types=1);

/**
 * Learnwell landing page form handler.
 * POST, JSON back, honeypot,
 * optional Turnstile, then a plain-text mail() to the office.
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

/* ── Config ───────────────────────────────────────────────────────────────
   CONFIRM BEFORE LAUNCH. learnwellinstitute.ca links info@learnwell.com,
   which is not their own domain, so it is very likely a typo on their site.
   Do not ship until the client confirms the address that should receive leads. */

$RECIPIENT  = 'marketing@learnwellinstitute.ca';
$BCC        = [];

$FROM_EMAIL = 'no-reply@learnwellinstitute.ca';   // must be on the sending domain
$FROM_NAME  = 'Learnwell Landing Page';
$SITE_NAME  = 'Learnwell Institute';

/* Leave empty to skip captcha checks. Add Learnwell's own Turnstile secret
   (dash.cloudflare.com) and drop the widget into the form to switch it on.
   Do not reuse another site's key. */
$TURNSTILE_SECRET = '';

/* ── Honeypot ─────────────────────────────────────────────────────────────
   Bots tick every box. Answer 200 so they do not learn anything. */

if (!empty($_POST['botcheck'])) {
    echo json_encode(['success' => true]);
    exit;
}

/* ── Cloudflare Turnstile (only when a secret is configured) ─────────────── */

if ($TURNSTILE_SECRET !== '') {

    $token = $_POST['cf-turnstile-response'] ?? '';

    if ($token === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Please complete the captcha.']);
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

    $verifyOk = $verify && (json_decode($verify, true)['success'] ?? false);

    if (!$verifyOk) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Captcha verification failed.']);
        exit;
    }
}

/* ── Helpers ──────────────────────────────────────────────────────────────
   Strip CR and LF from anything that lands in a mail header, otherwise a
   submitted value could inject extra headers. */

function clean_header(string $value): string
{
    return trim(preg_replace('/[\r\n]+/', ' ', $value));
}

function pretty_label(string $key): string
{
    return ucwords(str_replace(['_', '-'], ' ', $key));
}

/* ── Required fields ──────────────────────────────────────────────────────
   The browser validates too, but a POST can arrive from anywhere. */

$required = ['first_name', 'last_name', 'email', 'phone',
             'french_level', 'goal', 'status', 'best_time'];

$isNewsletter = strpos((string)($_POST['subject'] ?? ''), '[Prep checklist]') !== false;

if (!$isNewsletter) {
    foreach ($required as $field) {
        if (trim((string)($_POST[$field] ?? '')) === '') {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'Please complete every required field.'
            ]);
            exit;
        }
    }
}

/* An unticked checkbox is not submitted at all, so this has to be checked
   server side too, not just with the required attribute on the input. */
if (!$isNewsletter && trim((string)($_POST['consent'] ?? '')) === '') {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Please agree to be contacted so we can reach you.'
    ]);
    exit;
}

if (empty($_POST['email']) || !filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'That email address does not look right.'
    ]);
    exit;
}

/* ── Subject ──────────────────────────────────────────────────────────────
   RFC 2047 encode when non-ASCII appears, or accents corrupt the header. */

$subject = clean_header((string)($_POST['subject'] ?? ''));

if ($subject === '') {
    $subject = $SITE_NAME . ' - Form Submission';
}

if (!$isNewsletter && !empty($_POST['first_name'])) {
    $subject .= ' - ' . clean_header((string)$_POST['first_name'])
             . ' ' . clean_header((string)($_POST['last_name'] ?? ''));
}

if (preg_match('/[^\x20-\x7E]/', $subject)) {
    $subject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
}

/* ── Body ─────────────────────────────────────────────────────────────── */

$skip = ['botcheck', 'subject', 'cf-turnstile-response',
         'g-recaptcha-response', 'h-captcha-response'];

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

$body  = "New enquiry from the {$SITE_NAME} landing page\n";
$body .= str_repeat('-', 60) . "\n\n";
$body .= implode("\n", $rows);
$body .= "\n\n" . str_repeat('-', 60) . "\n";
$body .= 'Submitted: ' . date('Y-m-d H:i:s T') . "\n";
$body .= 'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";
$body .= 'User-Agent: ' . clean_header((string)($_SERVER['HTTP_USER_AGENT'] ?? 'unknown'));

/* ── Headers ──────────────────────────────────────────────────────────────
   From stays on the sending domain so SPF and DKIM pass. The visitor's
   address goes in Reply-To, so hitting reply answers the student. */

$headers = [];
$headers[] = 'From: ' . clean_header($FROM_NAME) . ' <' . $FROM_EMAIL . '>';
$headers[] = 'Reply-To: ' . clean_header((string)$_POST['email']);

if (!empty($BCC)) {
    $headers[] = 'Bcc: ' . implode(', ', array_map('clean_header', $BCC));
}

$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'X-Mailer: PHP/' . phpversion();

/* ── Send ─────────────────────────────────────────────────────────────── */

$sent = @mail($RECIPIENT, $subject, $body, implode("\r\n", $headers));

/* The page submits with fetch and Accept: application/json. A plain form post
   (JavaScript unavailable) gets a real redirect instead, so the URL still
   changes to the confirmation page. */
$wantsJson = stripos((string)($_SERVER['HTTP_ACCEPT'] ?? ''), 'application/json') !== false;

if ($sent) {
    if (!$wantsJson) {
        header('Location: /thankyou/', true, 303);
        exit;
    }
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'We could not send that just now. Please call 604-906-0006.'
    ]);
}
