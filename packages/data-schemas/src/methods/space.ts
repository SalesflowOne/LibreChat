import { randomUUID } from 'crypto';
import type { FilterQuery } from 'mongoose';
import type { ISpace, SpaceProvider, SpaceStatus } from '~/types/space';

export interface CreateSpaceInput {
  userId: string;
  tenantId: string;
  artifactId: string;
  name: string;
  provider?: SpaceProvider;
}

export function createSpaceMethods(mongoose: typeof import('mongoose')) {
  async function createSpace(input: CreateSpaceInput): Promise<ISpace> {
    const Space = mongoose.models.Space;
    const doc = await Space.create({
      spaceId: randomUUID(),
      user: input.userId,
      tenantId: input.tenantId,
      artifactId: input.artifactId,
      name: input.name,
      provider: input.provider ?? 'vercel',
      status: 'pending',
    });
    return doc.toObject() as ISpace;
  }

  async function listSpaces(
    filter: FilterQuery<ISpace>,
    options?: { limit?: number },
  ): Promise<ISpace[]> {
    const Space = mongoose.models.Space;
    const query = Space.find(filter).sort({ updatedAt: -1 });
    if (options?.limit) {
      query.limit(options.limit);
    }
    return query.lean<ISpace[]>();
  }

  async function getSpaceById(spaceId: string): Promise<ISpace | null> {
    const Space = mongoose.models.Space;
    return Space.findOne({ spaceId }).lean<ISpace | null>();
  }

  async function updateSpace(
    spaceId: string,
    update: Partial<Pick<ISpace, 'url' | 'status' | 'deploymentId' | 'errorMessage' | 'provider'>>,
  ): Promise<ISpace | null> {
    const Space = mongoose.models.Space;
    return Space.findOneAndUpdate({ spaceId }, { $set: update }, { new: true }).lean<ISpace | null>();
  }

  return {
    createSpace,
    listSpaces,
    getSpaceById,
    updateSpace,
  };
}

export type SpaceMethods = ReturnType<typeof createSpaceMethods>;
