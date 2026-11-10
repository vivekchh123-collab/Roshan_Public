import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { getEmployee } from '@/lib/auth';
import CustomerForm from '@/components/CustomerForm';

export const dynamic = 'force-dynamic';

export default async function CustomerPage() {
  const user = await currentUser();
  if (!user) redirect('/sign-in');
  const emp = await getEmployee();
  if (!emp) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold">Access not allowed</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          This area is only for employees approved by the owner. Ask the owner to add your email, then log in again.
        </p>
        <Link href="/" className="btn mt-5">Back to Home</Link>
      </div>
    );
  }
  return <CustomerForm employeeName={emp.displayName} />;
}
