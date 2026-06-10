import spaceSchema from '~/schema/space';
import { applyTenantIsolation } from '~/models/plugins/tenantIsolation';
import type { ISpace } from '~/types/space';

export function createSpaceModel(mongoose: typeof import('mongoose')) {
  applyTenantIsolation(spaceSchema);
  return mongoose.models.Space || mongoose.model<ISpace>('Space', spaceSchema);
}
