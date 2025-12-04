'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Vote, Lock, User, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function VoterLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/voter/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        toast.success('Login successful!');
        router.refresh();
      } else {
        toast.error(result.message || 'Login failed');
        if (result.message?.includes('already voted')) {
          toast.error('You have already voted');
        }
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-xl mb-4">
            <Vote className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Voting Portal</h1>
          <p className="text-gray-600">Secure access to cast your vote</p>
        </div>

        {/* Login Form */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-center text-gray-800">
              Sign In
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-sm font-medium text-gray-700">
                  Student ID
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="studentId"
                    value={formData.studentId}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, studentId: e.target.value }))
                    }
                    placeholder="Enter your matric number"
                    className="pl-11 h-12 border-gray-200 focus:border-slate-400 focus:ring-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter your password"
                    className="pl-11 h-12 border-gray-200 focus:border-slate-400 focus:ring-slate-400"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In to Vote'}
              </Button>
            </form>

            {/* Security Notice */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">Secure Voting</p>
                  <p>
                    Your vote is anonymous and encrypted. Contact your association administrator if
                    you need assistance.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
