import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function seedPlatformStaff() {
  const email = process.env.PLATFORM_OWNER_EMAIL || 'esthersyombua2016@gmail.com'
  const password = process.env.PLATFORM_OWNER_PASSWORD

  if (!password) {
    console.warn('[seed] PLATFORM_OWNER_PASSWORD not set — skipping platform owner seed. Set it and re-run to create the account.')
    return
  }

  const existing = await prisma.platformStaff.findUnique({ where: { email } })
  if (existing) {
    console.log('[seed] Platform owner already exists, skipping')
    return
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  await prisma.platformStaff.create({
    data: {
      email,
      password: hashedPassword,
      name: process.env.PLATFORM_OWNER_NAME || 'Platform Owner',
      role: 'OWNER',
    },
  })
  console.log(`[seed] Platform owner created: ${email}`)
}

async function seedPlans() {
  const plans = [
    { name: 'Basic', slug: 'basic', maxBranches: 0 },
    { name: 'Standard', slug: 'standard', maxBranches: 3 },
    { name: 'Growth', slug: 'growth', maxBranches: 6 },
    { name: 'Enterprise', slug: 'enterprise', maxBranches: 10 },
  ]

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: plan,
    })
  }
  console.log('[seed] Plans seeded')
}

async function main() {
  await seedPlatformStaff()
  await seedPlans()

  const groups = [
    { name: 'Youth Ministry', description: 'Empowering the next generation', accent: '#F59E0B' },
    { name: 'Worship Team', description: 'Leading hearts into worship', accent: '#8B5CF6' },
    { name: 'Media Team', description: 'Capturing and sharing God\'s glory', accent: '#10B981' },
    { name: 'Men Fellowship', description: 'Brothers standing firm in faith', accent: '#1B3A7A' },
    { name: 'Women Fellowship', description: 'Women of valor, grace and strength', accent: '#EC4899' },
    { name: 'Children Ministry', description: 'Nurturing young hearts for Christ', accent: '#F97316' },
  ]
  
  for (const group of groups) {
    await prisma.ministryGroup.upsert({
      where: { name: group.name } as any,
      update: {},
      create: group,
    })
  }
  console.log('Ministry groups seeded')
}

main().catch(console.error).finally(() => prisma.$disconnect())