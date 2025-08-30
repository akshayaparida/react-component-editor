import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/utils/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create default categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'ui-components' },
      update: {},
      create: {
        name: 'UI Components',
        slug: 'ui-components',
        description: 'User interface components like buttons, modals, forms',
        color: '#3B82F6'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'layout' },
      update: {},
      create: {
        name: 'Layout',
        slug: 'layout',
        description: 'Layout components like headers, sidebars, grids',
        color: '#10B981'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'data-display' },
      update: {},
      create: {
        name: 'Data Display',
        slug: 'data-display',
        description: 'Components for displaying data like tables, charts, lists',
        color: '#F59E0B'
      }
    })
  ])

  // Get or create development users
  let akshayaUser = await prisma.user.findUnique({ where: { email: 'akshaya@example.com' } })
  if (!akshayaUser) {
    try {
      akshayaUser = await prisma.user.create({
        data: {
          email: 'akshaya@example.com',
          username: 'akshaya-dev',
          name: 'Akshaya Parida',
          password: await hashPassword('Password123!')
        }
      })
    } catch (error) {
      // If username exists, try with current timestamp
      akshayaUser = await prisma.user.create({
        data: {
          email: 'akshaya@example.com',
          username: `akshaya-${Date.now()}`,
          name: 'Akshaya Parida',
          password: await hashPassword('Password123!')
        }
      })
    }
  }

  let demoUser = await prisma.user.findUnique({ where: { email: 'demo@example.com' } })
  if (!demoUser) {
    try {
      demoUser = await prisma.user.create({
        data: {
          email: 'demo@example.com',
          username: 'demo',
          name: 'Demo User',
          password: await hashPassword('Password123!')
        }
      })
    } catch (error) {
      // If username exists, try with current timestamp
      demoUser = await prisma.user.create({
        data: {
          email: 'demo@example.com',
          username: `demo-${Date.now()}`,
          name: 'Demo User',
          password: await hashPassword('Password123!')
        }
      })
    }
  }

  const users = [akshayaUser, demoUser]

  // Create sample components
  const sampleComponent = await prisma.component.upsert({
    where: { slug: 'sample-button' },
    update: {},
    create: {
      name: 'Sample Button',
      slug: 'sample-button',
      description: 'A beautiful, customizable button component',
      isPublic: true,
      isTemplate: false,
      tags: ['button', 'ui', 'interactive'],
      framework: 'react',
      language: 'typescript',
      authorId: users[0].id,
      categoryId: categories[0].id
    }
  })

  // Create initial version
  await prisma.componentVersion.upsert({
    where: { 
      componentId_version: {
        componentId: sampleComponent.id,
        version: '1.0.0'
      }
    },
    update: {},
    create: {
      componentId: sampleComponent.id,
      authorId: users[0].id,
      version: '1.0.0',
      changelog: 'Initial version',
      isStable: true,
      isLatest: true,
      jsxCode: `import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  onClick 
}: ButtonProps) {
  const baseClasses = 'font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button
      className={\`\${baseClasses} \${variantClasses[variant]} \${sizeClasses[size]} \${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }\`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}`,
      cssCode: `/* Custom button styles */
.button-custom {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.button-custom:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}`,
      dependencies: {
        'react': '^18.0.0',
        '@types/react': '^18.0.0'
      }
    }
  })

  console.log('✅ Database seeded successfully!')
  console.log(`📊 Created:`)
  console.log(`  - ${categories.length} categories`)
  console.log(`  - ${users.length} users`)
  console.log(`  - 1 sample component`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
