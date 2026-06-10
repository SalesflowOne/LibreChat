import { getPipedreamExternalUserId } from './identity';

describe('getPipedreamExternalUserId', () => {
  it('scopes external id to tenant and user', () => {
    expect(getPipedreamExternalUserId({ id: 'user_1', tenantId: 'org_abc' })).toBe('org_abc:user_1');
  });

  it('falls back to user id when tenant is missing', () => {
    expect(getPipedreamExternalUserId({ id: 'user_1' })).toBe('user_1');
  });
});
