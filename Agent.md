# Agent instructions

This repository uses environment variables with the `VITE_` prefix for frontend configuration.
Ensure `.env.example` files only contain variables prefixed with `VITE_` such as `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL`.

Older variable names like `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` should be renamed accordingly if encountered.
