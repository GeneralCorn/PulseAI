'use server';

import { runSimulation } from '@/lib/sim/simulator';
import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { Idea } from '@/lib/sim/types';

export async function startSimulation(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const useMock = formData.get('useMock') === 'on';

  const idea: Idea = {
    id: crypto.randomUUID(),
    title,
    description,
  };

  try {
    const result = await runSimulation([idea], 'single', { useMock });

    // Persist to Supabase
    const { data, error } = await supabase
      .from('simulations')
      .insert({
        mode: 'single',
        input_json: JSON.stringify({ idea }),
        result_json: JSON.stringify(result),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to save simulation');
    }

    return { success: true, redirectUrl: `/run/${data.id}` };
  } catch (error) {
    console.error('Simulation failed:', error);
    return { success: false, error: 'Failed to run simulation' };
  }
}
