import { prisma } from '../lib/prisma.js';

export async function createPersonRequirementsForOnboarding(
  employmentEpisodeId: string,
  tenantId: string
) {
  const template = await prisma.requirementTemplate.findFirst({
    where: { tenantId, isActive: true },
    include: { items: { orderBy: { orderIndex: 'asc' } } },
  });
  if (!template?.items.length) return;

  for (const item of template.items) {
    await prisma.personRequirement.upsert({
      where: {
        employmentEpisodeId_templateItemId: { employmentEpisodeId, templateItemId: item.id },
      },
      create: {
        tenantId,
        employmentEpisodeId,
        templateItemId: item.id,
        status: 'MISSING',
        dueAt: null,
      },
      update: {},
    });
  }
}

export async function isOnboardingComplete(employmentEpisodeId: string): Promise<boolean> {
  const requirements = await prisma.personRequirement.findMany({
    where: { employmentEpisodeId },
    include: { templateItem: true },
  });
  const required = requirements.filter((r) => r.templateItem.requiredRule === 'ALWAYS');
  return required.every((r) => r.status === 'VERIFIED');
}
