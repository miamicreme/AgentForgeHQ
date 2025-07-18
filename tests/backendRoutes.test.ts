import request from 'supertest';
import app from '../backend/src/server';
import { describe, it, expect } from 'vitest';

describe('backend routes', () => {
  it('GET /templates returns template list', async () => {
    const res = await request(app).get('/templates');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /chat returns empty array initially', async () => {
    const res = await request(app).get('/chat');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /chat adds a message', async () => {
    const postRes = await request(app).post('/chat').send({ content: 'hello' });
    expect(postRes.status).toBe(200);
    expect(postRes.body).toMatchObject({ content: 'hello' });

    const listRes = await request(app).get('/chat');
    expect(listRes.body.length).toBe(1);
  });

  it('GET /list returns agent list', async () => {
    const res = await request(app).get('/list');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
