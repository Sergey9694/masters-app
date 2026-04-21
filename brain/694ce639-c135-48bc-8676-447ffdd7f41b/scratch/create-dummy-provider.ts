import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Get first category
  const category = await prisma.category.findFirst();
  if (!category) {
    console.error('No categories found. Run seed first.');
    return;
  }

  // 2. Create user
  const user = await prisma.user.create({
    data: {
      firstName: 'Алексей',
      lastName: 'Мастер',
      displayName: 'Алексей (Ремонт под ключ)',
      role: 'PROVIDER',
      email: `test-master-${Date.now()}@example.com`,
      authProvider: 'EMAIL',
    }
  });

  // 3. Create provider profile (unverified)
  const profile = await prisma.providerProfile.create({
    data: {
      userId: user.id,
      bio: 'Занимаюсь ремонтом квартир более 10 лет. Электрика, сантехника, отделка. Делаю быстро и качественно. Есть свой инструмент и машина.',
      experienceYears: 12,
      minPrice: 1500,
      isVerified: false,
      portfolio: [
        'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=400',
        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400'
      ],
      categories: {
        create: {
          categoryId: category.id
        }
      }
    }
  });

  console.log(`Created dummy provider: ${user.firstName} ${user.lastName} (ID: ${profile.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
