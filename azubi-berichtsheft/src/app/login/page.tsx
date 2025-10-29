import LoginForm from '@/app/components/LoginForm';

/**
 * Login page.  Presents the login form centered on the page.  The
 * page itself is a server component, but the form is a client component
 * because it maintains internal state and performs a fetch.
 */
export default function LoginPage() {
  return (
    <main className="flex items-center justify-center h-screen">
      <div className="w-full max-w-md p-6 rounded-md shadow-lg bg-card">
        <h1 className="mb-4 text-xl font-semibold text-center">Anmeldung</h1>
        <LoginForm />
      </div>
    </main>
  );
}