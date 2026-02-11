import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

// only run e2e when a real test DB is configured (prevents noisy failures on dev machines)
const shouldRunE2E = Boolean(
  process.env.DB_HOST || process.env.DATABASE_URL || process.env.CI === 'true',
);

(shouldRunE2E ? describe : describe.skip)('Club (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let createdId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer() as unknown;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/club -> create, then GET/GET:id/PATCH/DELETE', async () => {
    const payload = {
      name: `e2e-club-${Date.now()}`,
      description: 'e2e test',
      tags: ['e2e', 'smoke'],
      maxMembers: 42,
      requiresApproval: false,
      isFeatured: false,
    };

    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
    const bodyData = (res: any) =>
      res.body && res.body.data ? res.body.data : res.body;

    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    const createRes = await request(server).post('/api/club').send(payload);
    expect([200, 201]).toContain(createRes.status);
    const created = bodyData(createRes);
    createdId =
      created?.id ||
      created?.data?.id ||
      createRes.body?.id ||
      createRes.body?.[0]?.id;
    expect(createdId).toBeDefined();
    // new fields
    expect(created).toHaveProperty('publicId');
    expect(created).toHaveProperty('slug');
    expect(created).toHaveProperty('tags');
    expect(Array.isArray(created.tags)).toBeTruthy();

    const listRes = await request(server)
      .get('/api/club')
      .query({ search: 'e2e-club' });
    expect(listRes.status).toBe(200);
    const listData = bodyData(listRes);
    expect(listData).toBeDefined();

    const getOneRes = await request(server).get(`/api/club/${createdId}`);
    expect(getOneRes.status).toBe(200);
    const getOneData = bodyData(getOneRes);
    expect(getOneData).toHaveProperty('id', createdId);

    const patchRes = await request(server)
      .patch(`/api/club/${createdId}`)
      .send({ description: 'updated' });
    expect(patchRes.status).toBe(200);
    const patchData = bodyData(patchRes);
    expect(patchData).toHaveProperty('description', 'updated');

    const deleteRes = await request(server).delete(`/api/club/${createdId}`);
    expect([200, 204]).toContain(deleteRes.status);

    const afterDelete = await request(server).get(`/api/club/${createdId}`);
    expect([404, 410]).toContain(afterDelete.status);
  }, 20000);
  /* eslint-enable */
});
