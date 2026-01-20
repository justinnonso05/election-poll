import type { Election, Candidate, Position, Vote, Voter } from '@prisma/client';

type ElectionWithData = Election & {
  association: { name: string };
  candidates: (Candidate & {
    position: Position;
    _count: { votes: number };
  })[];
  votes: (Vote & {
    voter: Voter;
    candidate: Candidate & { position: Position };
  })[];
};

/**
 * Generate CSV for election results
 */
export function generateResultsCSV(election: ElectionWithData): string {
  const rows: string[][] = [];

  // Header
  rows.push(['Election Results Report']);
  rows.push(['Election:', election.title]);
  rows.push(['Association:', election.association.name]);
  rows.push(['Start Date:', new Date(election.startAt).toLocaleString()]);
  rows.push(['End Date:', new Date(election.endAt).toLocaleString()]);
  rows.push(['Total Votes:', election.votes.length.toString()]);
  rows.push([]);

  // Group candidates by position
  const positionMap = new Map<string, typeof election.candidates>();
  election.candidates.forEach(candidate => {
    const positionId = candidate.position.id;
    if (!positionMap.has(positionId)) {
      positionMap.set(positionId, []);
    }
    positionMap.get(positionId)!.push(candidate);
  });

  // Results by position
  rows.push(['Position', 'Candidate', 'Votes', 'Percentage']);

  Array.from(positionMap.entries())
    .sort(([, a], [, b]) => a[0].position.order - b[0].position.order)
    .forEach(([, candidates]) => {
      const position = candidates[0].position;
      const totalVotes = candidates.reduce((sum, c) => sum + c._count.votes, 0);

      // Sort candidates by votes (descending)
      const sortedCandidates = [...candidates].sort((a, b) => b._count.votes - a._count.votes);

      sortedCandidates.forEach((candidate, index) => {
        const percentage = totalVotes > 0
          ? ((candidate._count.votes / totalVotes) * 100).toFixed(2)
          : '0.00';

        rows.push([
          index === 0 ? position.name : '',
          candidate.name,
          candidate._count.votes.toString(),
          `${percentage}%`,
        ]);
      });

      rows.push([]); // Empty row between positions
    });

  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

/**
 * Generate CSV for voters list
 */
export function generateVotersCSV(voters: Voter[]): string {
  const rows: string[][] = [];

  // Header
  rows.push(['Voter List Report']);
  rows.push(['Total Voters:', voters.length.toString()]);
  rows.push(['Generated:', new Date().toLocaleString()]);
  rows.push([]);

  // Column headers
  rows.push(['Email', 'Student ID', 'First Name', 'Last Name', 'Level', 'Has Voted', 'Created At']);

  // Data rows
  voters.forEach(voter => {
    rows.push([
      voter.email,
      voter.studentId,
      voter.first_name,
      voter.last_name,
      voter.level,
      voter.hasVoted ? 'Yes' : 'No',
      new Date(voter.createdAt).toLocaleString(),
    ]);
  });

  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

/**
 * Generate CSV for candidates
 */
export function generateCandidatesCSV(election: ElectionWithData): string {
  const rows: string[][] = [];

  // Header
  rows.push(['Candidates Report']);
  rows.push(['Election:', election.title]);
  rows.push(['Association:', election.association.name]);
  rows.push(['Total Candidates:', election.candidates.length.toString()]);
  rows.push([]);

  // Column headers
  rows.push(['Position', 'Candidate Name', 'Photo URL', 'Manifesto URL', 'Created At']);

  // Group by position and sort
  const positionMap = new Map<string, typeof election.candidates>();
  election.candidates.forEach(candidate => {
    const positionId = candidate.position.id;
    if (!positionMap.has(positionId)) {
      positionMap.set(positionId, []);
    }
    positionMap.get(positionId)!.push(candidate);
  });

  // Data rows
  Array.from(positionMap.entries())
    .sort(([, a], [, b]) => a[0].position.order - b[0].position.order)
    .forEach(([, candidates]) => {
      const position = candidates[0].position;

      candidates.forEach((candidate, index) => {
        rows.push([
          index === 0 ? position.name : '',
          candidate.name,
          candidate.photoUrl || 'N/A',
          candidate.manifesto || 'N/A',
          new Date(candidate.createdAt).toLocaleString(),
        ]);
      });

      rows.push([]); // Empty row between positions
    });

  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}
