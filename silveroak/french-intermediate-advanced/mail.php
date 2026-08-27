<?php
declare(strict_types=1);

/**
 * Silver Oak College, French landing page form handler.
 * POST only, JSON back, honeypot, optional Turnstile,
 * then a plain-text mail() to the college.
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

/* ── Config ─────────────────────────────────────────────────────────────── */

$RECIPIENT  = 'learn@silveroakcollege.ca';
$BCC        = [];                                  // e.g. ['info@silveroakcollege.ca']

$FROM_EMAIL = 'no-reply@silveroakcollege.ca';      // must be a real mailbox on the sending domain
$FROM_NAME  = 'Silver Oak College Landing Page';
$SITE_NAME  = 'Silver Oak College';
$PHONE      = '604-750-4013';

/* Leave empty to skip captcha checks. Add Silver Oak's own Turnstile secret
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

function field(string $key): string
{
    return trim((string)($_POST[$key] ?? ''));
}

function fail(int $code, string $message): void
{
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

/* ── Validation ───────────────────────────────────────────────────────────
   The browser validates too, but a POST can arrive from anywhere. */

$required = ['first_name', 'last_name', 'phone', 'email', 'french_level', 'goal', 'demo_date'];

foreach ($required as $key) {
    if (field($key) === '') {
        fail(422, 'Please complete every required field.');
    }
}

if (!filter_var(field('email'), FILTER_VALIDATE_EMAIL)) {
    fail(422, 'That email address does not look right.');
}

/* The date arrives as YYYY-MM-DD from <input type="date">. Reject anything that
   is not a real calendar date, so the office never gets "2026-02-31". */
$demoDate = field('demo_date');
$parsed   = DateTime::createFromFormat('!Y-m-d', $demoDate);

if (!$parsed || $parsed->format('Y-m-d') !== $demoDate) {
    fail(422, 'Please choose a valid date for your demo class.');
}

if ($parsed < new DateTime('today')) {
    fail(422, 'Please choose a date that has not already passed.');
}

/* ── Subject ──────────────────────────────────────────────────────────────
   RFC 2047 encode when non-ASCII appears, or accents corrupt the header. */

$subject = clean_header((string)($_POST['subject'] ?? ''));

if ($subject === '') {
    $subject = $SITE_NAME . ' - Form Submission';
}

$subject .= ' - ' . clean_header(field('first_name')) . ' ' . clean_header(field('last_name'));

if (preg_match('/[^\x20-\x7E]/', $subject)) {
    $subject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
}

/* ── Body ─────────────────────────────────────────────────────────────────
   Written in a fixed order so the office always reads the same layout,
   rather than whatever order the browser happened to serialise. */

$rows = [
    'Name'          => field('first_name') . ' ' . field('last_name'),
    'Phone'         => field('phone'),
    'Email'         => field('email'),
    'French level'  => field('french_level'),
    'Main goal'     => field('goal'),
    'Demo class on' => $parsed->format('l, j F Y'),
];

$lines = [];

foreach ($rows as $key => $value) {
    /* One row per line. Line breaks inside a value cannot inject a header, since
       the body is passed to mail() separately, but they would break the column
       layout the office reads, so they are collapsed to spaces. */
    $value = clean_header($value);
    if ($value !== '') {
        $lines[] = str_pad($key, 15) . ': ' . $value;
    }
}

$body  = "New free demo class request from the {$SITE_NAME} French landing page\n";
$body .= str_repeat('-', 62) . "\n\n";
$body .= implode("\n", $lines);
$body .= "\n\n" . str_repeat('-', 62) . "\n";
$body .= 'Submitted: ' . date('Y-m-d H:i:s T') . "\n";
$body .= 'Page: ' . clean_header(field('page')) . "\n";
$body .= 'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";
$body .= 'User-Agent: ' . clean_header((string)($_SERVER['HTTP_USER_AGENT'] ?? 'unknown'));

/* ── Headers ──────────────────────────────────────────────────────────────
   From stays on the sending domain so SPF and DKIM pass. The student's
   address goes in Reply-To, so hitting reply answers them. */

$headers = [];
$headers[] = 'From: ' . clean_header($FROM_NAME) . ' <' . $FROM_EMAIL . '>';
$headers[] = 'Reply-To: ' . clean_header(field('email'));

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
        /* Derived from this script's own location rather than hardcoded to
           "/thankyou/", so it holds whether the page sits at the domain root or
           under a subpath. /a/b/mail.php gives /a/thankyou/, /b/mail.php gives
           /thankyou/. */
        $script = (string)($_SERVER['SCRIPT_NAME'] ?? '');
        $parts  = array_values(array_filter(explode('/', $script), 'strlen'));
        array_pop($parts);                      // drop mail.php
        array_pop($parts);                      // drop the landing page folder
        $base   = $parts ? '/' . implode('/', $parts) : '';

        header('Location: ' . $base . '/thankyou/', true, 303);
        exit;
    }
    echo json_encode(['success' => true]);
} else {
    fail(500, 'We could not send that just now. Please call ' . $PHONE . '.');
}
