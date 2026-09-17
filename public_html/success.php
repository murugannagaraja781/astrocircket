<?php
session_start();
require_once 'config.php';

$id = $_GET['id'] ?? 'Unknown';
$data = $_SESSION['payment_data'] ?? null;
$plan = $plans[$data['plan_id'] ?? ''] ?? null;

// Clean up session if needed, but we keep data for one last WhatsApp redirect
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Successful | S&B Astro</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
    <style>
        .success-container {
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
            color: #4CAF50;
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
        <div class="success-container">
            <div class="icon">✓</div>
            <h1>Payment Successful!</h1>
            <p>Thank you for choosing S&B Astro. Your consultation is now secured.</p>
            <div class="order-id">Transaction ID: <?php echo htmlspecialchars($id); ?></div>
            
            <?php if ($data): ?>
                <div style="margin: 30px 0; text-align: left; background: #2a2a40; padding: 20px; border-radius: 8px;">
                    <p><strong>Name:</strong> <?php echo htmlspecialchars($data['name']); ?></p>
                    <p><strong>Plan:</strong> <?php echo htmlspecialchars($plan['name'] ?? 'Consultation'); ?></p>
                </div>
            <?php endif; ?>

            <p style="margin-bottom: 30px; font-size: 0.9rem; color: var(--text-gray);">
                Please click the button below to send your birth details to Santhosh via WhatsApp and start the consultation.
            </p>

            <?php
            if ($data) {
                $whatsapp_number = "919488818867";
                $msg = "Hello Santhosh, I have paid successfully for the " . ($plan['name'] ?? 'Consultation') . " plan.%0A" .
                       "Transaction ID: $id%0A%0A" .
                       "My Details:%0A" .
                       "Name: " . urlencode($data['name']) . "%0A" .
                       "DOB: " . urlencode($data['dob']) . "%0A" .
                       "Time: " . urlencode($data['tob']) . "%0A" .
                       "Place: " . urlencode($data['pob']);
                $wa_url = "https://wa.me/$whatsapp_number?text=$msg";
            } else {
                $wa_url = "https://wa.me/919488818867";
            }
            ?>
            <a href="<?php echo $wa_url; ?>" class="btn btn-primary" style="display: block; width: 100%; text-decoration: none;">Connect on WhatsApp</a>
            <br>
            <a href="index.php" style="color: var(--accent-gold); text-decoration: none; font-size: 0.9rem;">Back to Home</a>
        </div>
    </div>
</body>
</html>
