<?php
$USERNAME=$_GET['username'];
$handle = fopen("participants.txt", "r");
if ($handle) {
    while (($line = fgets($handle)) !== false) {
        if ($USERNAME==trim($line)){
            echo "participant";
            exit();
        }
    }
    fclose($handle);
}
$handle = fopen("coaches.txt", "r");
if ($handle) {
    while (($line = fgets($handle)) !== false) {
        if ($USERNAME==trim($line)){
            echo "coach";
            exit();
        }
    }
    fclose($handle);
}
echo "unknown";
?>