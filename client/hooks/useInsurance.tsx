import { useQuery } from '@tanstack/react-query';
import { API_URL } from '@/lib/api';

export interface InsuranceTier {
  tier: 'none' | 'basic' | 'standard' | 'premium';
  name: string;
  fee: number;
  coverage: number;
  description: string;
}

export interface InsuranceCalculation {
  recommendedTier: 'basic' | 'standard' | 'premium';
  tiers: {
    basic: { fee: number; coverage: number };
    standard: { fee: number; coverage: number };
    premium: { fee: number; coverage: number };
  };
}

export function useInsurance() {
  // Fetch insurance tiers
  const { data: tiers = [] } = useQuery<InsuranceTier[]>({
    queryKey: ['insurance', 'tiers'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/insurance/tiers`);
      if (!response.ok) throw new Error('Failed to fetch insurance tiers');
      return response.json();
    },
  });

  // Calculate insurance recommendation
  const calculateInsurance = async (declaredValue: number): Promise<InsuranceCalculation> => {
    const response = await fetch(`${API_URL}/insurance/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ declaredValue }),
    });
    if (!response.ok) throw new Error('Failed to calculate insurance');
    return response.json();
  };

  return {
    tiers,
    calculateInsurance,
  };
}
