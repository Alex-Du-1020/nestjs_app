const axios = require('axios');

const BASE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const API_URL = `${BASE_URL}/api`;

describe('User Service API Tests', () => {
  let testUserToken = '';
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    username: `testuser${Date.now()}`
  };

  beforeAll(async () => {
    // 等待服务启动
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  describe('User Registration', () => {
    test('should register a new user successfully', async () => {
      const response = await axios.post(`${API_URL}/users/register`, testUser);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('message', 'User registered successfully');
      expect(response.data).toHaveProperty('user');
      expect(response.data).toHaveProperty('access_token');
      expect(response.data.user.email).toBe(testUser.email);
      expect(response.data.user.username).toBe(testUser.username);
      
      testUserToken = response.data.access_token;
    });

    test('should not register user with duplicate email', async () => {
      try {
        await axios.post(`${API_URL}/users/register`, testUser);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(409);
        expect(error.response.data.message).toContain('already exists');
      }
    });

    test('should not register user with invalid email', async () => {
      const invalidUser = {
        ...testUser,
        email: 'invalid-email'
      };

      try {
        await axios.post(`${API_URL}/users/register`, invalidUser);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    test('should not register user with short password', async () => {
      const invalidUser = {
        ...testUser,
        email: `test2${Date.now()}@example.com`,
        password: '123'
      };

      try {
        await axios.post(`${API_URL}/users/register`, invalidUser);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('User Login', () => {
    test('should login with valid credentials', async () => {
      const loginData = {
        email: testUser.email,
        password: testUser.password
      };

      const response = await axios.post(`${API_URL}/users/login`, loginData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('message', 'Login successful');
      expect(response.data).toHaveProperty('user');
      expect(response.data).toHaveProperty('access_token');
      expect(response.data.user.email).toBe(testUser.email);
    });

    test('should not login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: testUser.password
      };

      try {
        await axios.post(`${API_URL}/users/login`, loginData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.message).toBe('Invalid credentials');
      }
    });

    test('should not login with invalid password', async () => {
      const loginData = {
        email: testUser.email,
        password: 'wrongpassword'
      };

      try {
        await axios.post(`${API_URL}/users/login`, loginData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.message).toBe('Invalid credentials');
      }
    });
  });

  describe('User Profile', () => {
    test('should get user profile with valid token', async () => {
      const response = await axios.get(`${API_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${testUserToken}`
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message', 'Profile retrieved successfully');
      expect(response.data).toHaveProperty('user');
      expect(response.data.user.email).toBe(testUser.email);
    });

    test('should not get profile without token', async () => {
      try {
        await axios.get(`${API_URL}/users/profile`);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    test('should not get profile with invalid token', async () => {
      try {
        await axios.get(`${API_URL}/users/profile`, {
          headers: {
            Authorization: 'Bearer invalid-token'
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('Token Verification', () => {
    test('should verify valid token', async () => {
      const response = await axios.post(`${API_URL}/users/verify`, {}, {
        headers: {
          Authorization: `Bearer ${testUserToken}`
        }
      });
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('message', 'Token is valid');
      expect(response.data).toHaveProperty('user');
    });

    test('should not verify invalid token', async () => {
      try {
        await axios.post(`${API_URL}/users/verify`, {}, {
          headers: {
            Authorization: 'Bearer invalid-token'
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });
});

