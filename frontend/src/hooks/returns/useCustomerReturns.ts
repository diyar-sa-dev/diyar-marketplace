import { useQuery } from '@tanstack/react-query';
import { fetchCustomerReturns } from '../../api/returns.ts';

export const customerReturnKeys = {
  all: ['customer-returns'] as const,
  list: (page: number) => [...customerReturnKeys.all, page] as const,
};

export function useCustomerReturns(page = 1) {
  return useQuery({
    queryKey: customerReturnKeys.list(page),
    queryFn: () => fetchCustomerReturns(page),
  });
}
