<?php
session_start();
require_once 'config.php';

$id = $_GET['id'] ?? 'Unknown';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Failed | S&B Astro</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
    <style>
        .failure-container {
            max-width: 600px;
            margin: 100px auto;
            text-align: center;
            padding: 40px;
            background: #1e1e2f;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .icon {
            font-size: 60px;
            color: #f44336;
            margin-bottom: 20px;
        }
        .order-id {
            color: var(--text-gray);
            font-family: monospace;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="failure-container">
            <div class="icon">✕</div>
            <h1>Payment Failed</h1>
            <p>We're sorry, but your transaction could not be completed.</p>
            <div class="order-id">Transaction ID: <?php echo htmlspecialchars($id); ?></div>
            
            <p style="margin: 30px 0; font-size: 0.9rem; color: var(--text-gray);">
                If your money was deducted, please don't worry. It will be refunded within 3-5 working days. You can try again or contact support for help.
            </p>

            <a href="consultation.php" class="btn btn-primary" style="display: block; width: 100%; text-decoration: none;">Try Again</a>
            <br>
            <a href="https://wa.me/919488818867?text=Payment%20failed%20for%20order%20<?php echo $id; ?>" style="color: var(--accent-gold); text-decoration: none; font-size: 0.9rem;">Contact Support on WhatsApp</a>
        </div>
    </div>
</body>
</html>
