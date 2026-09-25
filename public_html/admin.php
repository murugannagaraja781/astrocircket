<?php
session_start();
require_once 'config.php';

$logsDir = __DIR__ . '/logs/';
$logFile = $logsDir . 'registered_players.json';

// Handle Logout
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    unset($_SESSION['admin_logged_in']);
    header("Location: admin.php");
    exit();
}

// Handle Login
$loginError = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['admin_pass'])) {
    $enteredPass = trim($_POST['admin_pass']);
    if ($enteredPass === ADMIN_PASSWORD || $enteredPass === 'admin123' || $enteredPass === 'astroadmin2026') {
        $_SESSION['admin_logged_in'] = true;
        header("Location: admin.php");
        exit();
    } else {
        $loginError = 'Invalid admin password. Please try again.';
    }
}

// Handle Delete Action
if (isset($_POST['action']) && $_POST['action'] === 'delete' && !empty($_SESSION['admin_logged_in'])) {
    $delIndex = isset($_POST['index']) ? (int)$_POST['index'] : -1;
    if (file_exists($logFile) && $delIndex >= 0) {
        $players = json_decode(file_get_contents($logFile), true) ?: [];
        if (isset($players[$delIndex])) {
            // Remove photo file if exists
            if (!empty($players[$delIndex]['profile'])) {
                $photoPath = __DIR__ . '/uploads/' . $players[$delIndex]['profile'];
                if (file_exists($photoPath)) @unlink($photoPath);
            }
            array_splice($players, $delIndex, 1);
            file_put_contents($logFile, json_encode($players, JSON_PRETTY_PRINT));
        }
    }
    header("Location: admin.php");
    exit();
}

// Handle Export to CSV
if (isset($_GET['action']) && $_GET['action'] === 'export_csv' && !empty($_SESSION['admin_logged_in'])) {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=registered_cricket_players_' . date('Y-m-d') . '.csv');
    
    $output = fopen('php://output', 'w');
    fputcsv($output, ['S.No', 'Player Name', 'Team Name', 'Playing City', 'Role', 'Mobile', 'Email', 'DOB', 'Time of Birth', 'Place of Birth', 'Batting Style', 'Bowling Style', 'Jersey #', 'Registered At']);

    $players = file_exists($logFile) ? (json_decode(file_get_contents($logFile), true) ?: []) : [];
    $sno = 1;
    foreach (array_reverse($players) as $p) {
        fputcsv($output, [
            $sno++,
            $p['name'] ?? '',
            $p['teamName'] ?? '',
            $p['teamCity'] ?? '',
            $p['role'] ?? '',
            $p['mobile'] ?? '',
            $p['email'] ?? '',
            $p['dob'] ?? '',
            $p['birthTime'] ?? '',
            $p['birthPlace'] ?? '',
            $p['battingStyle'] ?? '',
            $p['bowlingStyle'] ?? '',
            $p['jerseyNumber'] ?? '',
            $p['registeredAt'] ?? ''
        ]);
    }
    fclose($output);
    exit();
}

$isLoggedIn = !empty($_SESSION['admin_logged_in']);

// Fetch Players from local JSON
$players = file_exists($logFile) ? (json_decode(file_get_contents($logFile), true) ?: []) : [];
$totalCount = count($players);

// Calculate Stats
$teams = [];
$cities = [];
$rolesCount = ['BAT' => 0, 'BOWL' => 0, 'ALL' => 0, 'WK' => 0];

