<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = urlencode($_POST['name']);
    $dob = urlencode($_POST['dob']);
    $tob = urlencode($_POST['tob']);
    $pob = urlencode($_POST['pob']);

    // Actual WhatsApp number for Santhosh Kumar
    $whatsapp_number = "919488818867"; 
    
    $message = "Hello Santhosh, I have a question for ₹99. Here are my details:%0A%0A" .
               "Name: $name%0A" .
               "DOB: $dob%0A" .
               "Time: $tob%0A" .
               "Place: $pob";

    $whatsapp_url = "https://wa.me/$whatsapp_number?text=$message";

    header("Location: $whatsapp_url");
    exit();
} else {
    header("Location: index.php");
    exit();
}
?>
