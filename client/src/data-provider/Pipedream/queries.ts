import { useQuery } from '@tanstack/react-query';
import { QueryKeys, dataService } from 'librechat-data-provider';
import type {
  PipedreamAccountsResponse,
  PipedreamApp,
  PipedreamStatusResponse,
} from 'librechat-data-provider';

const disabledPipedreamStatus: PipedreamStatusResponse = {
  enabled: false,
  apps: [],
};

const emptyPipedreamAccounts: PipedreamAccountsResponse = {
  accounts: [],
};

const isNotFoundError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'response' in error &&
  typeof (error as { response?: { status?: number } }).response?.status === 'number' &&
  (error as { response: { status: number } }).response.status === 404;

export const usePipedreamStatusQuery = (enabled = true) =>
  useQuery<PipedreamStatusResponse>({
    queryKey: [QueryKeys.pipedreamStatus],
    queryFn: async () => {
      try {
        return await dataService.getPipedreamStatus();
      } catch (error) {
        if (isNotFoundError(error)) {
          return disabledPipedreamStatus;
        }
        throw error;
      }
    },
    enabled,
    staleTime: 60_000,
    retry: false,
  });

export const usePipedreamAppsQuery = (
  params?: { q?: string; limit?: number },
  enabled = true,
) =>
  useQuery<{ apps: PipedreamApp[] }>({
    queryKey: [QueryKeys.pipedreamApps, params?.q ?? '', params?.limit ?? ''],
    queryFn: async () => {
      try {
        return await dataService.getPipedreamApps(params);
      } catch (error) {
        if (isNotFoundError(error)) {
          return { apps: [] };
        }
        throw error;
      }
    },
    enabled,
    staleTime: 60_000,
    retry: false,
  });

export const usePipedreamAccountsQuery = (enabled = true) =>
  useQuery<PipedreamAccountsResponse>({
    queryKey: [QueryKeys.pipedreamAccounts],
    queryFn: async () => {
      try {
        return await dataService.getPipedreamAccounts();
      } catch (error) {
        if (isNotFoundError(error)) {
          return emptyPipedreamAccounts;
        }
        throw error;
      }
    },
    enabled,
    staleTime: 30_000,
    retry: false,
  });
