<?php
require_once __DIR__ . '/config.php';

/**
 * Get PhonePe OAuth2 Token
 */
function getPhonePeToken() {
    $curl = curl_init();

    $postData = [
        'client_id' => PHONEPE_CLIENT_ID,
        'client_version' => PHONEPE_CLIENT_VERSION,
        'client_secret' => PHONEPE_CLIENT_SECRET,
        'grant_type' => 'client_credentials'
    ];

    curl_setopt_array($curl, [
        CURLOPT_URL => PHONEPE_AUTH_URL,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($postData),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/x-www-form-urlencoded'
        ],
    ]);

    $response = curl_exec($curl);
    $err = curl_error($curl);
    curl_close($curl);

    if ($err) {
        return null;
    }

    $result = json_decode($response, true);
    return $result['access_token'] ?? null;
}

/**
 * Initiate Payment Order (V2 Pay)
 */
function initiatePhonePeOrder($token, $orderId, $amount, $redirectUrl) {
    $curl = curl_init();

    // Standard Checkout V2 Payload
    $payload = [
        "merchantOrderId" => $orderId,
        "amount" => $amount * 100, // PhonePe expects amount in PAISA
        "paymentFlow" => [
            "type" => "PG_CHECKOUT",
            "merchantUrls" => [
                "redirectUrl" => $redirectUrl
            ]
        ]
    ];

    curl_setopt_array($curl, [
        CURLOPT_URL => PHONEPE_BASE_URL . '/checkout/v2/pay',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: O-Bearer ' . $token
        ],
    ]);

    $response = curl_exec($curl);
    $err = curl_error($curl);
    curl_close($curl);

    if ($err) {
        return ['success' => false, 'error' => $err];
    }

    return ['success' => true, 'data' => json_decode($response, true)];
}

/**
 * Verify Order Status
 */
function checkPhonePeStatus($token, $merchantOrderId) {
    $curl = curl_init();

    curl_setopt_array($curl, [
        CURLOPT_URL => PHONEPE_BASE_URL . "/checkout/v2/order/$merchantOrderId/status",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: O-Bearer ' . $token
        ],
    ]);

    $response = curl_exec($curl);
    $err = curl_error($curl);
    curl_close($curl);

    if ($err) {
        return ['success' => false, 'error' => $err];
    }

    return ['success' => true, 'data' => json_decode($response, true)];
}
?>
