<?php
/* CSRF: the token is bound to the server session row (sessions.csrf_token) and
   must be presented in the X-CSRF-Token header on every state-changing POST.
   Constant-time compare. */

declare(strict_types=1);

function csrf_new_token(): string {
  return bin2hex(random_bytes(32));            // 64 hex chars
}

/** Verify the header token against the session's stored csrf_token. */
function csrf_check(array $session): bool {
  $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
  $expected = $session['csrf_token'] ?? '';
  if ($sent === '' || $expected === '') return false;
  return hash_equals($expected, $sent);
}
