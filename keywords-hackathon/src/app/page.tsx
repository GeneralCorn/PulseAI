'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startSimulation } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const result = await startSimulation(formData);
    
    if (result.success && result.redirectUrl) {
      router.push(result.redirectUrl);
    } else {
      console.error(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg border-border/50 bg-card/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Synthetic Pulse</CardTitle>
          <CardDescription>
            Simulate stakeholder reactions to your ideas in a cyber-corporate war room.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Idea Title</Label>
              <Input id="title" name="title" placeholder="e.g., AI-Powered HR Assistant" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description & Context</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Describe your idea, goals, and target audience..." 
                className="min-h-[100px]"
                required 
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Critique Intensity</Label>
                <span className="text-xs text-muted-foreground">Stochastic Mocking</span>
              </div>
              <Slider defaultValue={[50]} max={100} step={1} />
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="useMock" name="useMock" defaultChecked />
              <Label htmlFor="useMock">Use Mock Data (Fast Mode)</Label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Simulating...
                </>
              ) : (
                'Run Simulation'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
