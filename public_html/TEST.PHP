<?php
require_once 'config.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Test Page | S&B Astro</title>
    <link rel="stylesheet" href="style.css">
    <style>
        .test-box {
            max-width: 500px;
            margin: 100px auto;
            background: #1e1e2f;
            padding: 40px;
            border-radius: 12px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="test-box">
        <h1>Payment Demo (₹1)</h1>
        <p style="margin-bottom: 30px; color: var(--text-gray);">
            This is a test page to verify the PhonePe integration with a small transaction.
        </p>

        <form action="payment_init.php" method="POST" style="display:grid; gap:15px; text-align:left;">
            <input type="hidden" name="plan_id" value="test">
            <input type="text" name="name" placeholder="Full Name" required style="padding:15px; background:#2a2a40; border:none; color:white; border-radius:4px;">
            <input type="date" name="dob" value="1990-01-01" required style="padding:15px; background:#2a2a40; border:none; color:white; border-radius:4px; display:none;">
            <input type="time" name="tob" value="12:00" required style="padding:15px; background:#2a2a40; border:none; color:white; border-radius:4px; display:none;">
            <input type="text" name="pob" value="Test Place" required style="padding:15px; background:#2a2a40; border:none; color:white; border-radius:4px; display:none;">
            
            <button type="submit" class="btn btn-primary" style="background:var(--accent-gold); color:black; width: 100%;">Pay ₹1 Now</button>
        </form>

        <p style="margin-top: 20px; font-size: 0.8rem; color: #ff5252;">
            Note: If you use Sandbox credentials, this will not deduct real money. 
            For real money tests, you must switch to Production credentials in config.php.
        </p>
    </div>
</body>
</html>
