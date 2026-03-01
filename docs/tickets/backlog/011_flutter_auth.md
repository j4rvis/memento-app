# 011 Flutter Auth

## Goal

Implement Supabase authentication in the Flutter app: login, signup, session persistence, and deep link handling for magic links / OAuth callbacks.

## Tasks

- Login screen: email + password fields, submit button, error display
- Signup screen: email + password + confirm password
- Auth state listener: redirect to home when session exists, redirect to login on sign-out
- Persist session across app restarts (handled automatically by `supabase_flutter`)
- Handle deep link callbacks for magic link / OAuth (configure `app_links` or `uni_links`)
- Sign-out button in settings/account area
- Loading state during auth operations

## Acceptance Criteria

- User can log in with existing Supabase credentials
- Session persists after app restart
- Unauthenticated users see the login screen
- Sign-out clears session and returns to login

## Dependencies

- Ticket 010 (Flutter project setup)
