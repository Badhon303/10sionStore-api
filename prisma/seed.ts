import { PrismaClient, Role, ProductStatus, OrderStatus, PaymentStatus, PlanType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Super Admin ───
  const adminHash = await bcrypt.hash('SuperAdmin123!', 12);
  const admin = await prisma.merchant.upsert({
    where: { email: 'admin@10sionstore.com' },
    create: {
      name: 'Super Admin',
      email: 'admin@10sionstore.com',
      phone: '01900000000',
      passwordHash: adminHash,
      role: Role.SUPER_ADMIN,
      isVerified: true,
      isActive: true,
    },
    update: {},
  });
  console.log('✅ Super Admin:', admin.email);

  // ─── Merchant ───
  const merchantHash = await bcrypt.hash('Admin123!', 12);
  const merchant = await prisma.merchant.upsert({
    where: { email: 'javed@store.com' },
    create: {
      name: 'Javed',
      email: 'javed@store.com',
      phone: '01712345678',
      passwordHash: merchantHash,
      role: Role.MERCHANT,
      isVerified: true,
      isActive: true,
    },
    update: {},
  });
  console.log('✅ Merchant:', merchant.email);

  // ─── Store Templates ───
  const templates = [
    {
      name: 'Electro Store',
      slug: 'electro-store',
      description: 'Modern electronics store template with product showcase, comparison, and COD checkout.',
      features: JSON.stringify([
        'Product catalog with categories',
        'Cash on Delivery checkout',
        'bKash & Nagad payment',
        'Order tracking',
        'Inventory management',
        'Mobile responsive design',
      ]),
      price: 5000,
      setupFee: 2000,
      monthlyFee: 500,
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Fashion Hub',
      slug: 'fashion-hub',
      description: 'Stylish fashion store with lookbook, size variants, and social media integration.',
      features: JSON.stringify([
        'Lookbook & product gallery',
        'Size & color variants',
        'Social media integration',
        'Wishlist feature',
        'Customer reviews',
        'Mobile responsive design',
        'WhatsApp ordering',
      ]),
      price: 7000,
      setupFee: 3000,
      monthlyFee: 700,
      thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd4d229?w=400',
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'Grocery Express',
      slug: 'grocery-express',
      description: 'Quick commerce grocery store with location-based delivery and subscription options.',
      features: JSON.stringify([
        'Location-based delivery',
        'Subscription orders',
        'Real-time stock updates',
        'Multi-vendor support',
        'Delivery slot booking',
        'Mobile responsive design',
        'WhatsApp ordering',
        'Loyalty points',
      ]),
      price: 10000,
      setupFee: 5000,
      monthlyFee: 1000,
      thumbnail: 'https://images.unsplash.com/photo-1542838132-25c2424d4c0d?w=400',
      isActive: true,
      sortOrder: 3,
    },
    {
      name: 'Universal Store',
      slug: 'universal-store',
      description: 'All-in-one e-commerce template with every feature you need to sell anything online.',
      features: JSON.stringify([
        'Everything in other templates',
        'Landing page builder',
        'Marketing campaigns',
        'Fraud detection',
        'Courier integration',
        'Analytics dashboard',
        'Employee management',
        'Custom domain support',
        'API access',
      ]),
      price: 15000,
      setupFee: 8000,
      monthlyFee: 1500,
      thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
      isActive: true,
      sortOrder: 4,
    },
  ];

  for (const t of templates) {
    await prisma.storeTemplate.upsert({
      where: { slug: t.slug },
      create: t as any,
      update: {},
    });
  }
  console.log('✅ Store Templates:', templates.length);

  // ─── Demo Store ───
  const electroTemplate = await prisma.storeTemplate.findUnique({ where: { slug: 'electro-store' } });
  
  const store = await prisma.store.upsert({
    where: { slug: '10sion-demo' },
    create: {
      merchantId: merchant.id,
      name: '10sion Demo Store',
      slug: '10sion-demo',
      description: 'Your one-stop shop for electronics, fashion, and home essentials.',
      currency: 'BDT',
      plan: PlanType.GROWTH,
      isActive: true,
      templateId: electroTemplate?.id,
    },
    update: {},
  });
  console.log('✅ Store:', store.name);

  // ─── Categories ───
  const categories = [
    { name: 'Electronics', slug: 'electronics', sortOrder: 1 },
    { name: 'Fashion', slug: 'fashion', sortOrder: 2 },
    { name: 'Home & Living', slug: 'home-living', sortOrder: 3 },
  ];

  const categoryMap: Record<string, string> = {};
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { storeId_slug: { storeId: store.id, slug: c.slug } },
      create: { ...c, storeId: store.id, isActive: true },
      update: {},
    });
    categoryMap[c.slug] = cat.id;
  }
  console.log('✅ Categories:', categories.length);

  // ─── Brands ───
  const brands = [
    { name: 'Samsung', slug: 'samsung' },
    { name: 'Apple', slug: 'apple' },
    { name: 'Local', slug: 'local' },
  ];

  const brandMap: Record<string, string> = {};
  for (const b of brands) {
    const brand = await prisma.brand.upsert({
      where: { storeId_slug: { storeId: store.id, slug: b.slug } },
      create: { ...b, storeId: store.id },
      update: {},
    });
    brandMap[b.slug] = brand.id;
  }
  console.log('✅ Brands:', brands.length);

  // ─── Products ───
  const products = [
    { name: 'Wireless Earbuds Pro', slug: 'wireless-earbuds-pro', sku: 'EB-001', categoryId: categoryMap.electronics, brandId: brandMap.samsung, regularPrice: 2500, salePrice: 1990, stockQty: 50, isFeatured: true, shortDescription: 'Premium wireless earbuds with noise cancellation.' },
    { name: 'Smart Watch Series 7', slug: 'smart-watch-series-7', sku: 'SW-001', categoryId: categoryMap.electronics, brandId: brandMap.apple, regularPrice: 12000, salePrice: 9990, stockQty: 25, isFeatured: true, shortDescription: 'Track fitness, heart rate, and notifications.' },
    { name: 'Bluetooth Speaker Mini', slug: 'bluetooth-speaker-mini', sku: 'BS-001', categoryId: categoryMap.electronics, brandId: brandMap.samsung, regularPrice: 1800, salePrice: 1450, stockQty: 80, isFeatured: false, shortDescription: 'Portable waterproof Bluetooth speaker.' },
    { name: 'Cotton T-Shirt Premium', slug: 'cotton-tshirt-premium', sku: 'TS-001', categoryId: categoryMap.fashion, brandId: brandMap.local, regularPrice: 650, salePrice: 450, stockQty: 200, isFeatured: true, shortDescription: '100% premium cotton t-shirt.' },
    { name: 'Denim Jacket Classic', slug: 'denim-jacket-classic', sku: 'DJ-001', categoryId: categoryMap.fashion, brandId: brandMap.local, regularPrice: 2200, salePrice: 1790, stockQty: 35, isFeatured: false, shortDescription: 'Classic blue denim jacket.' },
    { name: 'LED Desk Lamp', slug: 'led-desk-lamp', sku: 'DL-001', categoryId: categoryMap['home-living'], brandId: brandMap.local, regularPrice: 850, salePrice: 690, stockQty: 60, isFeatured: false, shortDescription: 'Adjustable LED desk lamp with USB charging.' },
    { name: 'Phone Case Clear', slug: 'phone-case-clear', sku: 'PC-001', categoryId: categoryMap.electronics, brandId: brandMap.local, regularPrice: 350, salePrice: 250, stockQty: 150, isFeatured: false, shortDescription: 'Crystal clear protective phone case.' },
    { name: 'Power Bank 20000mAh', slug: 'power-bank-20000mah', sku: 'PB-001', categoryId: categoryMap.electronics, brandId: brandMap.samsung, regularPrice: 2200, salePrice: 1790, stockQty: 40, isFeatured: true, shortDescription: 'Fast charging 20000mAh power bank.' },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { storeId_slug: { storeId: store.id, slug: p.slug } },
      create: {
        ...p,
        storeId: store.id,
        status: ProductStatus.ACTIVE,
      } as any,
      update: {},
    });
  }
  console.log('✅ Products:', products.length);

  // ─── Customers ───
  const customers = [
    { name: 'Rahim Ahmed', phone: '01711111111', address: 'House 12, Road 5, Dhanmondi', district: 'Dhaka', thana: 'Dhanmondi' },
    { name: 'Karim Hassan', phone: '01822222222', address: 'Flat A2, Gulshan 2', district: 'Dhaka', thana: 'Gulshan' },
    { name: 'Fatima Begum', phone: '01933333333', address: 'House 45, Banani', district: 'Dhaka', thana: 'Banani' },
    { name: 'Nadia Islam', phone: '01544444444', address: 'Road 7, Mirpur 10', district: 'Dhaka', thana: 'Mirpur' },
    { name: 'Sadia Rahman', phone: '01655555555', address: 'Sector 4, Uttara', district: 'Dhaka', thana: 'Uttara' },
  ];

  const customerMap: Record<string, string> = {};
  for (const c of customers) {
    const cust = await prisma.customer.upsert({
      where: { storeId_phone: { storeId: store.id, phone: c.phone } },
      create: { ...c, storeId: store.id },
      update: {},
    });
    customerMap[c.phone] = cust.id;
  }
  console.log('✅ Customers:', customers.length);

  // ─── Orders ───
  const allProducts = await prisma.product.findMany({ where: { storeId: store.id } });
  const orderStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELLED];
  const phones = Object.keys(customerMap);

  for (let i = 0; i < 12; i++) {
    const product = allProducts[i % allProducts.length];
    const qty = (i % 3) + 1;
    const subtotal = Number(product.salePrice ?? product.regularPrice) * qty;
    const shippingCharge = 60;
    const total = subtotal + shippingCharge;
    const phone = phones[i % phones.length];
    const customer = customers[i % customers.length];

    await prisma.order.create({
      data: {
        storeId: store.id,
        customerId: customerMap[phone],
        orderNumber: `ORX-10SION-DEMO-${String(i + 1).padStart(4, '0')}`,
        status: orderStatuses[i % orderStatuses.length],
        paymentStatus: i % 3 === 0 ? PaymentStatus.PAID : PaymentStatus.UNPAID,
        paymentMethod: i % 2 === 0 ? 'COD' : 'bKash',
        subtotal,
        discount: 0,
        shippingCharge,
        total,
        shippingName: customer.name,
        shippingPhone: customer.phone,
        shippingAddress: customer.address,
        shippingDistrict: customer.district,
        shippingThana: customer.thana,
        items: {
          create: [
            {
              productId: product.id,
              productName: product.name,
              quantity: qty,
              price: Number(product.salePrice ?? product.regularPrice),
              total: subtotal,
            },
          ],
        },
      },
    });
  }
  console.log('✅ Orders: 12');

  // ─── Coupons ───
  await prisma.coupon.upsert({
    where: { storeId_code: { storeId: store.id, code: 'WELCOME10' } },
    create: { storeId: store.id, code: 'WELCOME10', type: 'PERCENTAGE', value: 10, minOrderAmount: 0, usageLimit: 100, usedCount: 0, isActive: true, startsAt: new Date(), expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
    update: {},
  });
  await prisma.coupon.upsert({
    where: { storeId_code: { storeId: store.id, code: 'FLAT50' } },
    create: { storeId: store.id, code: 'FLAT50', type: 'FIXED', value: 50, minOrderAmount: 500, usageLimit: 200, usedCount: 0, isActive: true, startsAt: new Date(), expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
    update: {},
  });
  console.log('✅ Coupons: 2');

  // ─── Notifications ───
  await prisma.notification.create({
    data: { storeId: store.id, type: 'NEW_ORDER', title: 'New order received', body: 'Order #ORX-10SION-DEMO-0001 received', isRead: false },
  }).catch(() => {});
  await prisma.notification.create({
    data: { storeId: store.id, type: 'LOW_STOCK', title: 'Low stock alert', body: 'Smart Watch Series 7 has only 25 units left', isRead: false },
  }).catch(() => {});
  console.log('✅ Notifications: 2');

  // ─── Sample Store Request ───
  const fashionTemplate = await prisma.storeTemplate.findUnique({ where: { slug: 'fashion-hub' } });
  if (fashionTemplate) {
    await prisma.storeRequest.create({
      data: {
        templateId: fashionTemplate.id,
        clientName: 'Rakib Ahmed',
        clientEmail: 'rakib@example.com',
        clientPhone: '01799999999',
        businessName: 'Rakib Fashion House',
        businessType: 'Fashion & Clothing',
        notes: 'Need a fashion store with WhatsApp ordering and size variants.',
        status: 'PENDING',
      },
    }).catch(() => {});
    console.log('✅ Sample Store Request: 1');
  }

  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Login Credentials:');
  console.log('   Super Admin: admin@10sionstore.com / SuperAdmin123!');
  console.log('   Merchant:    javed@store.com / Admin123!');
  console.log('   Store URL:   /store/10sion-demo');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
