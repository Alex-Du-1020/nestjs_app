// Jest setup file
// 全局测试配置

// 设置测试超时时间
jest.setTimeout(30000);

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 测试环境变量
process.env.NODE_ENV = 'test';
process.env.USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
process.env.ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3002';
process.env.INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3003';

// 全局测试工具函数
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 测试前后钩子
beforeAll(async () => {
  console.log('Starting automated tests...');
  // 等待服务启动
  await global.sleep(5000);
});

afterAll(async () => {
  console.log('Automated tests completed.');
});

