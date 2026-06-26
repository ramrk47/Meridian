<?php
/* Copy this file to  config.php  and edit the values.
   config.php is git-ignored and blocked from web access by .htaccess. */
return [
  // Set a long random string. The dashboard must send this as X-Edit-Token
  // to save. Leave '' to allow anyone to save (NOT recommended on a public URL).
  'edit_token' => 'CHANGE-ME-to-a-long-random-secret',

  // Restrict who can call the API from the browser. Use your exact origin,
  // e.g. 'https://tracker.notalonestudios.com'. '*' allows any origin.
  'allow_origin' => '*',
];
