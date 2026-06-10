import { useQuery } from '@tanstack/react-query';
import { QueryKeys, dataService } from 'librechat-data-provider';
import type {
  PipedreamAccountsResponse,
  PipedreamStatusResponse,
} from 'librechat-data-provider';

export const usePipedreamStatusQuery = (enabled = true) =>
  useQuery<PipedreamStatusResponse>({
    queryKey: [QueryKeys.pipedreamStatus],
    queryFn: () => dataService.getPipedreamStatus(),
    enabled,
    staleTime: 60_000,
  });

export const usePipedreamAccountsQuery = (enabled = true) =>
  useQuery<PipedreamAccountsResponse>({
    queryKey: [QueryKeys.pipedreamAccounts],
    queryFn: () => dataService.getPipedreamAccounts(),
    enabled,
    staleTime: 30_000,
  });
