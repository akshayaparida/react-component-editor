import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const seedCategories = [
  {
    name: 'UI Components',
    slug: 'ui-components',
    description: 'Basic user interface components like buttons, inputs, and modals',
    color: '#3B82F6',
    icon: 'layers',
  },
  {
    name: 'Navigation',
    slug: 'navigation',
    description: 'Navigation components including menus, breadcrumbs, and sidebars',
    color: '#10B981',
    icon: 'navigation',
  },
  {
    name: 'Data Display',
    slug: 'data-display',
    description: 'Components for displaying data like tables, lists, and cards',
    color: '#8B5CF6',
    icon: 'database',
  },
  {
    name: 'Forms',
    slug: 'forms',
    description: 'Form-related components including inputs, selects, and validators',
    color: '#F59E0B',
    icon: 'edit',
  },
  {
    name: 'Layout',
    slug: 'layout',
    description: 'Layout components like grids, containers, and responsive helpers',
    color: '#EF4444',
    icon: 'layout',
  },
  {
    name: 'Charts & Graphs',
    slug: 'charts-graphs',
    description: 'Data visualization components including charts, graphs, and indicators',
    color: '#06B6D4',
    icon: 'bar-chart',
  },
  {
    name: 'Media',
    slug: 'media',
    description: 'Media-related components like image galleries, video players, and carousels',
    color: '#EC4899',
    icon: 'image',
  },
  {
    name: 'Utility',
    slug: 'utility',
    description: 'Utility components including loading spinners, tooltips, and helpers',
    color: '#6B7280',
    icon: 'tool',
  },
  {
    name: 'E-commerce',
    slug: 'ecommerce',
    description: 'E-commerce specific components like product cards, shopping carts, and payment forms',
    color: '#059669',
    icon: 'shopping-cart',
  },
  {
    name: 'Social',
    slug: 'social',
    description: 'Social media components including share buttons, comment sections, and feeds',
    color: '#DC2626',
    icon: 'users',
  },
];

async function seedCategoriesData() {
  console.log('🌱 Starting category seeding...');

  try {
    // Clear existing categories
    console.log('🗑️  Clearing existing categories...');
    await prisma.category.deleteMany();

    // Create categories
    console.log('📝 Creating categories...');
    const createdCategories = await prisma.category.createMany({
      data: seedCategories,
    });

    console.log(`✅ Successfully created ${createdCategories.count} categories`);

    // Fetch and display created categories
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            components: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log('📋 Created categories:');
    categories.forEach(category => {
      console.log(`  - ${category.name} (${category.slug}) - ${category.color} - ${category.icon}`);
    });

    return categories;
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedCategoriesData();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  main();
}

export { seedCategoriesData };
