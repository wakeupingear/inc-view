<?php
$USERNAME=$_GET['username'];
$handle = fopen("participants.txt", "r");
if ($handle) {
    while (($line = fgets($handle)) !== false) {
        if ($USERNAME==strtolower(preg_replace('/\s*/', '',trim($line)))){
            echo "participant:"+trim($line);
            exit();
        }
    }
    fclose($handle);
}
$handle = fopen("coaches.txt", "r");
if ($handle) {
    while (($line = fgets($handle)) !== false) {
        if ($USERNAME==strtolower(preg_replace('/\s*/', '',trim($line)))){
            echo "coach:"+trim($line);
            exit();
        }
    }
    fclose($handle);
}
echo "unknown";
?>