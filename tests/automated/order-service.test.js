const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3002';
const USER_API_URL = `${USER_SERVICE_URL}/api`;
const ORDER_API_URL = `${ORDER_SERVICE_URL}/api`;

describe('Order Service API Tests', () => {
  let testUserToken = '';
  let testUserId = '';
  let testOrderId = '';
  
  const testUser = {
    email: `ordertest${Date.now()}@example.com`,
    password: 'password123',
    username: `orderuser${Date.now()}`
  };

  beforeAll(async () => {
    // 等待服务启动
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 创建测试用户
    const registerResponse = await axios.post(`${USER_API_URL}/users/register`, testUser);
    testUserToken = registerResponse.data.access_token;
    testUserId = registerResponse.data.user.id;
    
    // 初始化库存
    try {
      await axios.post(`${ORDER_SERVICE_URL}/api/inventory/initialize`);
    } catch (error) {
      // 忽略初始化错误，可能已经初始化过
    }
  });

  describe('Stock Management', () => {
    test('should get all stock', async () => {
      const response = await axios.get(`${ORDER_API_URL}/stock`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message', 'Stock retrieved successfully');
      expect(response.data).toHaveProperty('stock');
      expect(Array.isArray(response.data.stock)).toBe(true);
    });

    test('should get stock for specific product', async () => {
      const response = await axios.get(`${ORDER_API_URL}/stock/1`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message', 'Stock retrieved successfully');
      expect(response.data).toHaveProperty('productId', 1);
      expect(response.data).toHaveProperty('quantity');
      expect(typeof response.data.quantity).toBe('number');
    });

    test('should update stock for specific product', async () => {
      const newQuantity = 150;
      const response = await axios.put(`${ORDER_API_URL}/stock/1`, {
        quantity: newQuantity
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message', 'Stock updated successfully');
      expect(response.data).toHaveProperty('productId', 1);
      expect(response.data).toHaveProperty('quantity', newQuantity);
    });

    test('should check Redis health', async () => {
      const response = await axios.get(`${ORDER_API_URL}/stock/health/check`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message', 'Redis health check completed');
      expect(response.data).toHaveProperty('healthy', true);
    });
  });

  describe('Order Creation', () => {
    test('should create order with valid data and sufficient stock', async () => {
      const orderData = {
        productId: 1,
        productName: 'iPhone 15',
        price: 999.99,
        quantity: 1
      };

      const response = await axios.post(`${ORDER_API_URL}/orders`, orderData, {
        headers: {
          Authorization: `Bearer ${testUserToken}`
        }
      });
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('message', 'Order created successfully');
      expect(response.data).toHaveProperty('order');
      expect(response.data.order.productId).toBe(orderData.productId);
      expect(response.data.order.quantity).toBe(orderData.quantity);
      expect(response.data.order.status).toBe('pending');
      
      testOrderId = response.data.order.id;
    });

    test('should not create order without authentication', async () => {
      const orderData = {
        productId: 1,
        productName: 'iPhone 15',
        price: 999.99,
        quantity: 1
      };

      try {
        await axios.post(`${ORDER_API_URL}/orders`, orderData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    test('should not create order with invalid data', async () => {
      const invalidOrderData = {
        productId: 'invalid',
        productName: '',
        price: -10,
        quantity: 0
      };

      try {
        await axios.post(`${ORDER_API_URL}/orders`, invalidOrderData, {
          headers: {
            Authorization: `Bearer ${testUserToken}`
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    test('should not create order with insufficient stock', async () => {
      // 先设置库存为0
      await axios.put(`${ORDER_API_URL}/stock/2`, { quantity: 0 });
      
      const orderData = {
        productId: 2,
        productName: 'Samsung Galaxy S24',
        price: 899.99,
        quantity: 1
      };

      try {
        await axios.post(`${ORDER_API_URL}/orders`, orderData, {
          headers: {
            Authorization: `Bearer ${testUserToken}`
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toContain('Insufficient stock');
      }
      
      // 恢复库存
      await axios.put(`${ORDER_API_URL}/stock/2`, { quantity: 80 });
    });
  });

  describe('Order Retrieval', () => {
    test('should get user orders', async () => {
      const response = await axios.get(`${ORDER_API_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${testUserToken}`
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message', 'Orders retrieved successfully');
      expect(response.data).toHaveProperty('orders');
      expect(Array.isArray(response.data.orders)).toBe(true);
      expect(response.data.orders.length).toBeGreaterThan(0);
    });

    test('should get specific order by ID', async () => {
      const response = await axios.get(`${ORDER_API_URL}/orders/${testOrderId}`, {
        headers: {
          Authorization: `Bearer ${testUserToken}`
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message', 'Order retrieved successfully');
      expect(response.data).toHaveProperty('order');
      expect(response.data.order.id).toBe(testOrderId);
    });

    test('should not get orders without authentication', async () => {
      try {
        await axios.get(`${ORDER_API_URL}/orders`);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    test('should not get non-existent order', async () => {
      try {
        await axios.get(`${ORDER_API_URL}/orders/99999`, {
          headers: {
            Authorization: `Bearer ${testUserToken}`
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('Order Cancellation', () => {
    test('should cancel pending order', async () => {
      const response = await axios.put(`${ORDER_API_URL}/orders/${testOrderId}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${testUserToken}`
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message', 'Order cancelled successfully');
      expect(response.data).toHaveProperty('order');
      expect(response.data.order.status).toBe('cancelled');
    });

    test('should not cancel already cancelled order', async () => {
      try {
        await axios.put(`${ORDER_API_URL}/orders/${testOrderId}/cancel`, {}, {
          headers: {
            Authorization: `Bearer ${testUserToken}`
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toContain('cannot be cancelled');
      }
    });

    test('should not cancel order without authentication', async () => {
      try {
        await axios.put(`${ORDER_API_URL}/orders/${testOrderId}/cancel`);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });
});

