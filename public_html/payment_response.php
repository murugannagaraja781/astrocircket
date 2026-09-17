<?php
session_start();
require_once 'config.php';
require_once 'phonepe_helper.php';

// Retrieve the merchantOrderId from the URL or session
$merchantOrderId = $_GET['merchantOrderId'] ?? ($_SESSION['merchantOrderId'] ?? null);

if (!$merchantOrderId) {
    die("Error: Missing transaction ID.");
}

// 1. Get PhonePe Token
$token = getPhonePeToken();

if (!$token) {
    die("Error: Unable to authenticate for status check.");
}

// 2. Check Order Status
$statusResponse = checkPhonePeStatus($token, $merchantOrderId);

if ($statusResponse['success']) {
    $state = $statusResponse['data']['state'] ?? 'FAILED';

    if ($state === 'COMPLETED') {
        // Redirect differently for App vs Website
        if (strpos($merchantOrderId, 'SBA_APP_') === 0) {
            header("Location: app/payment_status.php?id=" . urlencode($merchantOrderId));
        } else {
            header("Location: success.php?id=" . urlencode($merchantOrderId));
        }
        exit();
    } else if ($state === 'PENDING') {
        // Handle pending state if needed (e.g., polling or informing user)
        echo "Payment is pending. Please wait or check back later.";
    } else {
        header("Location: failure.php?id=" . urlencode($merchantOrderId));
        exit();
    }
} else {
    header("Location: failure.php?id=" . urlencode($merchantOrderId));
    exit();
}
?>
