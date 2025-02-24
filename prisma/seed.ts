import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Clear existing data
    await prisma.$transaction([
      prisma.auditLog.deleteMany(),
      prisma.item.deleteMany(),
      prisma.customField.deleteMany(),
      prisma.category.deleteMany(),
      prisma.location.deleteMany(),
    ]);

    // Create Categories
    const categories = await prisma.$transaction([
      prisma.category.create({
        data: {
          id: 'cat_01',
          name: 'Electronics',
          description: 'Electronic devices and components',
        },
      }),
      prisma.category.create({
        data: {
          id: 'cat_02',
          name: 'Office Supplies',
          description: 'General office materials',
        },
      }),
      prisma.category.create({
        data: {
          id: 'cat_03',
          name: 'Tools',
          description: 'Hand and power tools',
        },
      }),
      prisma.category.create({
        data: {
          id: 'cat_04',
          name: 'Safety Equipment',
          description: 'Personal protective equipment',
        },
      }),
      prisma.category.create({
        data: {
          id: 'cat_05',
          name: 'Cleaning Supplies',
          description: 'Cleaning materials and equipment',
        },
      }),
    ]);

    // Create Custom Fields
    await prisma.$transaction([
      // Electronics custom fields
      prisma.customField.create({
        data: {
          id: 'cf_01',
          name: 'Voltage',
          type: 'number',
          required: true,
          options: [],
          categoryId: 'cat_01',
        },
      }),
      prisma.customField.create({
        data: {
          id: 'cf_02',
          name: 'Warranty Period',
          type: 'select',
          required: true,
          options: ['1 year', '2 years', '3 years', '5 years'],
          categoryId: 'cat_01',
        },
      }),
      // Office Supplies custom fields
      prisma.customField.create({
        data: {
          id: 'cf_03',
          name: 'Color',
          type: 'text',
          required: false,
          options: [],
          categoryId: 'cat_02',
        },
      }),
      prisma.customField.create({
        data: {
          id: 'cf_04',
          name: 'Unit Type',
          type: 'select',
          required: true,
          options: ['Box', 'Pack', 'Individual'],
          categoryId: 'cat_02',
        },
      }),
      // Tools custom fields
      prisma.customField.create({
        data: {
          id: 'cf_05',
          name: 'Tool Size',
          type: 'text',
          required: true,
          options: [],
          categoryId: 'cat_03',
        },
      }),
      prisma.customField.create({
        data: {
          id: 'cf_06',
          name: 'Power Type',
          type: 'select',
          required: true,
          options: ['Manual', 'Electric', 'Hydraulic', 'Pneumatic'],
          categoryId: 'cat_03',
        },
      }),
      // Safety Equipment custom fields
      prisma.customField.create({
        data: {
          id: 'cf_07',
          name: 'Size',
          type: 'select',
          required: true,
          options: ['S', 'M', 'L', 'XL', 'XXL'],
          categoryId: 'cat_04',
        },
      }),
      prisma.customField.create({
        data: {
          id: 'cf_08',
          name: 'Certification',
          type: 'text',
          required: true,
          options: [],
          categoryId: 'cat_04',
        },
      }),
      // Cleaning Supplies custom fields
      prisma.customField.create({
        data: {
          id: 'cf_09',
          name: 'Volume',
          type: 'number',
          required: true,
          options: [],
          categoryId: 'cat_05',
        },
      }),
      prisma.customField.create({
        data: {
          id: 'cf_10',
          name: 'Unit',
          type: 'select',
          required: true,
          options: ['Liters', 'Gallons', 'Pieces'],
          categoryId: 'cat_05',
        },
      }),
    ]);

    // Create Locations
    // First, create root locations
    const mainWarehouse = await prisma.location.create({
      data: {
        id: 'loc_01',
        name: 'Main Warehouse',
        description: 'Primary storage facility',
        path: '/',
        fullPath: '/Main Warehouse',
        level: 0,
      },
    });

    const secondaryWarehouse = await prisma.location.create({
      data: {
        id: 'loc_02',
        name: 'Secondary Warehouse',
        description: 'Auxiliary storage facility',
        path: '/',
        fullPath: '/Secondary Warehouse',
        level: 0,
      },
    });

    // Create zones in Main Warehouse
    const [zoneA, zoneB, zoneC] = await prisma.$transaction([
      prisma.location.create({
        data: {
          id: 'loc_03',
          name: 'Zone A',
          description: 'Electronics storage',
          parentId: mainWarehouse.id,
          path: '/loc_01/',
          fullPath: '/Main Warehouse/Zone A',
          level: 1,
        },
      }),
      prisma.location.create({
        data: {
          id: 'loc_04',
          name: 'Zone B',
          description: 'Office supplies storage',
          parentId: mainWarehouse.id,
          path: '/loc_01/',
          fullPath: '/Main Warehouse/Zone B',
          level: 1,
        },
      }),
      prisma.location.create({
        data: {
          id: 'loc_05',
          name: 'Zone C',
          description: 'Tools storage',
          parentId: mainWarehouse.id,
          path: '/loc_01/',
          fullPath: '/Main Warehouse/Zone C',
          level: 1,
        },
      }),
    ]);

    // Create sections in Zone A
    await prisma.$transaction([
      prisma.location.create({
        data: {
          id: 'loc_06',
          name: 'Section A1',
          description: 'Small electronics',
          parentId: zoneA.id,
          path: '/loc_01/loc_03/',
          fullPath: '/Main Warehouse/Zone A/Section A1',
          level: 2,
        },
      }),
      prisma.location.create({
        data: {
          id: 'loc_07',
          name: 'Section A2',
          description: 'Large electronics',
          parentId: zoneA.id,
          path: '/loc_01/loc_03/',
          fullPath: '/Main Warehouse/Zone A/Section A2',
          level: 2,
        },
      }),
    ]);

    // Create zones in Secondary Warehouse
    await prisma.$transaction([
      prisma.location.create({
        data: {
          id: 'loc_08',
          name: 'Safety Zone',
          description: 'Safety equipment storage',
          parentId: secondaryWarehouse.id,
          path: '/loc_02/',
          fullPath: '/Secondary Warehouse/Safety Zone',
          level: 1,
        },
      }),
      prisma.location.create({
        data: {
          id: 'loc_09',
          name: 'Cleaning Zone',
          description: 'Cleaning supplies storage',
          parentId: secondaryWarehouse.id,
          path: '/loc_02/',
          fullPath: '/Secondary Warehouse/Cleaning Zone',
          level: 1,
        },
      }),
    ]);

    // Create Items
    await prisma.$transaction([
      // Electronics Items
      prisma.item.create({
        data: {
          id: 'item_01',
          name: 'Laptop Charger',
          description: '65W USB-C Power Adapter',
          quantity: 25,
          categoryId: 'cat_01',
          locationId: 'loc_06',
          qrCode: 'QR_LAPTOP_CHARGER_01',
          customFields: {
            Voltage: 65,
            'Warranty Period': '2 years',
          },
        },
      }),
      prisma.item.create({
        data: {
          id: 'item_02',
          name: 'Monitor',
          description: '27" 4K Display',
          quantity: 10,
          categoryId: 'cat_01',
          locationId: 'loc_07',
          qrCode: 'QR_MONITOR_01',
          customFields: {
            Voltage: 110,
            'Warranty Period': '3 years',
          },
        },
      }),
      // Office Supplies Items
      prisma.item.create({
        data: {
          id: 'item_03',
          name: 'Printer Paper',
          description: 'A4 80gsm Paper',
          quantity: 50,
          categoryId: 'cat_02',
          locationId: 'loc_04',
          qrCode: 'QR_PAPER_01',
          customFields: {
            Color: 'White',
            'Unit Type': 'Box',
          },
        },
      }),
      prisma.item.create({
        data: {
          id: 'item_04',
          name: 'Staplers',
          description: 'Heavy Duty Staplers',
          quantity: 30,
          categoryId: 'cat_02',
          locationId: 'loc_04',
          qrCode: 'QR_STAPLER_01',
          customFields: {
            Color: 'Black',
            'Unit Type': 'Individual',
          },
        },
      }),
      // Tools Items
      prisma.item.create({
        data: {
          id: 'item_05',
          name: 'Power Drill',
          description: 'Cordless Power Drill 18V',
          quantity: 15,
          categoryId: 'cat_03',
          locationId: 'loc_05',
          qrCode: 'QR_DRILL_01',
          customFields: {
            'Tool Size': 'Medium',
            'Power Type': 'Electric',
          },
        },
      }),
      prisma.item.create({
        data: {
          id: 'item_06',
          name: 'Wrench Set',
          description: 'Metric Wrench Set',
          quantity: 20,
          categoryId: 'cat_03',
          locationId: 'loc_05',
          qrCode: 'QR_WRENCH_01',
          customFields: {
            'Tool Size': '10-22mm',
            'Power Type': 'Manual',
          },
        },
      }),
      // Safety Equipment Items
      prisma.item.create({
        data: {
          id: 'item_07',
          name: 'Safety Helmets',
          description: 'Hard Hats with Adjustable Strap',
          quantity: 40,
          categoryId: 'cat_04',
          locationId: 'loc_08',
          qrCode: 'QR_HELMET_01',
          customFields: {
            Size: 'L',
            Certification: 'ANSI Z89.1',
          },
        },
      }),
      prisma.item.create({
        data: {
          id: 'item_08',
          name: 'Safety Gloves',
          description: 'Cut Resistant Gloves',
          quantity: 100,
          categoryId: 'cat_04',
          locationId: 'loc_08',
          qrCode: 'QR_GLOVES_01',
          customFields: {
            Size: 'M',
            Certification: 'EN388',
          },
        },
      }),
      // Cleaning Supplies Items
      prisma.item.create({
        data: {
          id: 'item_09',
          name: 'Floor Cleaner',
          description: 'All-Purpose Floor Cleaner',
          quantity: 30,
          categoryId: 'cat_05',
          locationId: 'loc_09',
          qrCode: 'QR_CLEANER_01',
          customFields: {
            Volume: 5,
            Unit: 'Liters',
          },
        },
      }),
      prisma.item.create({
        data: {
          id: 'item_10',
          name: 'Paper Towels',
          description: 'Industrial Paper Towels',
          quantity: 60,
          categoryId: 'cat_05',
          locationId: 'loc_09',
          qrCode: 'QR_TOWELS_01',
          customFields: {
            Volume: 100,
            Unit: 'Pieces',
          },
        },
      }),
    ]);

    console.log('✅ Seed data inserted successfully');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ Error in seed script:', e);
    process.exit(1);
  }); 