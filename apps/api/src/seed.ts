import { PrismaClient } from '@prisma/client';
import { hashPassword } from './utils/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create tenant first
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Grid Manager Demo',
      slug: 'demo',
      email: 'demo@gridmanager.com',
      phone: '+54 11 4555-0000',
      address: 'Buenos Aires, Argentina',
      plan: 'PRO',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created tenant');

  // Create branches
  const branch1 = await prisma.branch.create({
    data: {
      tenantId: tenant.id,
      name: 'Sucursal Centro',
      address: 'Av. Corrientes 1234, CABA',
      phone: '+54 11 4555-0001',
      email: 'centro@gridmanager.com',
    },
  });

  const branch2 = await prisma.branch.create({
    data: {
      tenantId: tenant.id,
      name: 'Sucursal Norte',
      address: 'Av. Cabildo 5678, CABA',
      phone: '+54 11 4555-0002',
      email: 'norte@gridmanager.com',
    },
  });

  console.log('✅ Created branches');

  // Create users
  const adminPassword = await hashPassword('admin123');
  const managerPassword = await hashPassword('manager123');
  const sellerPassword = await hashPassword('seller123');

  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@gridmanager.com',
      name: 'Admin Usuario',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const manager = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'manager@gridmanager.com',
      name: 'Manager Usuario',
      password: managerPassword,
      role: 'MANAGER',
      branchId: branch1.id,
    },
  });

  const seller1 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'vendedor1@gridmanager.com',
      name: 'Juan Pérez',
      password: sellerPassword,
      role: 'SELLER',
      branchId: branch1.id,
    },
  });

  const seller2 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'vendedor2@gridmanager.com',
      name: 'María García',
      password: sellerPassword,
      role: 'SELLER',
      branchId: branch2.id,
    },
  });

  const analyst = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'analista@gridmanager.com',
      name: 'Carlos López',
      password: await hashPassword('analyst123'),
      role: 'ANALYST',
      branchId: branch1.id,
    },
  });

  console.log('✅ Created users');

  // Create customers
  const customers = [
    {
      name: 'Empresa ABC S.A.',
      email: 'contacto@empresaabc.com',
      phone: '+54 11 4000-1000',
      address: 'Av. Libertador 1000, CABA',
      taxId: '30-12345678-9',
      creditLimit: 50000,
    },
    {
      name: 'Comercial XYZ Ltda.',
      email: 'ventas@comercialxyz.com',
      phone: '+54 11 4000-2000',
      address: 'San Martín 500, CABA',
      taxId: '30-87654321-0',
      creditLimit: 75000,
    },
    {
      name: 'Distribuidora Norte',
      email: 'admin@distribuidoranorte.com',
      phone: '+54 11 4000-3000',
      address: 'Av. Santa Fe 2500, CABA',
      taxId: '30-11111111-1',
      creditLimit: 100000,
    },
    {
      name: 'Servicios Integrales SA',
      email: 'info@serviciosintegrales.com',
      phone: '+54 11 4000-4000',
      address: 'Florida 800, CABA',
      taxId: '30-22222222-2',
      creditLimit: 25000,
    },
    {
      name: 'Tecnología Avanzada',
      email: 'contacto@tecnoavanzada.com',
      phone: '+54 11 4000-5000',
      address: 'Av. Callao 1200, CABA',
      taxId: '30-33333333-3',
      creditLimit: 150000,
    },
  ];

  for (const customerData of customers) {
    await prisma.customer.create({ data: customerData });
  }

  console.log('✅ Created customers');

  // Create suppliers
  const suppliers = [
    {
      name: 'Proveedor Tech S.A.',
      email: 'ventas@proveedortech.com',
      phone: '+54 11 5000-1000',
      address: 'Av. Córdoba 3000, CABA',
      taxId: '30-55555555-5',
    },
    {
      name: 'Importadora Global',
      email: 'compras@importadoraglobal.com',
      phone: '+54 11 5000-2000',
      address: 'Av. Rivadavia 4000, CABA',
      taxId: '30-66666666-6',
    },
    {
      name: 'Distribuidora Central',
      email: 'info@distribuidoracentral.com',
      phone: '+54 11 5000-3000',
      address: 'Av. 9 de Julio 1500, CABA',
      taxId: '30-77777777-7',
    },
  ];

  for (const supplierData of suppliers) {
    await prisma.supplier.create({ data: supplierData });
  }

  console.log('✅ Created suppliers');

  // Create products
  const products = [
    {
      sku: 'PROD-001',
      name: 'Notebook HP Pavilion 15',
      description: 'Intel i5, 8GB RAM, 256GB SSD',
      category: 'Informática',
      brand: 'HP',
      cost: 120000,
      basePrice: 180000,
      taxRate: 21,
      currentStock: 15,
      minStock: 5,
      unit: 'UNIDAD',
    },
    {
      sku: 'PROD-002',
      name: 'Mouse Logitech MX Master 3',
      description: 'Mouse inalámbrico ergonómico',
      category: 'Informática',
      brand: 'Logitech',
      cost: 15000,
      basePrice: 22500,
      taxRate: 21,
      currentStock: 50,
      minStock: 10,
      unit: 'UNIDAD',
    },
    {
      sku: 'PROD-003',
      name: 'Monitor Samsung 24" Full HD',
      description: 'Monitor LED 24 pulgadas',
      category: 'Informática',
      brand: 'Samsung',
      cost: 35000,
      basePrice: 52500,
      taxRate: 21,
      currentStock: 25,
      minStock: 8,
      unit: 'UNIDAD',
    },
    {
      sku: 'PROD-004',
      name: 'Teclado Mecánico Corsair K70',
      description: 'Teclado mecánico RGB',
      category: 'Informática',
      brand: 'Corsair',
      cost: 18000,
      basePrice: 27000,
      taxRate: 21,
      currentStock: 30,
      minStock: 5,
      unit: 'UNIDAD',
    },
    {
      sku: 'PROD-005',
      name: 'Smartphone Samsung Galaxy A54',
      description: '128GB, 6GB RAM, Triple Cámara',
      category: 'Celulares',
      brand: 'Samsung',
      cost: 80000,
      basePrice: 120000,
      taxRate: 21,
      currentStock: 20,
      minStock: 5,
      unit: 'UNIDAD',
    },
  ];

  for (const productData of products) {
    await prisma.product.create({ data: productData });
  }

  console.log('✅ Created products');

  // Create accounts
  const accounts = [
    {
      name: 'Caja Principal',
      type: 'CASH',
      currentBalance: 500000,
      currency: 'ARS' as const,
    },
    {
      name: 'Banco Nación CC',
      type: 'BANK',
      accountNumber: '12345678',
      currentBalance: 1200000,
      currency: 'ARS' as const,
    },
    {
      name: 'Banco Galicia USD',
      type: 'BANK',
      accountNumber: '87654321',
      currentBalance: 5000,
      currency: 'USD' as const,
    },
  ];

  for (const accountData of accounts) {
    await prisma.account.create({ data: accountData });
  }

  console.log('✅ Created accounts');

  // Create exchange rates for last 30 days
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const baseOfficial = 350 + Math.random() * 50;
    const baseBlue = 500 + Math.random() * 100;

    await prisma.exchangeRate.create({
      data: {
        currency: 'USD',
        officialRate: baseOfficial,
        blueRate: baseBlue,
        date: date,
      },
    });
  }

  console.log('✅ Created exchange rates');

  // Create onboarding tasks
  const tasks = [
    {
      title: 'Crear primer producto',
      description: 'Agregar al menos un producto al catálogo',
      userId: seller1.id,
    },
    {
      title: 'Registrar primer cliente',
      description: 'Crear el perfil del primer cliente',
      userId: seller1.id,
    },
    {
      title: 'Realizar primera venta',
      description: 'Completar la primera transacción',
      userId: seller1.id,
    },
    {
      title: 'Administrar colaboradores',
      description: 'Configurar roles y permisos del equipo',
      userId: manager.id,
    },
  ];

  for (const taskData of tasks) {
    await prisma.task.create({ data: taskData });
  }

  console.log('✅ Created tasks');

  // Create some sample sales
  const customerIds = await prisma.customer.findMany({ select: { id: true } });
  const productIds = await prisma.product.findMany({ select: { id: true, basePrice: true, taxRate: true } });

  for (let i = 0; i < 10; i++) {
    const customer = customerIds[Math.floor(Math.random() * customerIds.length)];
    const seller = Math.random() > 0.5 ? seller1 : seller2;
    const branch = seller.branchId === branch1.id ? branch1 : branch2;
    
    const saleDate = new Date();
    saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 30));
    
    const saleCount = await prisma.sale.count();
    const saleNumber = `VTA-${String(saleCount + 1).padStart(6, '0')}`;
    
    // Select 1-3 random products for this sale
    const numItems = Math.floor(Math.random() * 3) + 1;
    const selectedProducts = [];
    
    for (let j = 0; j < numItems; j++) {
      const product = productIds[Math.floor(Math.random() * productIds.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const unitPrice = Number(product.basePrice);
      const itemSubtotal = unitPrice * quantity;
      const itemTax = itemSubtotal * (Number(product.taxRate) / 100);
      
      selectedProducts.push({
        productId: product.id,
        quantity,
        unitPrice,
        total: itemSubtotal + itemTax,
      });
    }
    
    const subtotal = selectedProducts.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const taxes = selectedProducts.reduce((sum, item) => sum + (item.total - (item.unitPrice * item.quantity)), 0);
    const total = subtotal + taxes;
    
    await prisma.sale.create({
      data: {
        number: saleNumber,
        customerId: customer.id,
        sellerId: seller.id,
        branchId: branch.id,
        status: 'CONFIRMED',
        subtotal,
        taxes,
        total,
        currency: 'ARS',
        createdAt: saleDate,
        items: {
          create: selectedProducts,
        },
      },
    });
  }

  console.log('✅ Created sample sales');

  // Update customer balances based on sales
  const confirmedSales = await prisma.sale.findMany({
    where: { status: 'CONFIRMED' },
    select: { customerId: true, total: true },
  });

  const customerBalances = confirmedSales.reduce((acc, sale) => {
    if (!acc[sale.customerId]) {
      acc[sale.customerId] = 0;
    }
    acc[sale.customerId] += Number(sale.total);
    return acc;
  }, {} as Record<string, number>);

  for (const [customerId, balance] of Object.entries(customerBalances)) {
    await prisma.customer.update({
      where: { id: customerId },
      data: { currentBalance: balance },
    });
  }

  console.log('✅ Updated customer balances');

  console.log('🎉 Database seeding completed!');
  console.log('\n📊 Summary:');
  console.log(`- ${await prisma.branch.count()} branches`);
  console.log(`- ${await prisma.user.count()} users`);
  console.log(`- ${await prisma.customer.count()} customers`);
  console.log(`- ${await prisma.supplier.count()} suppliers`);
  console.log(`- ${await prisma.product.count()} products`);
  console.log(`- ${await prisma.account.count()} accounts`);
  console.log(`- ${await prisma.sale.count()} sales`);
  console.log(`- ${await prisma.task.count()} tasks`);
  console.log(`- ${await prisma.exchangeRate.count()} exchange rates`);
  
  console.log('\n🔐 Demo user credentials:');
  console.log('Admin: admin@gridmanager.com / admin123');
  console.log('Manager: manager@gridmanager.com / manager123');
  console.log('Seller: vendedor1@gridmanager.com / seller123');
  console.log('Analyst: analista@gridmanager.com / analyst123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });