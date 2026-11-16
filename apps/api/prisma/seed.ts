/**
 * Full demo seed — wipe DATA only, then fill all schemas.
 * Çalıştır: pnpm --filter api prisma:seed
 * Verify:  pnpm --filter api seed:verify
 *
 * Does NOT drop tables / migrations. Does NOT touch UI, Cloudflare, checkout code.
 */
import { PrismaClient } from '../src/generated/prisma';

import { BLOG_SEED_CATEGORIES, BLOG_SEED_POSTS } from './data/blog-posts';
import { seedCatalog } from './seed/catalog';
import { seedCommerce } from './seed/commerce';
import { DEMO_PASSWORD } from './seed/constants';
import { seedIdentity } from './seed/identity';
import { seedPersonaCompareScenario } from './seed/persona-compare';
import { seedCustomerReviews } from './seed/reviews';
import { wipeAllData } from './seed/wipe';

const prisma = new PrismaClient();

async function seedBlog(authorId: string) {
  const categoryIds = new Map<string, string>();

  for (const cat of BLOG_SEED_CATEGORIES) {
    const row = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
      },
    });
    categoryIds.set(cat.slug, row.id);
  }

  for (let index = 0; index < BLOG_SEED_POSTS.length; index++) {
    const post = BLOG_SEED_POSTS[index];
    const publishedAt = new Date();
    publishedAt.setDate(
      publishedAt.getDate() - (BLOG_SEED_POSTS.length - index),
    );

    const connect: { id: string }[] = [];
    for (const slug of post.categorySlugs) {
      const id = categoryIds.get(slug);
      if (id) connect.push({ id });
    }

    const created = await prisma.post.create({
      data: {
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        coverImage: post.coverImage,
        published: true,
        publishedAt,
        authorId,
        categories: { connect },
      },
    });

    if (index === 0) {
      await prisma.comment.create({
        data: {
          content: 'Harika bir rota özeti, teşekkürler!',
          authorId,
          postId: created.id,
        },
      });
    }
  }
}

async function main() {
  console.log('Seed: wiping data (tables kept)…');
  await wipeAllData(prisma);

  console.log('Seed: identity…');
  const identity = await seedIdentity(prisma);

  console.log('Seed: catalog…');
  const catalog = await seedCatalog(prisma, identity);

  console.log('Seed: blog…');
  await seedBlog(identity.admins[0].id);

  console.log('Seed: commerce…');
  await seedCommerce(prisma, identity, catalog);

  console.log('Seed: customer reviews…');
  const reviewStats = await seedCustomerReviews(prisma, identity, catalog);

  console.log('Seed: persona compare (Likya / Ege Akademi)…');
  const persona = await seedPersonaCompareScenario(prisma, identity);

  console.log('═══════════════════════════════════════');
  console.log('Seed OK');
  console.log(`  password: ${DEMO_PASSWORD}`);
  console.log(
    `  agencies: ${identity.agencies.length + persona.agencies.length}`,
  );
  console.log(`  tours: ${catalog.tours.length + persona.tours.length}`);
  console.log(`  experiences: ${catalog.experiences.length}`);
  console.log(
    `  reviews: tour ${reviewStats.tourReviews} · experience ${reviewStats.experienceReviews}`,
  );
  console.log(
    `  persona tours: ${persona.tours.map((t) => t.slug).join(', ')}`,
  );
  console.log(`  customers: customer01..05@demo.turta.com`);
  console.log(`  admins: admin01..05@demo.turta.com`);
  console.log(`  agency owners: owner01..05@agency.demo.turta.com`);
  console.log(`  guides: guide01..05@demo.turta.com`);
  console.log(`  bus: bus01..05@demo.turta.com`);
  console.log('  See docs/SEED_ACCOUNTS.md');
  console.log('═══════════════════════════════════════');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
