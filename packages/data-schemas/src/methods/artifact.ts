import { randomUUID } from 'crypto';
import type { FilterQuery } from 'mongoose';
import type { IArtifact, IArtifactFile, ArtifactStatus, ArtifactType } from '~/types/artifact';

export interface CreateArtifactInput {
  userId: string;
  tenantId: string;
  title: string;
  type: ArtifactType;
  files: IArtifactFile[];
  conversationId?: string;
  messageId?: string;
  status?: ArtifactStatus;
  previewUrl?: string;
}

export function createArtifactMethods(mongoose: typeof import('mongoose')) {
  async function createArtifact(input: CreateArtifactInput): Promise<IArtifact> {
    const Artifact = mongoose.models.Artifact;
    const doc = await Artifact.create({
      artifactId: randomUUID(),
      user: input.userId,
      tenantId: input.tenantId,
      title: input.title,
      type: input.type,
      files: input.files,
      conversationId: input.conversationId,
      messageId: input.messageId,
      status: input.status ?? 'draft',
      previewUrl: input.previewUrl,
      version: 1,
    });
    return doc.toObject() as IArtifact;
  }

  async function listArtifacts(
    filter: FilterQuery<IArtifact>,
    options?: { limit?: number; skip?: number },
  ): Promise<IArtifact[]> {
    const Artifact = mongoose.models.Artifact;
    const query = Artifact.find(filter).sort({ updatedAt: -1 });
    if (options?.skip) {
      query.skip(options.skip);
    }
    if (options?.limit) {
      query.limit(options.limit);
    }
    return query.lean<IArtifact[]>();
  }

  async function getArtifactById(artifactId: string): Promise<IArtifact | null> {
    const Artifact = mongoose.models.Artifact;
    return Artifact.findOne({ artifactId }).lean<IArtifact | null>();
  }

  async function updateArtifact(
    artifactId: string,
    update: Partial<Pick<IArtifact, 'title' | 'files' | 'status' | 'previewUrl' | 'deployUrl' | 'version'>>,
  ): Promise<IArtifact | null> {
    const Artifact = mongoose.models.Artifact;
    return Artifact.findOneAndUpdate({ artifactId }, { $set: update }, { new: true }).lean<IArtifact | null>();
  }

  return {
    createArtifact,
    listArtifacts,
    getArtifactById,
    updateArtifact,
  };
}

export type ArtifactMethods = ReturnType<typeof createArtifactMethods>;
