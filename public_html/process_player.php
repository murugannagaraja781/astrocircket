<?php
session_start();
require_once 'config.php';

// Ensure uploads and logs directories exist
$uploadDir = __DIR__ . '/uploads/';
$logsDir = __DIR__ . '/logs/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}
if (!file_exists($logsDir)) {
    mkdir($logsDir, 0777, true);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Sanitize and read text inputs
    $name = trim($_POST['name'] ?? '');
    $dob = trim($_POST['dob'] ?? '');
    $tob = trim($_POST['tob'] ?? '12:00');
    $pob = trim($_POST['pob'] ?? '');
    $mobile = trim($_POST['mobile'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $teamName = trim($_POST['teamName'] ?? '');
    $teamCity = trim($_POST['teamCity'] ?? '');
    $role = trim($_POST['role'] ?? 'BAT');
    $battingStyle = trim($_POST['battingStyle'] ?? '');
    $bowlingStyle = trim($_POST['bowlingStyle'] ?? '');
    $jerseyNumber = trim($_POST['jerseyNumber'] ?? '');

    // Basic Validation
    if (empty($name) || empty($dob) || empty($pob) || empty($mobile) || empty($teamName) || empty($teamCity)) {
        $_SESSION['form_error'] = "Please fill in all mandatory fields.";
        header("Location: consultation.php");
        exit();
    }

    // Default time fallback
    if (empty($tob)) {
        $tob = '12:00';
    }

    $photoFilename = '';
    $uploadedFilePath = null;
    $mimeType = 'image/jpeg';

    // Handle Photo Upload
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['photo']['tmp_name'];
        $fileName = $_FILES['photo']['name'];
        $fileSize = $_FILES['photo']['size'];
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
        if (in_array($fileExtension, $allowedExtensions)) {
            $cleanPlayerName = preg_replace('/[^a-zA-Z0-9]/', '_', strtolower($name));
            $photoFilename = 'player_' . $cleanPlayerName . '_' . time() . '.' . $fileExtension;
            $destPath = $uploadDir . $photoFilename;

            if (move_uploaded_file($fileTmpPath, $destPath)) {
                $uploadedFilePath = $destPath;
                $mimeType = mime_content_type($destPath) ?: 'image/' . $fileExtension;
            }
        }
    }

    // Prepare Player Data Array
    $playerData = [
        'name' => $name,
        'dob' => $dob,
        'birthTime' => $tob,
        'birthPlace' => $pob,
        'mobile' => $mobile,
        'email' => $email,
        'teamName' => $teamName,
        'teamCity' => $teamCity,
        'role' => $role,
        'battingStyle' => $battingStyle,
        'bowlingStyle' => $bowlingStyle,
        'jerseyNumber' => $jerseyNumber,
        'profile' => $photoFilename,
        'registeredAt' => date('Y-m-d H:i:s')
    ];

    $nodeSuccess = false;
    $nodeResponseData = null;

    // Call Node.js Backend API via cURL
    $nodeApiUrl = rtrim(NODE_API_URL, '/') . '/api/players/add';

    if (function_exists('curl_init')) {
        $ch = curl_init();
        
        $postFields = [
            'name' => $name,
            'dob' => $dob,
            'birthTime' => $tob,
            'birthPlace' => $pob,
            'mobile' => $mobile,
            'email' => $email,
            'teamName' => $teamName,
            'teamCity' => $teamCity,
            'role' => $role,
            'jerseyNumber' => $jerseyNumber
        ];

        // Attach Image for Node.js multer
        if ($uploadedFilePath && file_exists($uploadedFilePath)) {
            $postFields['image'] = new CURLFile($uploadedFilePath, $mimeType, $photoFilename);
        }

        curl_setopt($ch, CURLOPT_URL, $nodeApiUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($httpCode === 200 || $httpCode === 201) {
            $nodeResponseData = json_decode($response, true);
            $nodeSuccess = true;
        } else {
            // Log the curl failure or server error
            $logEntry = date('[Y-m-d H:i:s]') . " Node API Error (HTTP $httpCode): $response | cURL Error: $curlError\n";
            file_put_contents($logsDir . 'node_api_errors.log', $logEntry, FILE_APPEND);
        }
    }

    // Fail-safe Local Backup: Always save to local JSON log
    $backupLogFile = $logsDir . 'registered_players.json';
    $existingRecords = [];
    if (file_exists($backupLogFile)) {
        $existingRecords = json_decode(file_get_contents($backupLogFile), true) ?: [];
    }
    $existingRecords[] = array_merge($playerData, [
        'node_synced' => $nodeSuccess,
        'node_response' => $nodeResponseData
    ]);
    file_put_contents($backupLogFile, json_encode($existingRecords, JSON_PRETTY_PRINT));

    // Store in Session for Success Page
    $_SESSION['registered_player'] = [
        'data' => $playerData,
        'nodeData' => $nodeResponseData,
        'chartGenerated' => ($nodeResponseData && !empty($nodeResponseData['birthChart'])),
        'id' => $nodeResponseData['id'] ?? ('ASTRO_' . rand(1000, 9999))
    ];

    // Redirect to Success Page
    header("Location: player_success.php");
    exit();

} else {
    header("Location: consultation.php");
    exit();
}
?>
