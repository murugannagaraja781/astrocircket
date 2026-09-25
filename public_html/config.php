<?php
/**
 * PhonePe V2 Integration Configuration (Production)
 */

// Simple .env Loader
function loadEnv($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        putenv(trim($name) . "=" . trim($value));
    }
}

loadEnv(__DIR__ . '/.env');

// Credentials from .env
define('PHONEPE_CLIENT_ID', getenv('PHONEPE_CLIENT_ID'));
define('PHONEPE_CLIENT_SECRET', getenv('PHONEPE_CLIENT_SECRET'));
define('PHONEPE_CLIENT_VERSION', getenv('PHONEPE_CLIENT_VERSION'));
define('PHONEPE_ENV', getenv('PHONEPE_ENV') ?: 'PRODUCTION');

// Production URLs
define('PHONEPE_AUTH_URL', 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token');
define('PHONEPE_BASE_URL', 'https://api.phonepe.com/apis/pg');

// Website & API URLs
define('SITE_URL', 'https://sbastro.com'); 
define('REDIRECT_URL', SITE_URL . '/payment_response.php');
define('NODE_API_URL', getenv('NODE_API_URL') ?: 'http://localhost:5001');
define('ADMIN_PASSWORD', getenv('ADMIN_PASSWORD') ?: 'astroadmin2026');

// Consultation Plans Mapping
$plans = [
    'test' => [
        'name' => 'Demo Test',
        'amount' => 1,
        'description' => '1 Rupee Test Payment'
    ],
    '99' => [
        'name' => 'Quick Question',
        'amount' => 99,
        'description' => 'Ask Your Question'
    ],
    '999' => [
        'name' => 'Quick Entry',
        'amount' => 999,
        'description' => '15 Min Consultation'
    ],
    '1499' => [
        'name' => 'Personal Numerology',
        'amount' => 1499,
        'description' => 'Full Name Analysis'
    ],
    '2499' => [
        'name' => 'Full Success Blueprint',
        'amount' => 2499,
        'description' => '45 Min Consultation'
    ],
    '4999' => [
        'name' => 'Premium Growth',
        'amount' => 4999,
        'description' => 'Deep Annual Planning'
    ]
];
?>
