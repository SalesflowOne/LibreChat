import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryKeys, dataService } from 'librechat-data-provider';
import type { PipedreamConnectTokenRequest } from 'librechat-data-provider';

export const useCreatePipedreamConnectTokenMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PipedreamConnectTokenRequest) => dataService.createPipedreamConnectToken(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.pipedreamAccounts] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.mcpConnectionStatus] });
    },
  });
};
