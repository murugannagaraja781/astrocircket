<?php
session_start();
require_once 'config.php';

$registration = $_SESSION['registered_player'] ?? null;
if (!$registration) {
    header("Location: consultation.php");
    exit();
}

$player = $registration['data'];
$nodeData = $registration['nodeData'];
$playerId = $registration['id'];
$hasChart = $registration['chartGenerated'];

// Extract chart summary if available
$rasi = $nodeData['birthChart']['planets']['Moon']['sign'] ?? ($nodeData['birthChart']['planets']['Moon']['signTamil'] ?? null);
$nakshatra = $nodeData['birthChart']['planets']['Moon']['nakshatra'] ?? ($nodeData['birthChart']['planets']['Moon']['nakshatraTamil'] ?? null);
$lagna = $nodeData['birthChart']['lagna']['sign'] ?? null;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration Successful | Astro Cricket</title>
    <link rel="stylesheet" href="style.css">
    <link rel="icon" type="image/png" href="assets/favicon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
</head>
<body>

    <!-- Navigation Bar -->
    <nav>
        <div class="container">
            <div class="logo"><a href="index.php"><img src="assets/logo.png" alt="Astro Cricket Logo"></a></div>
            <div class="nav-links">
                <a href="index.php">HOME</a>
                <a href="about.php">ABOUT</a>
                <a href="consultation.php">PLAYER REGISTRATION</a>
            </div>
        </div>
    </nav>

    <div class="container" style="padding-top: 40px; padding-bottom: 60px;">
        <div class="success-card">
            <div class="success-badge">✓</div>
            <h2>Player Registration Confirmed!</h2>
            <p style="color:var(--text-gray); margin-top:5px;">Your details and birth coordinates have been securely onboarded.</p>

            <div class="player-profile-badge">
                <?php if (!empty($player['profile']) && file_exists(__DIR__ . '/uploads/' . $player['profile'])): ?>
                    <img src="uploads/<?php echo htmlspecialchars($player['profile']); ?>" alt="<?php echo htmlspecialchars($player['name']); ?>">
                <?php else: ?>
                    <div style="width:80px; height:80px; border-radius:50%; background:#2a2a44; display:flex; align-items:center; justify-content:center; font-size:2rem; border:2px solid var(--accent-gold);">
                        🏏
                    </div>
                <?php endif; ?>
                
                <div class="player-meta">
                    <h3><?php echo htmlspecialchars($player['name']); ?></h3>
                    <p style="color:var(--accent-gold); font-weight:600;">
                        <?php echo htmlspecialchars($player['teamName']); ?> • <?php echo htmlspecialchars($player['teamCity']); ?>
                    </p>
                    <p>Role: <strong><?php echo htmlspecialchars($player['role']); ?></strong> <?php if (!empty($player['jerseyNumber'])): ?> | Jersey: #<?php echo htmlspecialchars($player['jerseyNumber']); ?><?php endif; ?></p>
                    <p style="font-size:0.8rem; color:#888;">Registration ID: <code style="color:var(--accent-gold);"><?php echo htmlspecialchars($playerId); ?></code></p>
                </div>
            </div>

            <!-- Astrological Status Box -->
            <div style="background:#19192e; border:1px solid #303050; border-radius:10px; padding:15px; margin:20px 0; text-align:left;">
                <h4 style="color:var(--accent-gold); font-size:0.95rem; margin-bottom:8px; display:flex; align-items:center; gap:8px;">
                    <span>✨</span> Astrological Profile Status
                </h4>
                <?php if ($hasChart && ($rasi || $nakshatra)): ?>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.88rem; margin-top:10px;">
                        <div><strong style="color:var(--text-gray);">Moon Sign (Rasi):</strong> <span style="color:#fff;"><?php echo htmlspecialchars($rasi); ?></span></div>
                        <div><strong style="color:var(--text-gray);">Nakshatra:</strong> <span style="color:#fff;"><?php echo htmlspecialchars($nakshatra); ?></span></div>
                        <?php if ($lagna): ?>
                            <div><strong style="color:var(--text-gray);">Ascendant (Lagna):</strong> <span style="color:#fff;"><?php echo htmlspecialchars($lagna); ?></span></div>
                        <?php endif; ?>
                    </div>
                <?php else: ?>
                    <p style="font-size:0.85rem; color:#a0a0b8; margin:0;">
                        ✓ KP Birth chart calculation initiated for <strong><?php echo htmlspecialchars($player['birthPlace']); ?></strong> (<?php echo htmlspecialchars($player['dob']); ?> at <?php echo htmlspecialchars($player['birthTime']); ?>).
                    </p>
                <?php endif; ?>
            </div>

            <!-- Detailed Overview Table -->
            <table class="details-table">
                <tr>
                    <td>Date of Birth:</td>
                    <td><?php echo htmlspecialchars($player['dob']); ?></td>
                </tr>
                <tr>
                    <td>Time of Birth:</td>
                    <td><?php echo htmlspecialchars($player['birthTime']); ?></td>
                </tr>
                <tr>
                    <td>Place of Birth:</td>
                    <td><?php echo htmlspecialchars($player['birthPlace']); ?></td>
                </tr>
                <tr>
                    <td>Mobile / WhatsApp:</td>
                    <td><?php echo htmlspecialchars($player['mobile']); ?></td>
                </tr>
                <?php if (!empty($player['email'])): ?>
                <tr>
                    <td>Email:</td>
                    <td><?php echo htmlspecialchars($player['email']); ?></td>
                </tr>
                <?php endif; ?>
                <?php if (!empty($player['battingStyle'])): ?>
                <tr>
                    <td>Batting Style:</td>
                    <td><?php echo htmlspecialchars($player['battingStyle']); ?></td>
                </tr>
                <?php endif; ?>
                <?php if (!empty($player['bowlingStyle'])): ?>
                <tr>
                    <td>Bowling Style:</td>
                    <td><?php echo htmlspecialchars($player['bowlingStyle']); ?></td>
                </tr>
                <?php endif; ?>
            </table>

            <div style="display:flex; gap:15px; justify-content:center; flex-wrap:wrap; margin-top:30px;">
                <a href="https://wa.me/919488818867?text=<?php echo urlencode("Hello Santhosh, I have registered cricket player {$player['name']} from {$player['teamName']} ({$player['teamCity']}). Registration ID: {$playerId}"); ?>" target="_blank" class="btn btn-whatsapp" style="margin:0;">
                    Share on WhatsApp
                </a>
                <a href="consultation.php" class="btn btn-primary">Register Another Player</a>
                <a href="index.php" class="btn" style="background:#25253e; color:#ffffff;">Home</a>
            </div>
        </div>
    </div>

</body>
</html>
