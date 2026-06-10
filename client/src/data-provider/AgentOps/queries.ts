import { useQuery } from '@tanstack/react-query';
import { QueryKeys, dataService } from 'librechat-data-provider';

export const useArtifactsQuery = (enabled = true) =>
  useQuery([QueryKeys.artifacts], () => dataService.listArtifacts(), {
    enabled,
  });

export const useArtifactQuery = (artifactId: string, enabled = true) =>
  useQuery([QueryKeys.artifact, artifactId], () => dataService.getArtifact(artifactId), {
    enabled: enabled && Boolean(artifactId),
  });

export const useSpacesQuery = (enabled = true) =>
  useQuery([QueryKeys.spaces], () => dataService.listSpaces(), {
    enabled,
  });

export const useAgentRunsQuery = (enabled = true) =>
  useQuery([QueryKeys.agentRuns], () => dataService.listAgentRuns(), {
    enabled,
  });
