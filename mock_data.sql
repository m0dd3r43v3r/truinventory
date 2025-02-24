-- Mock Data for TruInventory

-- Categories
INSERT INTO "Category" (id, name, description, "createdAt", "updatedAt") VALUES
('cat_01', 'Electronics', 'Electronic devices and components', NOW(), NOW()),
('cat_02', 'Office Supplies', 'General office materials', NOW(), NOW()),
('cat_03', 'Tools', 'Hand and power tools', NOW(), NOW()),
('cat_04', 'Safety Equipment', 'Personal protective equipment', NOW(), NOW()),
('cat_05', 'Cleaning Supplies', 'Cleaning materials and equipment', NOW(), NOW());

-- Custom Fields
INSERT INTO "CustomField" (id, name, type, required, options, "categoryId", "createdAt", "updatedAt") VALUES
-- Electronics custom fields
('cf_01', 'Voltage', 'number', true, '{}', 'cat_01', NOW(), NOW()),
('cf_02', 'Warranty Period', 'select', true, '{"1 year","2 years","3 years","5 years"}', 'cat_01', NOW(), NOW()),
-- Office Supplies custom fields
('cf_03', 'Color', 'text', false, '{}', 'cat_02', NOW(), NOW()),
('cf_04', 'Unit Type', 'select', true, '{"Box","Pack","Individual"}', 'cat_02', NOW(), NOW()),
-- Tools custom fields
('cf_05', 'Tool Size', 'text', true, '{}', 'cat_03', NOW(), NOW()),
('cf_06', 'Power Type', 'select', true, '{"Manual","Electric","Hydraulic","Pneumatic"}', 'cat_03', NOW(), NOW()),
-- Safety Equipment custom fields
('cf_07', 'Size', 'select', true, '{"S","M","L","XL","XXL"}', 'cat_04', NOW(), NOW()),
('cf_08', 'Certification', 'text', true, '{}', 'cat_04', NOW(), NOW()),
-- Cleaning Supplies custom fields
('cf_09', 'Volume', 'number', true, '{}', 'cat_05', NOW(), NOW()),
('cf_10', 'Unit', 'select', true, '{"Liters","Gallons","Pieces"}', 'cat_05', NOW(), NOW());

-- Locations (Hierarchical Structure)
INSERT INTO "Location" (id, name, description, "parentId", path, "fullPath", level, "createdAt", "updatedAt") VALUES
-- Main Warehouses (Level 0)
('loc_01', 'Main Warehouse', 'Primary storage facility', NULL, '/', '/Main Warehouse', 0, NOW(), NOW()),
('loc_02', 'Secondary Warehouse', 'Auxiliary storage facility', NULL, '/', '/Secondary Warehouse', 0, NOW(), NOW()),

-- Zones in Main Warehouse (Level 1)
('loc_03', 'Zone A', 'Electronics storage', 'loc_01', '/loc_01/', '/Main Warehouse/Zone A', 1, NOW(), NOW()),
('loc_04', 'Zone B', 'Office supplies storage', 'loc_01', '/loc_01/', '/Main Warehouse/Zone B', 1, NOW(), NOW()),
('loc_05', 'Zone C', 'Tools storage', 'loc_01', '/loc_01/', '/Main Warehouse/Zone C', 1, NOW(), NOW()),

-- Sections in Zone A (Level 2)
('loc_06', 'Section A1', 'Small electronics', 'loc_03', '/loc_01/loc_03/', '/Main Warehouse/Zone A/Section A1', 2, NOW(), NOW()),
('loc_07', 'Section A2', 'Large electronics', 'loc_03', '/loc_01/loc_03/', '/Main Warehouse/Zone A/Section A2', 2, NOW(), NOW()),

-- Sections in Secondary Warehouse (Level 1)
('loc_08', 'Safety Zone', 'Safety equipment storage', 'loc_02', '/loc_02/', '/Secondary Warehouse/Safety Zone', 1, NOW(), NOW()),
('loc_09', 'Cleaning Zone', 'Cleaning supplies storage', 'loc_02', '/loc_02/', '/Secondary Warehouse/Cleaning Zone', 1, NOW(), NOW());

