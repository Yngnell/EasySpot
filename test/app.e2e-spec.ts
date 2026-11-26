// Needs a running MySQL database configured in .env (e.g. XAMPP).
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('EasySpot API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  it('GET / is public', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => expect(res.body.name).toBe('EasySpot API'));
  });

  it('GET /parking-lots without a token is rejected with 401', () => {
    return request(app.getHttpServer()).get('/parking-lots').expect(401);
  });

  it('POST /auth/login with an invalid body is rejected with 400', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'not-an-email' })
      .expect(400);
  });

  afterAll(async () => {
    await app.close();
  });
});
