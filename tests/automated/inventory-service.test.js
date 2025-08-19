const axios = require('axios');

const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3003';
const API_URL = `${INVENTORY_SERVICE_URL}/api`;

describe('Inventory Service API Tests', () => {
  let testProductId = 999;
  
  beforeAll(async () => {
    // 等待服务启动
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 初始化库存数据
    try {
      await axios.post(`${API_URL}/inventory/initialize`);
    } catch (error) {
      // 忽略初始化错误，可能已经初始化过
    }
  });

  describe('Inventory Initialization', () => {
    test('should initialize inventory successfully', async () => {
      const response = await axios.post(`${API_URL}/inventory/initialize`);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('message', 'Inventory initialized successfully');
    });
  });

  describe('Inventory Retrieval', () => {
    test('should get all inventory', async () => {
      const response = await axios.get(`${API_URL}/inventory`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message', 'Inventory retrieved successfully');
      expect(response.data).toHaveProperty('inventory');
      expect(Array.isArray(response.data.inventory)).toBe(true);
      expect(response.data.inventory.length).toBeGreaterThan(0);
    });

    test('should get specific inventory by product ID', async () => {
      const response = await axios.get(`${API_URL}/inventory/1`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message', 'Inventory retrieved successfully');
      expect(response.data).toHaveProperty('inventory');
      expect(response.data.inventory.productId).toBe(1);
      expect(response.data.inventory).toHaveProperty('productName');
      expect(response.data.inventory).toHaveProperty('quantity');
      expect(response.data.inventory).toHaveProperty('price');
    });

    test('should return 404 for non-existent product', async () => {
      try {
        await axios.get(`${API_URL}/inventory/99999`);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.message).toContain('not found');
      }
    });
  });

  describe('Inventory Creation', () => {
    test('should create new inventory item', async () => {
      const inventoryData = {
        productId: testProductId,
        productName: 'Test Product',
        quantity: 50,
        price: 199.99
      };

      const response = await axios.post(`${API_URL}/inventory`, inventoryData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('message', 'Inventory created successfully');
      expect(response.data).toHaveProperty('inventory');
      expect(response.data.inventory.productId).toBe(testProductId);
      expect(response.data.inventory.productName).toBe(inventoryData.productName);
      expect(response.data.inventory.quantity).toBe(inventoryData.quantity);
      expect(response.data.inventory.price).toBe(inventoryData.price);
    });

    test('should not create inventory with duplicate product ID', async () => {
      const duplicateData = {
        productId: testProductId,
        productName: 'Duplicate Product',
        quantity: 30,
        price: 99.99
      };

      try {
        await axios.post(`${API_URL}/inventory`, duplicateData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toContain('already exists');
      }
    });

    test('should not create inventory with invalid data', async () => {
      const invalidData = {
        productId: 'invalid',
        productName: '',
        quantity: -10,
        price: -5
      };

      try {
        await axios.post(`${API_URL}/inventory`, invalidData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('Inventory Update', () => {
    test('should update inventory quantity', async () => {
      const updateData = {
        quantity: 75
      };

      const response = await axios.put(`${API_URL}/inventory/${testProductId}`, updateData);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message', 'Inventory updated successfully');
      expect(response.data).toHaveProperty('inventory');
      expect(response.data.inventory.quantity).toBe(updateData.quantity);
    });

    test('should update inventory price', async () => {
      const updateData = {
        price: 249.99
      };

      const response = await axios.put(`${API_URL}/inventory/${testProductId}`, updateData);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message', 'Inventory updated successfully');
      expect(response.data).toHaveProperty('inventory');
      expect(response.data.inventory.price).toBe(updateData.price);
    });

    test('should update both quantity and price', async () => {
      const updateData = {
        quantity: 100,
        price: 299.99
      };

      const response = await axios.put(`${API_URL}/inventory/${testProductId}`, updateData);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message', 'Inventory updated successfully');
      expect(response.data).toHaveProperty('inventory');
      expect(response.data.inventory.quantity).toBe(updateData.quantity);
      expect(response.data.inventory.price).toBe(updateData.price);
    });

    test('should not update non-existent inventory', async () => {
      const updateData = {
        quantity: 50
      };

      try {
        await axios.put(`${API_URL}/inventory/99999`, updateData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.message).toContain('not found');
      }
    });

    test('should not update with invalid data', async () => {
      const invalidData = {
        quantity: -10,
        price: -5
      };

      try {
        await axios.put(`${API_URL}/inventory/${testProductId}`, invalidData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('Inventory Deletion', () => {
    test('should delete inventory item', async () => {
      const response = await axios.delete(`${API_URL}/inventory/${testProductId}`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message', 'Inventory deleted successfully');
    });

    test('should not delete non-existent inventory', async () => {
      try {
        await axios.delete(`${API_URL}/inventory/${testProductId}`);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.message).toContain('not found');
      }
    });
  });

  describe('Service Health Check', () => {
    test('should respond to health check', async () => {
      try {
        const response = await axios.get(`${API_URL}`);
        expect(response.status).toBe(200);
      } catch (error) {
        // 如果没有根路径，检查服务是否运行
        const response = await axios.get(`${API_URL}/inventory`);
        expect(response.status).toBe(200);
      }
    });
  });
});

