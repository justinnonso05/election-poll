'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Save } from 'lucide-react';
import { addCriteria, removeCriteria, setQualificationScore } from '@/app/actions/screening-actions';
import { toast } from 'sonner';

export default function ScreeningConfiguration({ election }: { election: any }) {
  const [loading, setLoading] = useState(false);
  const [newCriteriaName, setNewCriteriaName] = useState('');
  const [newCriteriaWeight, setNewCriteriaWeight] = useState('');
  const [qualScore, setQualScore] = useState(election.screeningSetting?.qualificationScore?.toString() || '');

  const totalWeight = election.screeningCriteria.reduce((sum: number, c: any) => sum + c.weight, 0);

  const handleAddCriteria = async () => {
    if (!newCriteriaName || !newCriteriaWeight) return;
    
    const weight = parseFloat(newCriteriaWeight);
    if (isNaN(weight) || weight <= 0) {
      toast.error('Invalid weight', { description: 'Weight must be a positive number' });
      return;
    }

    if (totalWeight + weight > 100) {
      toast.error('Invalid weight', { description: 'Total weight cannot exceed 100%' });
      return;
    }

    try {
      setLoading(true);
      await addCriteria(election.id, newCriteriaName, weight);
      setNewCriteriaName('');
      setNewCriteriaWeight('');
      toast.success('Criteria added successfully');
    } catch (error: any) {
      toast.error('Error', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCriteria = async (id: string) => {
    try {
      setLoading(true);
      await removeCriteria(id);
      toast.success('Criteria removed');
    } catch (error: any) {
      toast.error('Error', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQualificationScore = async () => {
    const score = parseFloat(qualScore);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error('Invalid score', { description: 'Score must be between 0 and 100' });
      return;
    }

    try {
      setLoading(true);
      await setQualificationScore(election.id, score);
      toast.success('Qualification score saved');
    } catch (error: any) {
      toast.error('Error', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Screening Criteria</CardTitle>
          <CardDescription>
            Define the criteria and their max percentage weight (total must equal 100%).
            <br />
            Current Total: <span className={`font-bold ${totalWeight === 100 ? 'text-green-600' : 'text-amber-500'}`}>{totalWeight}%</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {election.screeningCriteria.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-muted-foreground">Max Score: {c.weight}%</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleRemoveCriteria(c.id)} disabled={loading}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}

            {totalWeight < 100 && (
              <div className="flex items-end gap-4 p-4 border rounded-md bg-muted/50">
                <div className="flex-1 space-y-2">
                  <Label>Criteria Name</Label>
                  <Input 
                    placeholder="e.g. Knowledge of the Faculty" 
                    value={newCriteriaName} 
                    onChange={e => setNewCriteriaName(e.target.value)} 
                  />
                </div>
                <div className="w-32 space-y-2">
                  <Label>Weight (%)</Label>
                  <Input 
                    type="number" 
                    placeholder="15" 
                    value={newCriteriaWeight} 
                    onChange={e => setNewCriteriaWeight(e.target.value)} 
                  />
                </div>
                <Button onClick={handleAddCriteria} disabled={loading || !newCriteriaName || !newCriteriaWeight}>
                  <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Qualification Cutoff Score</CardTitle>
          <CardDescription>Candidates scoring below this percentage will not be qualified.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="w-48 space-y-2">
              <Label>Minimum Score (%)</Label>
              <Input 
                type="number" 
                placeholder="e.g. 60" 
                value={qualScore} 
                onChange={e => setQualScore(e.target.value)} 
              />
            </div>
            <Button onClick={handleSaveQualificationScore} disabled={loading || !qualScore}>
              <Save className="h-4 w-4 mr-2" /> Save Score
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
