<?php
/**
 * JSON API for Mobile App Payment Initiation
 */
header('Content-Type: application/json');

// Allow CORS from any origin (needed for Flutter Web)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Enable detailed error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't echo errors to the body (breaks JSON)

// Custom Error Handler to catch Fatals/Warnings and return as JSON
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    echo json_encode([
        'success' => false,
        'error' => "PHP Error [$errno]: $errstr",
        'location' => "File: $errfile | Line: $errline"
    ]);
    exit();
});

// Custom Exception Handler
set_exception_handler(function($e) {
    echo json_encode([
        'success' => false,
        'error' => "PHP Exception: " . $e->getMessage(),
        'location' => "File: " . $e->getFile() . " | Line: " . $e->getLine()
    ]);
    exit();
});

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../phonepe_helper.php';

// 1. Get JSON POST Data
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
    exit();
}

$amountPaisa = $data['amount'] ?? 0;
$userId = $data['userId'] ?? 'unknown';
$matchId = $data['matchId'] ?? 'none';
$planType = $data['planType'] ?? 'basic';

if ($amountPaisa <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid amount']);
    exit();
}

// 2. Generate unique order ID for App
$orderId = 'SBA_APP_' . date('YmdHis') . '_' . rand(100, 999);

// 3. Log the initial transaction to CSV for reports
$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}

$csvFile = $logDir . '/payments.csv';
$csvData = [
    date('Y-m-d H:i:s'),
    $orderId,
    $userId,
    $matchId,
    $amountPaisa / 100, // INR
    $planType,
    'PENDING'
];

// Open for appending, handles file creation automatically
$file = @fopen($csvFile, 'a');
if ($file) {
    fputcsv($file, $csvData);
    fclose($file);
}

// 4. Get PhonePe Token
$token = getPhonePeToken();
if (!$token) {
    echo json_encode(['success' => false, 'error' => 'Authentication failed with PhonePe']);
    exit();
}

// 4. Initiate Order
// Append orderId to the redirect URL so payment_response.php can retrieve it
$redirectWithId = REDIRECT_URL . "?merchantOrderId=" . $orderId;
$response = initiatePhonePeOrder($token, $orderId, $amountPaisa / 100, $redirectWithId);

if ($response['success'] && isset($response['data']['redirectUrl'])) {
    echo json_encode([
        'success' => true,
        'redirectUrl' => $response['data']['redirectUrl'],
        'orderId' => $orderId
    ]);
} else {
    echo json_encode([
        'success' => false, 
        'error' => 'Initiation failed', 
        'raw' => $response
    ]);
}
?>
