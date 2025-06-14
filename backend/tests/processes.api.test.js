const request = require('supertest');
const app = require('../src/app');

describe('GET /api/processes', () => {
  it('Response status code should be 200', async () => {
    const response = await request(app).get('/api/processes');
    expect(response.statusCode).toBe(200);
  });

  it('Response should have the required fields', async () => {
    const response = await request(app).get('/api/processes');
    const responseData = response.body;

    expect(responseData).toBeInstanceOf(Array);
    expect(responseData.length).toBeGreaterThan(0);

    responseData.forEach(item => {
      expect(item).toHaveProperty('_id');
      expect(item).toHaveProperty('date');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('unit');
      expect(item).toHaveProperty('phone');
      expect(item).toHaveProperty('area');
      expect(item).toHaveProperty('community');
      expect(item).toHaveProperty('address');
      expect(item).toHaveProperty('type');
      expect(item).toHaveProperty('priority');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('repairId');
      expect(item).toHaveProperty('customerId');
      expect(item).toHaveProperty('__v');
    });
  });

  it('Phone should be in a valid format', async () => {
    const response = await request(app).get('/api/processes');
    const responseData = response.body;

    expect(responseData).toBeInstanceOf(Array);
    expect(responseData.length).toBeGreaterThan(0);

    responseData.forEach(item => {
      expect(item.phone).toMatch(/^\+?[1-9]\d{1,14}$/);
    });
  });

  it('Response time should be less than 200ms', async () => {
    const start = Date.now();
    await request(app).get('/api/processes');
    const responseTime = Date.now() - start;
    expect(responseTime).toBeLessThan(200);
  });

  it('Response schema should match expected structure', async () => {
    const response = await request(app).get('/api/processes');
    const responseData = response.body;

    expect(responseData).toBeInstanceOf(Array);
    expect(responseData.length).toBeGreaterThan(0);

    responseData.forEach(item => {
      expect(typeof item).toBe('object');
      expect(item).toHaveProperty('_id');
      expect(item).toHaveProperty('date');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('unit');
      expect(item).toHaveProperty('phone');
      expect(item).toHaveProperty('area');
      expect(item).toHaveProperty('community');
      expect(item).toHaveProperty('address');
      expect(item).toHaveProperty('type');
      expect(item).toHaveProperty('priority');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('repairId');
      expect(item).toHaveProperty('customerId');
      expect(item).toHaveProperty('__v');
    });
  });
});