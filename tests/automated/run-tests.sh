#!/bin/bash

# 自动化测试运行脚本

echo "开始运行自动化测试..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: Node.js未安装"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "错误: npm未安装"
    exit 1
fi

# 安装测试依赖
echo "安装测试依赖..."
npm install

# 检查服务是否运行
echo "检查服务状态..."
if ! curl -s http://localhost:3001/api > /dev/null; then
    echo "错误: 用户服务未运行 (端口3001)"
    exit 1
fi

if ! curl -s http://localhost:3002/api > /dev/null; then
    echo "错误: 订单服务未运行 (端口3002)"
    exit 1
fi

if ! curl -s http://localhost:3003/api > /dev/null; then
    echo "错误: 库存服务未运行 (端口3003)"
    exit 1
fi

echo "所有服务正常运行，开始测试..."

# 创建测试结果目录
mkdir -p results

# 运行所有测试
echo "运行所有自动化测试..."
npm test -- --verbose --coverage --coverageDirectory=results/coverage

# 运行单独的测试套件
echo ""
echo "运行单独的测试套件..."

echo "1. 用户服务测试..."
npm run test:user -- --verbose > results/user-service-test.log 2>&1

echo "2. 订单服务测试..."
npm run test:order -- --verbose > results/order-service-test.log 2>&1

echo "3. 库存服务测试..."
npm run test:inventory -- --verbose > results/inventory-service-test.log 2>&1

echo "4. 集成测试..."
npm run test:integration -- --verbose > results/integration-test.log 2>&1

echo ""
echo "所有自动化测试完成！"
echo "测试结果位置:"
echo "- 覆盖率报告: results/coverage/lcov-report/index.html"
echo "- 用户服务测试: results/user-service-test.log"
echo "- 订单服务测试: results/order-service-test.log"
echo "- 库存服务测试: results/inventory-service-test.log"
echo "- 集成测试: results/integration-test.log"

