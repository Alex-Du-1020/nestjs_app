-- 创建用户服务表

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建订单服务表

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    productId INT NOT NULL,
    productName VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    totalAmount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_userId (userId),
    INDEX idx_productId (productId),
    INDEX idx_status (status)
);

-- 创建库存服务表

CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    productId INT UNIQUE NOT NULL,
    productName VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    reservedQuantity INT NOT NULL DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_productId (productId)
);

-- 插入初始库存数据
INSERT INTO inventory (productId, productName, quantity, price) VALUES
(1, 'iPhone 15', 100, 999.99),
(2, 'Samsung Galaxy S24', 80, 899.99),
(3, 'MacBook Pro', 50, 1999.99),
(4, 'iPad Air', 120, 599.99),
(5, 'AirPods Pro', 200, 249.99)
ON DUPLICATE KEY UPDATE
productName = VALUES(productName),
quantity = VALUES(quantity),
price = VALUES(price);