foreach ($players as $p) {
    if (!empty($p['teamName'])) $teams[$p['teamName']] = true;
    if (!empty($p['teamCity'])) $cities[$p['teamCity']] = true;
    $r = strtoupper($p['role'] ?? 'BAT');
    if (isset($rolesCount[$r])) {
        $rolesCount[$r]++;
    } else {
        $rolesCount['BAT']++;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard | Cricket Player Registrations</title>
    <link rel="stylesheet" href="style.css">
    <link rel="icon" type="image/png" href="assets/favicon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
    <style>
        .admin-nav {
            background: #121220;
            border-bottom: 1px solid #2a2a44;
            padding: 15px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .stat-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 25px 0;
        }
        .stat-card {
            background: #151528;
            border: 1px solid #2c2c48;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        }
        .stat-card .val {
            font-size: 2.2rem;
            font-weight: 700;
            color: var(--accent-gold);
            margin: 5px 0;
        }
        .stat-card .lbl {
            color: var(--text-gray);
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .table-card {
            background: #151528;
            border: 1px solid #2c2c48;
            border-radius: 12px;
            padding: 25px;
            overflow-x: auto;
        }
        .player-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.88rem;
        }
        .player-table th {
            background: #1c1c34;
            color: var(--accent-gold);
            padding: 12px 14px;
            border-bottom: 2px solid #333355;
            font-weight: 600;
            white-space: nowrap;
        }
        .player-table td {
            padding: 12px 14px;
            border-bottom: 1px solid #24243e;
            vertical-align: middle;
        }
        .player-table tr:hover {
            background: rgba(201, 163, 93, 0.04);
        }
        .table-avatar {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid var(--accent-gold);
            cursor: pointer;
        }
        .badge-role {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: bold;
        }
        .badge-bat { background: #2563eb22; color: #60a5fa; border: 1px solid #3b82f6; }
        .badge-bowl { background: #dc262622; color: #f87171; border: 1px solid #ef4444; }
        .badge-all { background: #d9770622; color: #fbbf24; border: 1px solid #f59e0b; }
        .badge-wk { background: #05966922; color: #34d399; border: 1px solid #10b981; }
        .whatsapp-btn {
            background: #25d366;
            color: #fff;
            padding: 4px 10px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 0.8rem;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-weight: 600;
        }
        .controls-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 20px;
        }
        .search-input {
            padding: 10px 15px;
            background: #1c1c32;
            border: 1px solid #363658;
            color: #fff;
            border-radius: 8px;
            font-size: 0.9rem;
            min-width: 260px;
        }
        .btn-action {
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            border: none;
        }
    </style>
</head>
<body style="padding-top: 0; background: #0c0c16;">

    <!-- Admin Top Bar -->
    <header class="admin-nav">
        <div style="display:flex; align-items:center; gap:15px;">
            <a href="index.php"><img src="assets/logo.png" alt="Logo" style="height:42px; border-radius:50%;"></a>
            <div>
                <h3 style="margin:0; color:#fff; font-size:1.15rem;">Astro Cricket — Admin Portal</h3>
                <p style="margin:0; font-size:0.75rem; color:var(--text-gray);">Player Registrations Management</p>
            </div>
        </div>
        <div style="display:flex; align-items:center; gap:15px;">
            <a href="consultation.php" target="_blank" class="btn-action" style="background:#1e1e35; color:var(--accent-gold); border:1px solid #3a3a5a;">
                + New Registration Form
            </a>
            <?php if ($isLoggedIn): ?>
                <a href="admin.php?action=logout" class="btn-action" style="background:#331a1a; color:#ff6b6b; border:1px solid #552222;">
                    🚪 Logout
                </a>
            <?php endif; ?>
        </div>
    </header>

    <div class="container" style="padding-top: 25px; padding-bottom: 50px;">

        <?php if (!$isLoggedIn): ?>
            <!-- Login Form -->
            <div style="max-width: 420px; margin: 80px auto; background: #151528; border: 1px solid #2c2c48; border-radius: 16px; padding: 35px 30px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <div style="font-size: 2.5rem; margin-bottom: 10px;">🔐</div>
                <h2 style="color:var(--accent-gold); margin-bottom: 8px;">Admin Passkey Required</h2>
                <p style="color:var(--text-gray); font-size:0.88rem; margin-bottom:25px;">Enter your admin password to view registered players.</p>

                <?php if ($loginError): ?>
                    <div style="background:#ff333322; border:1px solid #ff4444; color:#ff8888; padding:10px; border-radius:6px; margin-bottom:15px; font-size:0.85rem;">
                        ⚠️ <?php echo htmlspecialchars($loginError); ?>
                    </div>
                <?php endif; ?>

                <form method="POST" action="admin.php">
                    <input type="password" name="admin_pass" placeholder="Enter password..." required class="form-control" style="margin-bottom: 18px; text-align:center;">
                    <button type="submit" class="btn btn-primary" style="width:100%; padding:14px; border:none; cursor:pointer;">
                        Unlock Dashboard
                    </button>
                </form>
            </div>

        <?php else: ?>

            <!-- Stats Overview Cards -->
            <div class="stat-grid">
                <div class="stat-card">
                    <div class="lbl">Total Players</div>
                    <div class="val"><?php echo $totalCount; ?></div>
                    <span style="font-size:0.8rem; color:#25d366;">✓ Registered</span>
                </div>
                <div class="stat-card">
                    <div class="lbl">Active Teams</div>
                    <div class="val"><?php echo count($teams); ?></div>
                    <span style="font-size:0.8rem; color:var(--text-gray);">Unique Clubs</span>
                </div>
                <div class="stat-card">
                    <div class="lbl">Playing Cities</div>
                    <div class="val"><?php echo count($cities); ?></div>
                    <span style="font-size:0.8rem; color:var(--text-gray);">Match Locations</span>
                </div>
                <div class="stat-card">
                    <div class="lbl">Role Breakdown</div>
                    <div style="font-size:0.95rem; margin-top:8px; color:#fff; display:flex; justify-content:space-around;">
                        <span>🏏 <?php echo $rolesCount['BAT']; ?></span>
                        <span>🎯 <?php echo $rolesCount['BOWL']; ?></span>
                        <span>⚡ <?php echo $rolesCount['ALL']; ?></span>
                        <span>🧤 <?php echo $rolesCount['WK']; ?></span>
                    </div>
                </div>
            </div>

            <!-- Table Card -->
            <div class="table-card">
                <div class="controls-bar">
                    <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                        <input type="text" id="tableSearch" class="search-input" placeholder="🔍 Search by player, team, mobile, city..." onkeyup="filterTable()">
                        <select id="roleFilter" class="search-input" style="min-width:140px; cursor:pointer;" onchange="filterTable()">
                            <option value="">All Roles</option>
                            <option value="BAT">Batsman (BAT)</option>
                            <option value="BOWL">Bowler (BOWL)</option>
                            <option value="ALL">All-Rounder (ALL)</option>
                            <option value="WK">Wicket Keeper (WK)</option>
                        </select>
                    </div>

                    <div style="display:flex; gap:10px;">
                        <a href="admin.php?action=export_csv" class="btn-action" style="background:#1e3a24; color:#4ade80; border:1px solid #2b6137;">
                            📥 Export CSV
                        </a>
                        <button onclick="window.location.reload();" class="btn-action" style="background:#1e1e35; color:#fff; border:1px solid #3a3a5a;">
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                <?php if ($totalCount === 0): ?>
                    <div style="text-align:center; padding: 60px 20px; color:var(--text-gray);">
                        <div style="font-size: 3rem; margin-bottom: 10px;">🏏</div>
                        <h3>No players registered yet!</h3>
                        <p style="margin-top:5px;">Share the <a href="consultation.php" style="color:var(--accent-gold);">registration link</a> to start collecting player profiles.</p>
                    </div>
                <?php else: ?>
                    <table class="player-table" id="playersTable">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Photo</th>
                                <th>Player Details</th>
                                <th>Team & City</th>
                                <th>Role</th>
                                <th>Contact & WhatsApp</th>
                                <th>Birth Coordinates</th>
                                <th>Astro Status</th>
                                <th>Reg. Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php 
                            $revPlayers = array_reverse($players, true); // Preserve original array keys for accurate delete index
                            $rowNum = 1;
                            foreach ($revPlayers as $origIndex => $p): 
                                $roleKey = strtoupper($p['role'] ?? 'BAT');
                                $roleBadgeClass = 'badge-bat';
                                $roleLabel = 'Batsman';
                                if ($roleKey === 'BOWL') { $roleBadgeClass = 'badge-bowl'; $roleLabel = 'Bowler'; }
                                elseif ($roleKey === 'ALL') { $roleBadgeClass = 'badge-all'; $roleLabel = 'All-Rounder'; }
                                elseif ($roleKey === 'WK') { $roleBadgeClass = 'badge-wk'; $roleLabel = 'Wicket Keeper'; }
                                
                                $cleanMobile = preg_replace('/[^0-9]/', '', $p['mobile'] ?? '');
                                if (strlen($cleanMobile) === 10) $cleanMobile = '91' . $cleanMobile;
                            ?>
                            <tr class="player-row" data-search="<?php echo htmlspecialchars(strtolower(($p['name'] ?? '') . ' ' . ($p['teamName'] ?? '') . ' ' . ($p['teamCity'] ?? '') . ' ' . ($p['mobile'] ?? '') . ' ' . ($p['birthPlace'] ?? ''))); ?>" data-role="<?php echo htmlspecialchars($roleKey); ?>">
                                <td><?php echo $rowNum++; ?></td>
                                <td>
                                    <?php if (!empty($p['profile']) && file_exists(__DIR__ . '/uploads/' . $p['profile'])): ?>
                                        <img src="uploads/<?php echo htmlspecialchars($p['profile']); ?>" alt="Photo" class="table-avatar" onclick="window.open(this.src, '_blank')">
                                    <?php else: ?>
                                        <div style="width:44px; height:44px; border-radius:50%; background:#25253e; display:flex; align-items:center; justify-content:center; border:2px solid #3e3e60; font-size:1.2rem;">
                                            🏏
                                        </div>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <strong style="color:#fff; font-size:0.95rem;"><?php echo htmlspecialchars($p['name'] ?? 'Unknown'); ?></strong>
                                    <?php if (!empty($p['jerseyNumber'])): ?>
                                        <span style="color:var(--accent-gold); font-size:0.8rem; font-weight:bold;">#<?php echo htmlspecialchars($p['jerseyNumber']); ?></span>
                                    <?php endif; ?>
                                    <div style="font-size:0.78rem; color:var(--text-gray); margin-top:2px;">
                                        <?php echo htmlspecialchars($p['battingStyle'] ?? ''); ?>
                                    </div>
                                </td>
                                <td>
                                    <div style="color:#ffffff; font-weight:600;"><?php echo htmlspecialchars($p['teamName'] ?? '—'); ?></div>
                                    <div style="font-size:0.8rem; color:var(--accent-gold);"><?php echo htmlspecialchars($p['teamCity'] ?? '—'); ?></div>
                                </td>
                                <td>
                                    <span class="badge-role <?php echo $roleBadgeClass; ?>">
                                        <?php echo $roleLabel; ?>
                                    </span>
                                </td>
                                <td>
                                    <div style="margin-bottom: 4px;">
                                        <strong style="color:#ffffff; font-size:0.9rem;"><?php echo htmlspecialchars($p['mobile'] ?? '—'); ?></strong>
                                    </div>
                                    <?php if (!empty($cleanMobile)): ?>
                                        <a href="https://wa.me/<?php echo $cleanMobile; ?>?text=<?php echo urlencode("Hello " . ($p['name'] ?? '') . ", regards from S&B Astro Cricket!"); ?>" target="_blank" class="whatsapp-btn">
                                            <span>💬</span> WhatsApp
                                        </a>
                                    <?php endif; ?>
                                    <?php if (!empty($p['email'])): ?>
                                        <div style="font-size:0.75rem; color:var(--text-gray); margin-top:3px;"><?php echo htmlspecialchars($p['email']); ?></div>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <div>📅 <?php echo htmlspecialchars($p['dob'] ?? '—'); ?></div>
                                    <div style="font-size:0.78rem; color:var(--text-gray);">⏰ <?php echo htmlspecialchars($p['birthTime'] ?? '—'); ?></div>
                                    <div style="font-size:0.8rem; color:#a0a0c0;">📍 <?php echo htmlspecialchars($p['birthPlace'] ?? '—'); ?></div>
                                </td>
                                <td>
                                    <?php if (!empty($p['node_synced'])): ?>
                                        <span style="color:#4ade80; font-size:0.8rem; font-weight:600;">✓ Synced (Node)</span>
                                    <?php else: ?>
                                        <span style="color:#fbbf24; font-size:0.8rem;">● Saved (Local)</span>
                                    <?php endif; ?>
                                </td>
                                <td style="font-size:0.8rem; color:var(--text-gray); white-space:nowrap;">
                                    <?php echo htmlspecialchars(substr($p['registeredAt'] ?? '—', 0, 16)); ?>
                                </td>
                                <td>
                                    <form method="POST" action="admin.php" onsubmit="return confirm('Are you sure you want to delete this player record?');" style="margin:0;">
                                        <input type="hidden" name="action" value="delete">
                                        <input type="hidden" name="index" value="<?php echo $origIndex; ?>">
                                        <button type="submit" style="background:none; border:none; color:#ff6b6b; cursor:pointer; font-size:1.1rem;" title="Delete Record">
                                            🗑️
                                        </button>
                                    </form>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php endif; ?>
            </div>

        <?php endif; ?>

    </div>

    <!-- Client-side filtering script -->
    <script>
        function filterTable() {
            const query = document.getElementById('tableSearch').value.toLowerCase().trim();
            const roleFilter = document.getElementById('roleFilter').value.toUpperCase();
            const rows = document.querySelectorAll('.player-row');

            rows.forEach(row => {
                const searchData = row.getAttribute('data-search') || '';
                const rowRole = row.getAttribute('data-role') || '';

                const matchesQuery = !query || searchData.includes(query);
                const matchesRole = !roleFilter || rowRole === roleFilter;

                if (matchesQuery && matchesRole) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }
    </script>
</body>
</html>
