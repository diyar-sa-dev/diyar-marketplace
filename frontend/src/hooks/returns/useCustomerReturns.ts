import { useQuery } from '@tanstack/react-query';
import { fetchCustomerReturns } from '../../api/returns.ts';

export const customerReturnKeys = {
  all: ['customer-returns'] as const,
  list: (page: number, perPage: number) => [...customerReturnKeys.all, page, perPage] as const,
};

export function useCustomerReturns(page = 1, perPage = 10) {
  return useQuery({
    queryKey: customerReturnKeys.list(page, perPage),
    queryFn: () => fetchCustomerReturns(page, perPage),
  });
}