-- Items
INSERT INTO "Item" (id, name, description, quantity, "categoryId", "locationId", "qrCode", "customFields", "createdAt", "updatedAt") VALUES
-- Electronics Items
('item_01', 'Laptop Charger', '65W USB-C Power Adapter', 25, 'cat_01', 'loc_06', 'QR_LAPTOP_CHARGER_01', '{"Voltage": 65, "Warranty Period": "2 years"}', NOW(), NOW()),
('item_02', 'Monitor', '27" 4K Display', 10, 'cat_01', 'loc_07', 'QR_MONITOR_01', '{"Voltage": 110, "Warranty Period": "3 years"}', NOW(), NOW()),

-- Office Supplies Items
('item_03', 'Printer Paper', 'A4 80gsm Paper', 50, 'cat_02', 'loc_04', 'QR_PAPER_01', '{"Color": "White", "Unit Type": "Box"}', NOW(), NOW()),
('item_04', 'Staplers', 'Heavy Duty Staplers', 30, 'cat_02', 'loc_04', 'QR_STAPLER_01', '{"Color": "Black", "Unit Type": "Individual"}', NOW(), NOW()),

-- Tools Items
('item_05', 'Power Drill', 'Cordless Power Drill 18V', 15, 'cat_03', 'loc_05', 'QR_DRILL_01', '{"Tool Size": "Medium", "Power Type": "Electric"}', NOW(), NOW()),
('item_06', 'Wrench Set', 'Metric Wrench Set', 20, 'cat_03', 'loc_05', 'QR_WRENCH_01', '{"Tool Size": "10-22mm", "Power Type": "Manual"}', NOW(), NOW()),

-- Safety Equipment Items
('item_07', 'Safety Helmets', 'Hard Hats with Adjustable Strap', 40, 'cat_04', 'loc_08', 'QR_HELMET_01', '{"Size": "L", "Certification": "ANSI Z89.1"}', NOW(), NOW()),
('item_08', 'Safety Gloves', 'Cut Resistant Gloves', 100, 'cat_04', 'loc_08', 'QR_GLOVES_01', '{"Size": "M", "Certification": "EN388"}', NOW(), NOW()),

-- Cleaning Supplies Items
('item_09', 'Floor Cleaner', 'All-Purpose Floor Cleaner', 30, 'cat_05', 'loc_09', 'QR_CLEANER_01', '{"Volume": 5, "Unit": "Liters"}', NOW(), NOW()),
('item_10', 'Paper Towels', 'Industrial Paper Towels', 60, 'cat_05', 'loc_09', 'QR_TOWELS_01', '{"Volume": 100, "Unit": "Pieces"}', NOW(), NOW());

-- Audit Logs (Sample entries for various actions)
INSERT INTO "AuditLog" (id, action, "userId", "itemId", details, "createdAt") VALUES
('log_01', 'CREATE', 'user_id_placeholder', 'item_01', '{"type": "ITEM_CREATED", "quantity": 25, "timestamp": "2024-03-01T10:00:00Z"}', NOW()),
('log_02', 'UPDATE', 'user_id_placeholder', 'item_02', '{"type": "QUANTITY_UPDATED", "old": 8, "new": 10, "timestamp": "2024-03-01T11:30:00Z"}', NOW()),
('log_03', 'CREATE', 'user_id_placeholder', 'item_03', '{"type": "ITEM_CREATED", "quantity": 50, "timestamp": "2024-03-01T13:15:00Z"}', NOW()),
('log_04', 'UPDATE', 'user_id_placeholder', 'item_04', '{"type": "LOCATION_CHANGED", "old": "loc_03", "new": "loc_04", "timestamp": "2024-03-01T14:45:00Z"}', NOW()),
('log_05', 'CREATE', 'user_id_placeholder', 'item_05', '{"type": "ITEM_CREATED", "quantity": 15, "timestamp": "2024-03-01T16:20:00Z"}', NOW());

-- Note: Replace 'user_id_placeholder' with actual user IDs when inserting audit logs
-- The timestamps in the mock data use NOW() for demonstration. In a real scenario, you might want to use specific dates 