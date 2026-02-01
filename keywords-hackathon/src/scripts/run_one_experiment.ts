/**
 * run_one_experiment.ts
 *
 * Standalone script to run one experiment with A/B variants and sample personas.
 *
 * Usage:
 *   npx tsx src/scripts/run_one_experiment.ts
 *   # or
 *   npm run experiment
 *
 * Required environment variables:
 *   KEYWORDSAI_API_KEY
 *   KEYWORDSAI_BASE_URL (optional, defaults to https://api.keywordsai.co/api)
 *   PROMPT_PERSONA_PROFILE_ID
 *   PROMPT_PERSONA_RESPONSE_ID
 *   PROMPT_DECISION_TRACE_ID
 *   PRIMARY_MODEL (optional, defaults to gpt-4o-mini)
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

// Load environment variables from .env file
import { config } from 'dotenv';
config();

import {
  createServerSupabaseClient,
  insertExperiment,
  insertVariant,
  getVariantsByExperiment,
} from '../lib/supabase';
import { runExperimentForPersona } from '../lib/personaAgent';

// ============================================================================
// Sample Data
// ============================================================================

// Hardcoded sample demographics (NO psychographics for MVP)
const SAMPLE_DEMOGRAPHICS = [
  {
    age: 28,
    gender: 'female',
    location: 'San Francisco, CA',
    income_bracket: '$75k-$100k',
    education: "Bachelor's degree",
    occupation: 'Product Manager',
    household_size: 2,
  },
  {
    age: 45,
    gender: 'male',
    location: 'Austin, TX',
    income_bracket: '$100k-$150k',
    education: "Master's degree",
    occupation: 'Software Engineering Manager',
    household_size: 4,
  },
  {
    age: 32,
    gender: 'non-binary',
    location: 'Brooklyn, NY',
    income_bracket: '$50k-$75k',
    education: "Bachelor's degree",
    occupation: 'Freelance Designer',
    household_size: 1,
  },
];

// Sample experiment prompt and questions
const SAMPLE_USER_PROMPT = `
We're testing a new AI-powered meal planning app that creates personalized weekly meal plans 
based on your dietary preferences, budget, and available cooking time. The app also generates 
shopping lists and provides step-by-step cooking instructions with video tutorials.
`;

const SAMPLE_QUESTIONS = [
  'How likely are you to try this product?',
  'How much would you be willing to pay for a monthly subscription?',
  'What features would make this more appealing to you?',
  'What concerns do you have about this product?',
];

// A/B variant stimuli
const VARIANT_A_STIMULUS = {
  name: 'Premium Plan',
  price: '$14.99/month',
  features: [
    'Unlimited meal plans',
    'AI-powered recipe recommendations',
    'Smart shopping lists with store integration',
    'Video cooking tutorials',
    'Nutritional tracking',
  ],
  messaging: 'Save time and eat healthier with personalized AI meal planning',
  visual_style: 'Clean, minimalist design with food photography',
};

const VARIANT_B_STIMULUS = {
  name: 'Family Bundle',
  price: '$9.99/month (first 3 months), then $19.99/month',
  features: [
    'Meal plans for up to 6 family members',
    'Kid-friendly recipes',
    'Budget-conscious meal options',
    'Batch cooking suggestions',
    'Family taste preference learning',
  ],
  messaging: 'Finally, meal planning the whole family will love',
  visual_style: 'Warm, family-oriented imagery with diverse representation',
};

// ============================================================================
// Main Script
// ============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('PERSONA AGENT EXPERIMENT RUNNER');
  console.log('='.repeat(60));

  // Validate environment (check both standard and NEXT_PUBLIC_ variants)
  // Note: PROMPT_*_ID vars are optional - will fall back to local prompts
  const envChecks = [
    { keys: ['KEYWORDSAI_API_KEY', 'NEXT_PUBLIC_KEYWORDS_AI_KEY'], name: 'KEYWORDSAI_API_KEY' },
    { keys: ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'], name: 'SUPABASE_URL' },
    { keys: ['SUPABASE_SERVICE_ROLE_KEY'], name: 'SUPABASE_SERVICE_ROLE_KEY' },
  ];

  const missingVars = envChecks
    .filter((check) => !check.keys.some((k) => process.env[k]))
    .map((check) => check.name);
  
  // Log which prompt sources will be used
  console.log('\nPrompt sources:');
  console.log(`  Profile: ${process.env.PROMPT_PERSONA_PROFILE_ID || 'local:persona_profile'}`);
  console.log(`  Response: ${process.env.PROMPT_PERSONA_RESPONSE_ID || 'local:persona_response'}`);
  console.log(`  Decision Trace: ${process.env.PROMPT_DECISION_TRACE_ID || 'local:decision_trace'}`);
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:');
    missingVars.forEach((v) => console.error(`  - ${v}`));
    process.exit(1);
  }

  const client = createServerSupabaseClient();

  // Step 1: Create experiment
  console.log('\n[Step 1] Creating experiment...');
  const experiment = await insertExperiment(
    client,
    SAMPLE_USER_PROMPT.trim(),
    SAMPLE_QUESTIONS
  );
  console.log(`  Created experiment: ${experiment.experiment_id}`);

  // Step 2: Create variants
  console.log('\n[Step 2] Creating variants...');
  const variantA = await insertVariant(
    client,
    experiment.experiment_id,
    'A',
    VARIANT_A_STIMULUS
  );
  console.log(`  Created variant A: ${variantA.variant_id}`);

  const variantB = await insertVariant(
    client,
    experiment.experiment_id,
    'B',
    VARIANT_B_STIMULUS
  );
  console.log(`  Created variant B: ${variantB.variant_id}`);

  // Load variants for processing
  const variants = await getVariantsByExperiment(client, experiment.experiment_id);

  // Step 3: Run experiment for each sample persona
  console.log('\n[Step 3] Running experiment for personas...');

  const results = [];
  for (let i = 0; i < SAMPLE_DEMOGRAPHICS.length; i++) {
    const demographics = SAMPLE_DEMOGRAPHICS[i];
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`Processing persona ${i + 1}/${SAMPLE_DEMOGRAPHICS.length}`);
    console.log(`Demographics: ${demographics.occupation}, ${demographics.age}yo, ${demographics.location}`);
    console.log('─'.repeat(50));

    try {
      const result = await runExperimentForPersona(
        experiment.experiment_id,
        demographics,
        SAMPLE_USER_PROMPT.trim(),
        SAMPLE_QUESTIONS,
        variants.map((v) => ({
          variant_id: v.variant_id,
          variant_key: v.variant_key,
          stimulus: v.stimulus,
        })),
        client
      );

      results.push(result);

      // Print summary
      console.log(`\n  Persona ID: ${result.personaId}`);
      if (result.profile) {
        console.log(`  Profile: ${result.profile.one_liner}`);
        console.log(`  Communication: ${result.profile.communication_style.tone} (${result.profile.communication_style.verbosity})`);
      }

      for (const r of result.responses) {
        if (r.response) {
          console.log(`\n  Variant ${r.variantKey} Response:`);
          console.log(`    Purchase Intent: ${r.response.purchase_intent}/5`);
          console.log(`    Trust: ${r.response.trust}/5`);
          console.log(`    Clarity: ${r.response.clarity}/5`);
          console.log(`    Differentiation: ${r.response.differentiation}/5`);
          console.log(`    Would Try: ${r.response.would_try}`);
          console.log(`    Would Pay: ${r.response.would_pay}`);
        }
        if (r.trace) {
          console.log(`    Confidence: ${(r.trace.confidence * 100).toFixed(0)}%`);
          console.log(`    Top Objections: ${r.trace.top_objections.slice(0, 2).join('; ')}`);
        }
      }
    } catch (error) {
      console.error(`  Error processing persona: ${error}`);
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('EXPERIMENT COMPLETE');
  console.log('='.repeat(60));
  console.log(`Experiment ID: ${experiment.experiment_id}`);
  console.log(`Personas processed: ${results.length}`);
  console.log(`Variants: ${variants.map((v) => v.variant_key).join(', ')}`);

  // Calculate aggregate stats
  const variantStats: Record<string, { count: number; avgIntent: number; wouldTry: number; wouldPay: number }> = {};
  
  for (const result of results) {
    for (const r of result.responses) {
      if (r.response) {
        if (!variantStats[r.variantKey]) {
          variantStats[r.variantKey] = { count: 0, avgIntent: 0, wouldTry: 0, wouldPay: 0 };
        }
        variantStats[r.variantKey].count++;
        variantStats[r.variantKey].avgIntent += r.response.purchase_intent;
        if (r.response.would_try) variantStats[r.variantKey].wouldTry++;
        if (r.response.would_pay) variantStats[r.variantKey].wouldPay++;
      }
    }
  }

  console.log('\nAggregate Results:');
  for (const [key, stats] of Object.entries(variantStats)) {
    console.log(`\n  Variant ${key}:`);
    console.log(`    Avg Purchase Intent: ${(stats.avgIntent / stats.count).toFixed(2)}/5`);
    console.log(`    Would Try: ${stats.wouldTry}/${stats.count} (${((stats.wouldTry / stats.count) * 100).toFixed(0)}%)`);
    console.log(`    Would Pay: ${stats.wouldPay}/${stats.count} (${((stats.wouldPay / stats.count) * 100).toFixed(0)}%)`);
  }

  console.log('\nDone!');
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
