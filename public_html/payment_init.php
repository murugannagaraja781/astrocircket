<?php
session_start();
require_once 'config.php';
require_once 'phonepe_helper.php';

// Validating the incoming request
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Storing birth details in session for post-payment use
    $_SESSION['payment_data'] = [
        'name' => $_POST['name'] ?? 'Unknown',
        'dob' => $_POST['dob'] ?? '',
        'tob' => $_POST['tob'] ?? '',
        'pob' => $_POST['pob'] ?? '',
        'plan_id' => $_POST['plan_id'] ?? '99' // fallback
    ];

    $plan_id = $_POST['plan_id'] ?? '99';
    $plan_details = $plans[$plan_id] ?? $plans['99'];
    $amount = $plan_details['amount'];

    // 1. Generate unique order ID
    $merchantOrderId = 'SB' . date('YmdHis') . rand(100, 999);
    $_SESSION['merchantOrderId'] = $merchantOrderId;

    // 2. Get PhonePe Token
    $token = getPhonePeToken();
    if (!$token) {
        die("Error: Unable to authenticate with PhonePe.");
    }

    // 3. Initiate Order
    $response = initiatePhonePeOrder($token, $merchantOrderId, $amount, REDIRECT_URL);

    if ($response['success'] && isset($response['data']['redirectUrl'])) {
        // Redirecting the user to PhonePe Checkout Page
        header("Location: " . $response['data']['redirectUrl']);
        exit();
    } else {
        // Fallback for failure
        print_r($response);
        die("Error: Payment initiation failed.");
    }

} else {
    header("Location: index.php");
    exit();
}
?>
