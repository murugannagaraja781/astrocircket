<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consultation | S&B Astro - Choose Your Plan</title>
    <link rel="stylesheet" href="style.css">
    <link rel="icon" type="image/png" href="assets/favicon.png">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
</head>
<body>

    <!-- Navigation Bar -->
    <nav>
        <div class="container">
            <div class="logo"><img src="assets/logo.png" alt="S&B Astro Logo"></div>
            <div class="nav-links">
                <a href="index.php">HOME</a>
                <a href="about.php">ABOUT</a>
                <a href="index.php#services">SERVICES</a>
                <a href="index.php#pricing">PRICING</a>
                <a href="index.php#contact">CONTACT</a>
            </div>
        </div>
    </nav>

    <!-- Pricing Section -->
    <section class="pricing" id="pricing">
        <div class="container">
            <h1 style="text-align:center; margin-bottom:20px;">Book Your Success Blueprint</h1>
            <p style="text-align:center; color:var(--text-gray); margin-bottom:60px;">Select the consultation tier that matches your goals.</p>
            
            <div class="pricing-grid">
                <!-- Basic -->
                <div class="price-card">
                    <h3>Quick Entry</h3>
                    <div class="price-amount">₹999</div>
                    <ul style="list-style:none; padding:0; margin:20px 0; color:var(--text-gray);">
                        <li>15 Min Consultation</li>
                        <li>Single Focused Question</li>
                        <li>KP Chart Analysis</li>
                    </ul>
                    <a href="#contact" onclick="selectPlan('999')" class="btn btn-primary" style="width:100%;">Select Plan</a>
                </div>

                <!-- Numerology -->
                <div class="price-card">
                    <h3>Personal Numerology</h3>
                    <div class="price-amount">₹1499</div>
                    <ul style="list-style:none; padding:0; margin:20px 0; color:var(--text-gray);">
                        <li>Full Name Analysis</li>
                        <li>Destiny & Soul Number</li>
                        <li>Lucky Dates & Colors</li>
                        <li>Name Correction Advice</li>
                    </ul>
                    <a href="#contact" onclick="selectPlan('1499')" class="btn btn-primary" style="width:100%;">Select Plan</a>
                </div>

                <!-- Core -->
                <div class="price-card featured">
                    <div style="background:var(--accent-gold); color:black; padding:5px; border-radius:4px; margin-bottom:10px; font-size:0.8rem; font-weight:bold;">MOST POPULAR</div>
                    <h3>Full Success Blueprint</h3>
                    <div class="price-amount">₹2499</div>
                    <ul style="list-style:none; padding:0; margin:20px 0; color:var(--text-gray);">
                        <li>45 Min Consultation</li>
                        <li>Marriage, Career & Finance</li>
                        <li>Detailed Success Timeline</li>
                        <li>Remedial Solutions</li>
                    </ul>
                    <a href="#contact" onclick="selectPlan('2499')" class="btn btn-primary" style="width:100%;">Select Plan</a>
                </div>

                <!-- Premium -->
                <div class="price-card">
                    <h3>Premium Growth</h3>
                    <div class="price-amount">₹4999</div>
                    <ul style="list-style:none; padding:0; margin:20px 0; color:var(--text-gray);">
                        <li>Deep Annual Planning</li>
                        <li>Business & High-Value Decisions</li>
                        <li>Direct Access (Urgent)</li>
                    </ul>
                    <a href="#contact" onclick="selectPlan('4999')" class="btn btn-primary" style="width:100%;">Select Plan</a>
                </div>
            </div>
        </div>
    </section>

    <!-- Form Section -->
    <section id="contact" style="background:var(--secondary-bg);">
        <div class="container">
            <div style="max-width:600px; margin:0 auto; text-align:center;">
                <h2>Confirm Your Birth Details</h2>
                <p style="margin-bottom:30px;">Required for accurate KP Astrology chart calculation.</p>
                <form action="payment_init.php" method="POST" style="display:grid; gap:15px; text-align:left;">
                    <input type="hidden" name="plan_id" id="selected-plan" value="999">
                    <input type="text" name="name" placeholder="Full Name" required style="padding:15px; background:#2a2a40; border:none; color:white; border-radius:4px;">
                    <input type="date" name="dob" placeholder="Date of Birth" required style="padding:15px; background:#2a2a40; border:none; color:white; border-radius:4px;">
                    <input type="time" name="tob" placeholder="Time of Birth" required style="padding:15px; background:#2a2a40; border:none; color:white; border-radius:4px;">
                    <input type="text" name="pob" placeholder="Place of Birth" required style="padding:15px; background:#2a2a40; border:none; color:white; border-radius:4px;">
                    <button type="submit" class="btn btn-primary" id="submit-btn" style="background:var(--accent-gold); color:black;">Pay & Secure Slot — ₹999</button>
                </form>
            </div>
        </div>
    </section>

    <footer style="padding:40px 0; text-align:center; color:var(--text-gray); border-top:1px solid #2a2a40; margin-bottom:80px;">
        <p><strong>SRI DHARMASASTHA JOTHIDA NILAYAM</strong></p>
        <p style="font-size:0.9rem; margin:10px 0;">Proprietor: N SANTHOSH KUMAR</p>
        <p style="font-size:0.8rem; margin:5px 0;">15-A Moorandamman Kovil Street, Podanur, Coimbatore - 641023</p>
        <p style="margin-top:20px;">
            <a href="terms.php" style="color:var(--accent-gold); text-decoration:none; margin:0 10px;">Terms & Conditions</a> | 
            <a href="privacy.php" style="color:var(--accent-gold); text-decoration:none; margin:0 10px;">Privacy Policy</a> |
            <a href="refund.php" style="color:var(--accent-gold); text-decoration:none; margin:0 10px;">Refund Policy</a>
        </p>
        <p style="margin-top:20px;">&copy; 2026 S&B Astro. All Rights Reserved.</p>
    </footer>

    <!-- Lead Funnel Bar -->
    <div class="lead-bar">
        <div class="container">
            <strong>Unsure?</strong> Get clarity now. <a href="#contact" onclick="selectPlan('99')" class="btn btn-dark" style="text-decoration:none;">Pay ₹99 & Ask Your Question</a>
        </div>
    </div>

    <script>
        function selectPlan(planId) {
            const planPrices = {
                '99': '₹99',
                '999': '₹999',
                '1499': '₹1499',
                '2499': '₹2499',
                '4999': '₹4999'
            };
            document.getElementById('selected-plan').value = planId;
            document.getElementById('submit-btn').innerText = 'Pay & Secure Slot — ' + planPrices[planId];
        }
    </script>
</body>
</html>
