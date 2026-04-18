import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import FormResponsesTable from '@/components/admin/form-responses/FormResponsesTable';

export const metadata = {
  title: 'Form Responses | Admin Dashboard',
};

export default async function FormResponsesPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/admin/login');

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Form Responses</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Candidate registration submissions from the public form.
        </p>
      </div>
      <FormResponsesTable />
    </div>
  );
}
