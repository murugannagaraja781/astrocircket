<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Status</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #0F172A;
            color: white;
            text-align: center;
        }
        .card {
            background: #1E293B;
            padding: 40px;
            border-radius: 24px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        .success-icon {
            font-size: 60px;
            color: #10B981;
            margin-bottom: 20px;
        }
        h1 { margin: 0 0 10px; font-size: 24px; }
        p { color: #94A3B8; margin: 0; }
    </style>
</head>
<body>
    <div class="card">
        <div class="success-icon">✓</div>
        <h1>Payment Successful</h1>
        <p>Your analysis has been unlocked. Returning to app...</p>
    </div>
    <script>
        // Optional: Auto-close or post message for future reliability
        console.log("Payment status: SUCCESS");
    </script>
</body>
</html>
