const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3002';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3003';

const USER_API_URL = `${USER_SERVICE_URL}/api`;
const ORDER_API_URL = `${ORDER_SERVICE_URL}/api`;
const INVENTORY_API_URL = `${INVENTORY_SERVICE_URL}/api`;

describe('Microservices Integration Tests', () => {
  let testUserToken = '';
  let testUserId = '';
  let initialStock = {};
  
  const testUser = {
    email: `integration${Date.now()}@example.com`,
    password: 'password123',
    username: `integrationuser${Date.now()}`
  };

  beforeAll(async () => {
    // 等待所有服务启动
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 初始化库存
    await axios.post(`${INVENTORY_API_URL}/inventory/initialize`);
    
    // 获取初始库存状态
    const stockResponse = await axios.get(`${ORDER_API_URL}/stock/1`);
    initialStock = stockResponse.data;
    
    // 创建测试用户
    const registerResponse = await axios.post(`${USER_API_URL}/users/register`, testUser);
    testUserToken = registerResponse.data.access_token;
    testUserId = registerResponse.data.user.id;
  });

  describe('Complete Order Flow Integration', () => {
    test('should complete full order flow: register -> login -> create order -> check stock', async () => {
      // 1. 用户注册（已在beforeAll中完成）
      expect(testUserToken).toBeTruthy();
      
      // 2. 用户登录
      const loginResponse = await axios.post(`${USER_API_URL}/users/login`, {
        email: testUser.email,
        password: testUser.password
      });
      
      expect(loginResponse.status).toBe(201);
      expect(loginResponse.data).toHaveProperty('access_token');
      
      const loginToken = loginResponse.data.access_token;
      
      // 3. 检查初始库存
      const initialStockResponse = await axios.get(`${ORDER_API_URL}/stock/1`);
      const initialQuantity = initialStockResponse.data.quantity;
      
      // 4. 创建订单
      const orderData = {
        productId: 1,
        productName: 'iPhone 15',
        price: 999.99,
        quantity: 2
      };
      
      const orderResponse = await axios.post(`${ORDER_API_URL}/orders`, orderData, {
        headers: {
          Authorization: `Bearer ${loginToken}`
        }
      });
      
      expect(orderResponse.status).toBe(201);
      expect(orderResponse.data).toHaveProperty('order');
      expect(orderResponse.data.order.status).toBe('pending');
      
      // 5. 验证库存已扣减（Redis中）
      const updatedStockResponse = await axios.get(`${ORDER_API_URL}/stock/1`);
      const updatedQuantity = updatedStockResponse.data.quantity;
      
      expect(updatedQuantity).toBe(initialQuantity - orderData.quantity);
      
      // 6. 获取用户订单列表
      const ordersResponse = await axios.get(`${ORDER_API_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${loginToken}`
        }
      });
      
      expect(ordersResponse.status).toBe(200);
      expect(ordersResponse.data.orders.length).toBeGreaterThan(0);
      
      const createdOrder = ordersResponse.data.orders.find(
        order => order.id === orderResponse.data.order.id
      );
      expect(createdOrder).toBeTruthy();
      expect(createdOrder.productId).toBe(orderData.productId);
      expect(createdOrder.quantity).toBe(orderData.quantity);
    });

    test('should handle order cancellation and stock rollback', async () => {
      // 1. 检查当前库存
      const initialStockResponse = await axios.get(`${ORDER_API_URL}/stock/2`);
      const initialQuantity = initialStockResponse.data.quantity;
      
      // 2. 创建订单
      const orderData = {
        productId: 2,
        productName: 'Samsung Galaxy S24',
        price: 899.99,
        quantity: 1
      };
      
      const orderResponse = await axios.post(`${ORDER_API_URL}/orders`, orderData, {
        headers: {
          Authorization: `Bearer ${testUserToken}`
        }
      });
      
      expect(orderResponse.status).toBe(201);
      const orderId = orderResponse.data.order.id;
      
      // 3. 验证库存已扣减
      const afterOrderStockResponse = await axios.get(`${ORDER_API_URL}/stock/2`);
      const afterOrderQuantity = afterOrderStockResponse.data.quantity;
      expect(afterOrderQuantity).toBe(initialQuantity - orderData.quantity);
      
      // 4. 取消订单
      const cancelResponse = await axios.put(`${ORDER_API_URL}/orders/${orderId}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${testUserToken}`
        }
      });
      
      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.data.order.status).toBe('cancelled');
      
      // 5. 验证库存已回滚
      // 等待Kafka消息处理完成
      await new Promise(resolve => setTimeout(resolve, 100));
      const afterCancelStockResponse = await axios.get(`${ORDER_API_URL}/stock/2`);
      const afterCancelQuantity = afterCancelStockResponse.data.quantity;
      expect(afterCancelQuantity).toBe(initialQuantity);
    });

    test('should prevent overselling with concurrent orders', async () => {
      // 1. 设置产品库存为较小值
      await axios.put(`${ORDER_API_URL}/stock/3`, { quantity: 5 });
      
      // 2. 创建多个并发订单请求（总数量超过库存）
      const orderPromises = [];
      const orderData = {
        productId: 3,
        productName: 'MacBook Pro',
        price: 1999.99,
        quantity: 2
      };
      
      // 创建10个并发订单，每个2个数量，总共20个，但库存只有5个
      for (let i = 0; i < 10; i++) {
        const promise = axios.post(`${ORDER_API_URL}/orders`, orderData, {
          headers: {
            Authorization: `Bearer ${testUserToken}`
          }
        }).catch(error => error.response);
        
        orderPromises.push(promise);
      }
      
      // 3. 等待所有请求完成
      const results = await Promise.all(orderPromises);
      
      // 4. 统计成功和失败的订单
      const successfulOrders = results.filter(result => result.status === 201);
      const failedOrders = results.filter(result => result.status === 400);
      
      // 5. 验证防超卖机制
      expect(successfulOrders.length).toBeLessThanOrEqual(2); // 最多2个成功（5/2=2.5）
      expect(failedOrders.length).toBeGreaterThan(0); // 应该有失败的订单
      
      // 6. 验证最终库存不为负数
      const finalStockResponse = await axios.get(`${ORDER_API_URL}/stock/3`);
      const finalQuantity = finalStockResponse.data.quantity;
      expect(finalQuantity).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Service Communication Integration', () => {
    test('should validate user token across services', async () => {
      // 1. 在用户服务验证token
      const userVerifyResponse = await axios.post(`${USER_API_URL}/users/verify`, {}, {
        headers: {
          Authorization: `Bearer ${testUserToken}`
        }
      });
      
      expect(userVerifyResponse.status).toBe(201);
      expect(userVerifyResponse.data.user.id).toBe(testUserId);
      
      // 2. 使用相同token在订单服务创建订单
      const orderData = {
        productId: 4,
        productName: 'iPad Air',
        price: 599.99,
        quantity: 1
      };
      
      const orderResponse = await axios.post(`${ORDER_API_URL}/orders`, orderData, {
        headers: {
          Authorization: `Bearer ${testUserToken}`
        }
      });
      
      expect(orderResponse.status).toBe(201);
      expect(orderResponse.data.order.userId).toBe(testUserId);
    });

    test('should handle service unavailability gracefully', async () => {
      // 测试当某个服务不可用时的处理
      // 这里我们模拟一个不存在的服务端点
      try {
        await axios.get('http://localhost:9999/api/nonexistent');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.code).toBe('ECONNREFUSED');
      }
    });
  });

  describe('Data Consistency Integration', () => {
    test('should maintain consistency between Redis cache and database', async () => {
      // 1. 通过库存服务更新数据库库存
      const updateResponse = await axios.put(`${INVENTORY_API_URL}/inventory/5`, {
        quantity: 300
      });
      
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data.inventory.quantity).toBe(300);
      
      // 2. 检查Redis中的库存是否同步
      const redisStockResponse = await axios.get(`${ORDER_API_URL}/stock/5`);
      expect(redisStockResponse.data.quantity).toBe(300);
      
      // 3. 创建订单测试扣减
      const orderData = {
        productId: 5,
        productName: 'AirPods Pro',
        price: 249.99,
        quantity: 10
      };
      
      const orderResponse = await axios.post(`${ORDER_API_URL}/orders`, orderData, {
        headers: {
          Authorization: `Bearer ${testUserToken}`
        }
      });
      
      expect(orderResponse.status).toBe(201);
      
      // 4. 验证Redis库存已扣减
      const afterOrderRedisResponse = await axios.get(`${ORDER_API_URL}/stock/5`);
      expect(afterOrderRedisResponse.data.quantity).toBe(290);
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle invalid authentication across services', async () => {
      const invalidToken = 'invalid-token-12345';
      
      // 1. 用户服务应该拒绝无效token
      try {
        await axios.post(`${USER_API_URL}/users/verify`, {}, {
          headers: {
            Authorization: `Bearer ${invalidToken}`
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
      
      // 2. 订单服务也应该拒绝无效token
      try {
        await axios.post(`${ORDER_API_URL}/orders`, {
          productId: 1,
          productName: 'Test',
          price: 100,
          quantity: 1
        }, {
          headers: {
            Authorization: `Bearer ${invalidToken}`
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    test('should handle malformed requests consistently', async () => {
      const malformedData = {
        invalid: 'data',
        missing: 'required fields'
      };
      
      // 1. 用户服务
      try {
        await axios.post(`${USER_API_URL}/users/register`, malformedData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
      
      // 2. 订单服务
      try {
        await axios.post(`${ORDER_API_URL}/orders`, malformedData, {
          headers: {
            Authorization: `Bearer ${testUserToken}`
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
      
      // 3. 库存服务
      try {
        await axios.post(`${INVENTORY_API_URL}/inventory`, malformedData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });
  });
});

