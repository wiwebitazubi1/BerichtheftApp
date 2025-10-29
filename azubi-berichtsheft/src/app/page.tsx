import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';

/**
 * The landing page.  Users accessing the root of the site are redirected
 * depending on whether they are authenticated.  Authenticated users are
 * taken straight to their calendar, while unauthenticated visitors are sent
 * to the login page.
 */
export default function Home() {
  const cookie = cookies().get('authToken');
  if (cookie) {
    const payload = verifyToken(cookie.value);
    if (payload) {
      redirect('/calendar');
    }
  }
  redirect('/login');
}