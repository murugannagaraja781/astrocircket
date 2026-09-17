<?php
/**
 * JSON API for Manually Verifying Payment Status from App
 */
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit();
}

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../phonepe_helper.php';

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data || !isset($data['orderId'])) {
    echo json_encode(['success' => false, 'error' => 'Missing orderId']);
    exit();
}

$orderId = $data['orderId'];

// 1. Get Token
$token = getPhonePeToken();
if (!$token) {
    echo json_encode(['success' => false, 'error' => 'Failed to authenticate with PhonePe']);
    exit();
}

// 2. Check Status
$statusResponse = checkPhonePeStatus($token, $orderId);

if ($statusResponse['success']) {
    $state = $statusResponse['data']['state'] ?? 'FAILED';
    
    echo json_encode([
        'success' => true,
        'status' => $state, // Should be COMPLETED, FAILED, or PENDING
        'orderId' => $orderId
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Status check failed',
        'raw' => $statusResponse
    ]);
}
?>
