import { PrismaClient, ProductCategory, AvailabilityStatus, UserRole, Permission } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@pipesupply.com' },
    update: {},
    create: {
      email: 'admin@pipesupply.com',
      name: 'System Administrator',
      role: UserRole.ADMIN,
      permissions: [
        Permission.MANAGE_PRODUCTS,
        Permission.MANAGE_QUOTES,
        Permission.MANAGE_USERS,
        Permission.MANAGE_MEDIA,
        Permission.VIEW_ANALYTICS,
      ],
    },
  })

  // Create content manager user
  const contentManager = await prisma.user.upsert({
    where: { email: 'manager@pipesupply.com' },
    update: {},
    create: {
      email: 'manager@pipesupply.com',
      name: 'Content Manager',
      role: UserRole.CONTENT_MANAGER,
      permissions: [
        Permission.MANAGE_PRODUCTS,
        Permission.MANAGE_MEDIA,
        Permission.VIEW_ANALYTICS,
      ],
    },
  })

  // Create sample products
  const sampleProducts = [
    {
      name: 'Steel Pipe 2" x 10ft',
      description: 'High-quality steel pipe suitable for industrial applications',
      category: ProductCategory.STEEL_PIPE,
      brand: 'Industrial Steel Co.',
      diameter: '2 inches',
      length: '10 feet',
      material: 'Carbon Steel',
      pressureRating: '150 PSI',
      temperature: '-20°F to 400°F',
      standards: ['ASTM A53', 'API 5L'],
      applications: ['Water supply', 'Gas distribution', 'Industrial piping'],
      basePrice: 45.99,
      currency: 'USD',
      pricePerUnit: 'per foot',
      availability: AvailabilityStatus.IN_STOCK,
    },
    {
      name: 'PVC Pipe 4" x 20ft',
      description: 'Durable PVC pipe for residential and commercial use',
      category: ProductCategory.PVC_PIPE,
      brand: 'PlastiFlow',
      diameter: '4 inches',
      length: '20 feet',
      material: 'PVC',
      pressureRating: '200 PSI',
      temperature: '32°F to 140°F',
      standards: ['ASTM D1785', 'NSF 61'],
      applications: ['Drainage', 'Sewer systems', 'Irrigation'],
      basePrice: 28.50,
      currency: 'USD',
      pricePerUnit: 'per foot',
      availability: AvailabilityStatus.IN_STOCK,
    },
    {
      name: 'Copper Pipe 1" x 8ft',
      description: 'Premium copper pipe for plumbing applications',
      category: ProductCategory.COPPER_PIPE,
      brand: 'CopperMax',
      diameter: '1 inch',
      length: '8 feet',
      material: 'Type L Copper',
      pressureRating: '300 PSI',
      temperature: '-100°F to 250°F',
      standards: ['ASTM B88', 'NSF 61'],
      applications: ['Potable water', 'HVAC', 'Medical gas'],
      basePrice: 67.25,
      currency: 'USD',
      pricePerUnit: 'per foot',
      availability: AvailabilityStatus.LOW_STOCK,
    },
  ]

  for (const productData of sampleProducts) {
    // Check if product already exists
    const existingProduct = await prisma.product.findFirst({
      where: { name: productData.name }
    })

    if (!existingProduct) {
      const product = await prisma.product.create({
        data: {
          ...productData,
          bulkDiscounts: {
            create: [
              { minQuantity: 10, discount: 0.05 }, // 5% discount for 10+ items
              { minQuantity: 50, discount: 0.10 }, // 10% discount for 50+ items
              { minQuantity: 100, discount: 0.15 }, // 15% discount for 100+ items
            ],
          },
        },
      })

      console.log(`✅ Created product: ${product.name}`)
    } else {
      console.log(`⏭️  Product already exists: ${existingProduct.name}`)
    }
  }

  // Create sample media files
  const sampleMedia = [
    {
      filename: 'steel-pipe-catalog.pdf',
      originalName: 'Steel Pipe Product Catalog.pdf',
      url: '/media/documents/steel-pipe-catalog.pdf',
      mimeType: 'application/pdf',
      size: 2048576, // 2MB
      type: 'DOCUMENT' as const,
    },
    {
      filename: 'pvc-pipe-image.jpg',
      originalName: 'PVC Pipe Product Image.jpg',
      url: '/media/images/pvc-pipe-image.jpg',
      mimeType: 'image/jpeg',
      size: 512000, // 500KB
      type: 'IMAGE' as const,
    },
  ]

  for (const mediaData of sampleMedia) {
    // Check if media already exists
    const existingMedia = await prisma.media.findFirst({
      where: { filename: mediaData.filename }
    })

    if (!existingMedia) {
      const media = await prisma.media.create({
        data: mediaData,
      })

      console.log(`✅ Created media: ${media.filename}`)
    } else {
      console.log(`⏭️  Media already exists: ${existingMedia.filename}`)
    }
  }

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })