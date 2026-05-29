import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getActiveElection } from '@/app/actions/screening-actions';
import { prisma } from '@/lib/prisma';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ScreeningConfiguration from '@/components/admin/screening/ScreeningConfiguration';
import ScreeningSheet from '@/components/admin/screening/ScreeningSheet';
import ScreeningResults from '@/components/admin/screening/ScreeningResults';

export const metadata = {
  title: 'Screening | Admin Dashboard',
};

export default async function ScreeningPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/admin/login');

  const election = await prisma.election.findFirst({
    where: { isActive: true },
    include: {
      screeningCriteria: {
        orderBy: { createdAt: 'asc' }
      },
      screeningSetting: true,
      candidates: {
        where: {
          NOT: {
            name: { contains: 'undecided', mode: 'insensitive' }
          }
        },
        include: {
          position: true,
          screeningScores: true
        }
      }
    }
  });

  if (!election) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Screening</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-10">
              <p>There is currently no active election available.</p>
              <p>Screening can only be set up and conducted for an actively running election.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSuperadmin = session.user.role === 'SUPERADMIN';

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Screening Management</h2>
      </div>

      <p className="text-muted-foreground">
        Active Election: <span className="font-semibold">{election.title}</span>
      </p>

      {isSuperadmin ? (
        <Tabs defaultValue="sheet" className="w-full">
          <TabsList className="mb-4 h-auto w-full flex-wrap justify-start gap-1 sm:w-auto sm:justify-center">
            <TabsTrigger value="sheet">Score Candidates</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="results">Results & Export</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sheet">
            <ScreeningSheet election={election} adminId={session.user.id} />
          </TabsContent>
          <TabsContent value="config">
            <ScreeningConfiguration election={election} />
          </TabsContent>
          <TabsContent value="results">
            <ScreeningResults election={election} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="mt-6">
          <CardHeader className="px-0">
            <CardTitle>Score Candidates</CardTitle>
            <CardDescription>Evaluate candidates based on the configured criteria.</CardDescription>
          </CardHeader>
          <ScreeningSheet election={election} adminId={session.user.id} />
        </div>
      )}
    </div>
  );
}
