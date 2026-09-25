<?php
session_start();
require_once 'config.php';

$formError = $_SESSION['form_error'] ?? null;
unset($_SESSION['form_error']);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cricket Player Registration | Astro Cricket</title>
    <meta name="description" content="Register cricket player details and birth coordinates for precision KP Astrology match and performance analysis.">
    <link rel="stylesheet" href="style.css">
    <link rel="icon" type="image/png" href="assets/favicon.png">
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
</head>
<body>

    <!-- Navigation Bar -->
    <nav>
        <div class="container">
            <div class="logo"><a href="index.php"><img src="assets/logo.png" alt="Astro Cricket Logo"></a></div>
            <div class="nav-links">
                <a href="index.php">HOME</a>
                <a href="about.php">ABOUT</a>
                <a href="consultation.php" style="color:var(--accent-gold);">PLAYER REGISTRATION</a>
                <a href="index.php#contact">CONTACT</a>
            </div>
        </div>
    </nav>

    <!-- Registration Section -->
    <section style="padding: 40px 0 80px 0;">
        <div class="container">
            
            <div class="form-card">
                <div class="form-header">
                    <h1>🏏 Cricket Player Registration</h1>
                    <p>Enter player birth information and cricket details for Astro-KP Chart profiling & performance analysis.</p>
                </div>

                <?php if ($formError): ?>
                    <div style="background:#ff333322; border:1px solid #ff4444; color:#ff8888; padding:12px 15px; border-radius:8px; margin-bottom:20px; text-align:center; font-size:0.9rem;">
                        ⚠️ <?php echo htmlspecialchars($formError); ?>
                    </div>
                <?php endif; ?>

                <form action="process_player.php" method="POST" enctype="multipart/form-data" id="playerForm">
                    
                    <!-- Section 1: Photo & Player Identity -->
                    <div class="form-section-title">
                        <span>📸</span> Player Photo & Basic Info
                    </div>

                    <!-- Photo Upload with Live Preview -->
                    <div class="form-group">
                        <label>Player Photo <span class="req">*</span></label>
                        <div class="photo-upload-wrapper" onclick="document.getElementById('photoInput').click();">
                            <div class="photo-preview" id="photoPreview">
                                <span id="photoIcon">👤</span>
                                <img id="previewImg" src="" alt="Preview">
                            </div>
                            <div class="photo-upload-info">
                                <h4 id="uploadTitle">Upload Player Picture</h4>
                                <p id="uploadSub">Click to browse or drag & drop (JPG, PNG, WebP — Max 5MB)</p>
                            </div>
                            <input type="file" id="photoInput" name="photo" accept="image/*" style="display:none;" onchange="handleImagePreview(event)" required>
                        </div>
                    </div>

                    <div class="form-grid-2">
                        <div class="form-group">
                            <label for="name">Player Full Name <span class="req">*</span></label>
                            <input type="text" id="name" name="name" class="form-control" placeholder="e.g. Virat Kohli" required>
                        </div>

                        <div class="form-group">
                            <label for="mobile">WhatsApp / Mobile Number <span class="req">*</span></label>
                            <input type="tel" id="mobile" name="mobile" class="form-control" placeholder="e.g. 9876543210" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="email">Email Address <span style="color:var(--text-gray); font-size:0.75rem;">(Optional)</span></label>
                        <input type="email" id="email" name="email" class="form-control" placeholder="e.g. player@gmail.com">
                    </div>

                    <!-- Section 2: Birth Details (Crucial for KP Astrology) -->
                    <div class="form-section-title">
                        <span>⭐</span> Birth Coordinates (For Astrological Calculation)
                    </div>

                    <div class="form-grid-3">
                        <div class="form-group">
                            <label for="dob">Date of Birth <span class="req">*</span></label>
                            <input type="date" id="dob" name="dob" class="form-control" required>
                        </div>

                        <div class="form-group">
                            <label for="tob">Time of Birth <span class="req">*</span></label>
                            <input type="time" id="tob" name="tob" class="form-control" required>
                        </div>

                        <div class="form-group">
                            <label for="pob">Place of Birth (City/Town) <span class="req">*</span></label>
                            <input type="text" id="pob" name="pob" class="form-control" placeholder="e.g. Chennai, Podanur" required>
                        </div>
                    </div>
                    <p style="font-size:0.8rem; color:var(--text-gray); margin-top:-8px; margin-bottom:15px;">
                        ℹ️ Exact birth time & place are essential for precise Lagna (Ascendant) & Sub-lord calculation.
                    </p>

                    <!-- Section 3: Cricket & Team Information -->
                    <div class="form-section-title">
                        <span>🏆</span> Team & Playing Details
                    </div>

                    <div class="form-grid-2">
                        <div class="form-group">
                            <label for="teamName">Team Name <span class="req">*</span></label>
                            <input type="text" id="teamName" name="teamName" class="form-control" placeholder="e.g. Chennai Super Kings / Royal XI" required>
                        </div>

                        <div class="form-group">
                            <label for="teamCity">Team City / Playing City <span class="req">*</span></label>
                            <input type="text" id="teamCity" name="teamCity" class="form-control" placeholder="e.g. Coimbatore, Madurai" required>
                        </div>
                    </div>

                    <!-- Player Primary Role -->
                    <div class="form-group">
                        <label>Primary Playing Role <span class="req">*</span></label>
                        <div class="role-options">
                            <label class="role-radio-label selected" onclick="selectRole('BAT', this)">
                                <input type="radio" name="role" value="BAT" checked>
                                <span class="role-icon">🏏</span>
                                <span class="role-text">Batsman</span>
                            </label>

                            <label class="role-radio-label" onclick="selectRole('BOWL', this)">
                                <input type="radio" name="role" value="BOWL">
                                <span class="role-icon">🎯</span>
                                <span class="role-text">Bowler</span>
                            </label>

                            <label class="role-radio-label" onclick="selectRole('ALL', this)">
                                <input type="radio" name="role" value="ALL">
                                <span class="role-icon">⚡</span>
                                <span class="role-text">All-Rounder</span>
                            </label>

                            <label class="role-radio-label" onclick="selectRole('WK', this)">
                                <input type="radio" name="role" value="WK">
                                <span class="role-icon">🧤</span>
                                <span class="role-text">Wicket Keeper</span>
                            </label>
                        </div>
                    </div>

                    <div class="form-grid-3">
                        <div class="form-group">
                            <label for="battingStyle">Batting Hand</label>
                            <select id="battingStyle" name="battingStyle" class="form-control">
                                <option value="Right Hand Bat">Right Hand Bat (RHB)</option>
                                <option value="Left Hand Bat">Left Hand Bat (LHB)</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="bowlingStyle">Bowling Style</label>
                            <select id="bowlingStyle" name="bowlingStyle" class="form-control">
                                <option value="Right Arm Fast">Right Arm Fast</option>
                                <option value="Right Arm Medium">Right Arm Medium</option>
                                <option value="Right Arm Spin (Off-Break)">Right Arm Off-Spin</option>
                                <option value="Right Arm Spin (Leg-Break)">Right Arm Leg-Spin</option>
                                <option value="Left Arm Fast">Left Arm Fast</option>
                                <option value="Left Arm Spin">Left Arm Spin</option>
                                <option value="None">None / Non-Bowler</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="jerseyNumber">Jersey # <span style="color:var(--text-gray); font-size:0.75rem;">(Numerology)</span></label>
                            <input type="number" id="jerseyNumber" name="jerseyNumber" class="form-control" placeholder="e.g. 7, 18, 99" min="1" max="999">
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <div style="margin-top: 30px; text-align: center;">
                        <button type="submit" class="btn btn-primary" style="width: 100%; font-size: 1.1rem; padding: 16px; border: none; cursor: pointer; border-radius: 8px;">
                            ✓ Register & Generate Astro Profile
                        </button>
                    </div>

                </form>
            </div>

        </div>
    </section>

    <!-- Footer -->
    <footer style="padding:40px 0; text-align:center; color:var(--text-gray); border-top:1px solid #2a2a40;">
        <p><strong>SRI DHARMASASTHA JOTHIDA NILAYAM & ASTRO CRICKET</strong></p>
        <p style="font-size:0.9rem; margin:10px 0;">Data-Driven Astrological Cricket Analytics</p>
        <p style="font-size:0.8rem; margin:5px 0;">15-A Moorandamman Kovil Street, Podanur, Coimbatore - 641023</p>
        <p style="margin-top:20px;">
            <a href="terms.php" style="color:var(--accent-gold); text-decoration:none; margin:0 10px;">Terms & Conditions</a> | 
            <a href="privacy.php" style="color:var(--accent-gold); text-decoration:none; margin:0 10px;">Privacy Policy</a> |
            <a href="refund.php" style="color:var(--accent-gold); text-decoration:none; margin:0 10px;">Refund Policy</a> |
            <a href="admin.php" style="color:#6c6c8a; text-decoration:none; margin:0 10px;">Admin Portal</a>
        </p>
        <p style="margin-top:20px; font-size:0.85rem;">&copy; <?php echo date('Y'); ?> Astro Cricket. All Rights Reserved.</p>
    </footer>

    <!-- JavaScript for Live Photo Preview and Role Selection -->
    <script>
        function handleImagePreview(event) {
            const file = event.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    alert("Please upload an image smaller than 5MB.");
                    event.target.value = "";
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewImg = document.getElementById('previewImg');
                    const photoIcon = document.getElementById('photoIcon');
                    const uploadTitle = document.getElementById('uploadTitle');
                    const uploadSub = document.getElementById('uploadSub');

                    previewImg.src = e.target.result;
                    previewImg.style.display = 'block';
                    photoIcon.style.display = 'none';
                    uploadTitle.innerText = file.name;
                    uploadTitle.style.color = '#c9a35d';
                    uploadSub.innerText = (file.size / 1024).toFixed(1) + ' KB (Click to change photo)';
                };
                reader.readAsDataURL(file);
            }
        }

        function selectRole(roleVal, labelElement) {
            document.querySelectorAll('.role-radio-label').forEach(el => el.classList.remove('selected'));
            labelElement.classList.add('selected');
            const radio = labelElement.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
            }
        }
    </script>
</body>
</html>
