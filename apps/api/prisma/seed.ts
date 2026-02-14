import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const DEFAULT_REQUIREMENTS = [
  // Always required, expires=true
  { docType: 'ID_DOCUMENT', name: 'ID Document (Driver License OR California ID OR Passport)', expires: true, requiredRule: 'ALWAYS', evidenceType: 'UPLOAD_OR_LINK', appliesTo: 'BOTH' },
  { docType: 'TB_TEST', name: 'TB Test', expires: true, requiredRule: 'ALWAYS', evidenceType: 'UPLOAD_OR_LINK', appliesTo: 'BOTH' },
  { docType: 'HCA_REGISTRATION', name: 'HCA Registration', expires: true, requiredRule: 'ALWAYS', evidenceType: 'UPLOAD_OR_LINK', appliesTo: 'BOTH' },
  { docType: 'CALIFORNIA_REGISTRY', name: 'California Registry', expires: true, requiredRule: 'ALWAYS', evidenceType: 'UPLOAD_OR_LINK', appliesTo: 'BOTH' },
  { docType: 'SEXUAL_HARASSMENT_TRAINING', name: 'Sexual Harassment Training', expires: true, requiredRule: 'ALWAYS', evidenceType: 'UPLOAD_OR_LINK', appliesTo: 'BOTH' },
  { docType: 'ANNUAL_SAFETY_TRAINING', name: 'Annual Safety Training', expires: true, requiredRule: 'ALWAYS', evidenceType: 'UPLOAD_OR_LINK', appliesTo: 'BOTH' },
  // Conditional if is_driver=true, expires=true
  { docType: 'CAR_INSURANCE', name: 'Car Insurance', expires: true, requiredRule: 'IF_DRIVER', evidenceType: 'UPLOAD_OR_LINK', appliesTo: 'BOTH' },
  { docType: 'DMV_REPORT', name: 'DMV Report', expires: true, requiredRule: 'IF_DRIVER', evidenceType: 'UPLOAD_OR_LINK', appliesTo: 'BOTH' },
  // Always required, expires=false
  { docType: 'NEVVVON_ORIENTATION', name: 'NEVVVON Orientation', expires: false, requiredRule: 'ALWAYS', evidenceType: 'PDF', appliesTo: 'ONBOARDING' },
  { docType: 'IN_PERSON_ORIENTATION', name: 'In-Person Orientation', expires: false, requiredRule: 'ALWAYS', evidenceType: 'PDF', appliesTo: 'ONBOARDING' },
  { docType: 'E_VERIFY', name: 'E-Verify', expires: false, requiredRule: 'ALWAYS', evidenceType: 'PDF', appliesTo: 'ONBOARDING' },
  { docType: 'CAREGIVER_AGREEMENT', name: 'Caregiver Agreement', expires: false, requiredRule: 'ALWAYS', evidenceType: 'PDF', appliesTo: 'ONBOARDING' },
  { docType: 'POLICIES_AND_PROCEDURES', name: 'Policies and Procedures', expires: false, requiredRule: 'ALWAYS', evidenceType: 'PDF', appliesTo: 'ONBOARDING' },
];

async function main() {
  // Seed Plans
  const planNames = ['Free', 'Starter', 'Growth', 'Scale', 'Enterprise'];
  const planPrices = [0, 49, 99, 199, 399];
  let freePlan = await prisma.plan.findFirst({ where: { name: 'Free' } });
  if (!freePlan) {
    for (let i = 0; i < planNames.length; i++) {
      await prisma.plan.create({
        data: {
          name: planNames[i],
          priceMonthly: planPrices[i],
          isFree: planNames[i] === 'Free',
          isActive: true,
        },
      });
    }
    freePlan = await prisma.plan.findFirst({ where: { name: 'Free' } });
  }
  if (!freePlan) throw new Error('Free plan not found');

  // Create demo tenant
  let tenant = await prisma.tenant.findFirst({ where: { name: 'Demo Agency' } });
  if (!tenant) {
    tenant = await prisma.tenant.create({ data: { name: 'Demo Agency' } });
  }

  // Create TenantBilling with Free plan
  const existingBilling = await prisma.tenantBilling.findFirst({ where: { tenantId: tenant.id } });
  if (!existingBilling && freePlan) {
    await prisma.tenantBilling.create({
      data: { tenantId: tenant.id, planId: freePlan.id, status: 'FREE' },
    });
  }

  // Create demo admin user
  const passwordHash = await argon2.hash('demo1234', { type: argon2.argon2id });
  let user = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: 'admin@demo.carecommand.com' },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'admin@demo.carecommand.com',
        passwordHash,
        role: 'ADMIN',
        firstName: 'Demo',
        lastName: 'Admin',
      },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
  }

  // Create default requirement template for tenant
  let template = await prisma.requirementTemplate.findFirst({
    where: { tenantId: tenant.id, name: 'Default Requirements' },
  });
  if (!template) {
    template = await prisma.requirementTemplate.create({
      data: { tenantId: tenant.id, name: 'Default Requirements', isActive: true },
    });
    for (let i = 0; i < DEFAULT_REQUIREMENTS.length; i++) {
      const r = DEFAULT_REQUIREMENTS[i];
      await prisma.requirementTemplateItem.create({
        data: {
          tenantId: tenant.id,
          templateId: template.id,
          name: r.name,
          docType: r.docType,
          expires: r.expires,
          requiredRule: r.requiredRule,
          evidenceType: r.evidenceType,
          appliesTo: r.appliesTo,
          orderIndex: i,
        },
      });
    }
  }

  console.log('Seed complete:', { user: user.email, tenant: tenant.name });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
