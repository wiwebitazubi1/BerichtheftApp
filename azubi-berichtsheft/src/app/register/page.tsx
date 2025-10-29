import RegisterForm from '@/app/components/RegisterForm';

/**
 * Registration page.  Presents a form for users to create a new account.  The
 * page itself is server-rendered, while the form manages state on the client.
 */
export default function RegisterPage() {
  return (
    <main className="flex items-center justify-center h-screen">
      <div className="w-full max-w-md p-6 rounded-md shadow-lg bg-card">
        <h1 className="mb-4 text-xl font-semibold text-center">Registrierung</h1>
        <RegisterForm />
      </div>
    </main>
  );
}