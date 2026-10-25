import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ShippingConfig } from '@/lib/catalog';

export function useShipping() {
  return useQuery({ queryKey: ['shipping-config'], queryFn: () => api.get<ShippingConfig>('/shop/shipping-config') });
}
