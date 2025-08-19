#!/bin/bash

# JMeter测试运行脚本
# 确保JMeter已安装并在PATH中

# 创建结果目录并清理旧结果
mkdir -p results

# 清理旧的测试结果文件
rm -f results/user-registration-results.jtl
rm -f results/order-creation-results.jtl
rm -f results/stress-test-results.jtl

# 清理旧的测试报告目录
rm -rf results/user-registration-report
rm -rf results/order-creation-report
rm -rf results/stress-test-report

echo "开始运行JMeter性能测试..."

# 检查JMeter是否安装
if ! command -v jmeter &> /dev/null; then
    echo "错误: JMeter未安装或不在PATH中"
    echo "请安装JMeter: https://jmeter.apache.org/download_jmeter.cgi"
    exit 1
fi

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

# 运行用户注册测试
echo "1. 运行用户注册测试..."
jmeter -n -t user-registration-test.jmx -l results/user-registration-results.jtl -e -o results/user-registration-report

# 运行订单创建测试
echo "2. 运行订单创建测试..."
jmeter -n -t order-creation-test.jmx -l results/order-creation-results.jtl -e -o results/order-creation-report

# 运行压力测试
echo "3. 运行高并发压力测试..."
jmeter -n -t stress-test.jmx -l results/stress-test-results.jtl -e -o results/stress-test-report

echo "所有测试完成！"
echo "测试报告位置:"
echo "- 用户注册测试: results/user-registration-report/index.html"
echo "- 订单创建测试: results/order-creation-report/index.html"
echo "- 压力测试: results/stress-test-report/index.html"

