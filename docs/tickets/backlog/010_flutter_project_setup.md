# 010 Flutter Project Setup

## Goal

Initialize a Flutter project inside the monorepo alongside the Next.js app. Configure Supabase credentials and establish the base project structure.

## Tasks

- Create `flutter/` directory at repo root
- Initialize Flutter app with `flutter create`
- Add `supabase_flutter` dependency
- Configure Supabase URL + anon key (via `.env` or `--dart-define`)
- Set up folder structure: `lib/features/`, `lib/core/`, `lib/shared/`
- Add Android minimum SDK version requirements
- Configure deep link scheme for Supabase auth callbacks
- Add `flutter/` to `.gitignore` exclusions (build artifacts)
- Update root README with Flutter setup instructions

## Acceptance Criteria

- `flutter run` launches the app on an Android emulator/device
- App can reach Supabase (ping test or version check)
- Deep link scheme registered for auth

## Dependencies

None (first Flutter ticket)
