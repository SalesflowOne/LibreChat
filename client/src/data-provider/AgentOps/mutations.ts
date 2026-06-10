import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryKeys, dataService } from 'librechat-data-provider';
import type { CreateArtifactRequest, DeploySpaceRequest } from 'librechat-data-provider';

export const useCreateArtifactMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateArtifactRequest) => dataService.createArtifact(data),
    onSuccess: () => {
      queryClient.invalidateQueries([QueryKeys.artifacts]);
    },
  });
};

export const usePublishArtifactPreviewMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (artifactId: string) => dataService.publishArtifactPreview(artifactId),
    onSuccess: () => {
      queryClient.invalidateQueries([QueryKeys.artifacts]);
    },
  });
};

export const useDeploySpaceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DeploySpaceRequest) => dataService.deploySpace(data),
    onSuccess: () => {
      queryClient.invalidateQueries([QueryKeys.spaces]);
      queryClient.invalidateQueries([QueryKeys.artifacts]);
    },
  });
};
