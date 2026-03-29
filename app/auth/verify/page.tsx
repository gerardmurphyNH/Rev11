import { redirect } from 'next/navigation'

// Verification page removed — auth is now email-only, no code needed.
export default function VerifyPage() {
  redirect('/auth/register')
}
