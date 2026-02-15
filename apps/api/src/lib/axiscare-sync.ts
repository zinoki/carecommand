/**
 * AxisCare sync service - read-only sync from AxisCare to Care Command
 */
import { PrismaClient } from '@prisma/client';
import {
  getAxisCareBaseUrl,
  listApplicants,
  getApplicant,
  listCaregivers,
  getCaregiver,
  listClients,
  getClient,
  listClientResponsibleParties,
  listLeads,
  getLead,
  listLeadResponsibleParties,
} from './axiscare.js';

function extractString(obj: unknown, key: string): string {
  if (obj && typeof obj === 'object' && key in obj) {
    const v = (obj as Record<string, unknown>)[key];
    return v != null ? String(v) : '';
  }
  return '';
}

function extractOptionalString(obj: unknown, key: string): string | null {
  if (obj && typeof obj === 'object' && key in obj) {
    const v = (obj as Record<string, unknown>)[key];
    return v != null ? String(v) : null;
  }
  return null;
}

function extractId(obj: unknown): string {
  if (obj && typeof obj === 'object') {
    const o = obj as Record<string, unknown>;
    const v = o.id ?? o.Id ?? o.applicantId ?? o.caregiverId ?? o.clientId ?? o.leadId;
    return v != null ? String(v) : '';
  }
  return '';
}

export async function runAxisCareSync(
  prisma: PrismaClient,
  tenantId: string,
  siteNumber: string,
  apiToken: string
): Promise<{ applicants: number; caregivers: number; clients: number; leads: number }> {
  const baseUrl = getAxisCareBaseUrl(siteNumber);
  const stats = { applicants: 0, caregivers: 0, clients: 0, leads: 0 };

  // Sync Applicants
  const applicants = await listApplicants(baseUrl, apiToken);
  for (const item of applicants) {
    const id = extractId(item);
    if (!id) continue;
    try {
      const full = await getApplicant(baseUrl, apiToken, id);
      const rawData = full && typeof full === 'object' ? (full as object) : {};
      await prisma.applicant.upsert({
        where: {
          tenantId_axiscareApplicantId: { tenantId, axiscareApplicantId: id },
        },
        create: {
          tenantId,
          axiscareApplicantId: id,
          firstName: extractString(full, 'firstName') || extractString(full, 'FirstName') || 'Unknown',
          lastName: extractString(full, 'lastName') || extractString(full, 'LastName') || 'Unknown',
          email: extractOptionalString(full, 'email') ?? extractOptionalString(full, 'Email'),
          phone: extractOptionalString(full, 'phone') ?? extractOptionalString(full, 'Phone'),
          rawData: rawData as object,
        },
        update: {
          firstName: extractString(full, 'firstName') || extractString(full, 'FirstName') || 'Unknown',
          lastName: extractString(full, 'lastName') || extractString(full, 'LastName') || 'Unknown',
          email: extractOptionalString(full, 'email') ?? extractOptionalString(full, 'Email'),
          phone: extractOptionalString(full, 'phone') ?? extractOptionalString(full, 'Phone'),
          rawData: rawData as object,
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      stats.applicants++;
    } catch (e) {
      console.error(`[AxisCare sync] Failed to sync applicant ${id}:`, e);
    }
  }

  // Sync Caregivers -> Person + AxisCareMapping
  const caregivers = await listCaregivers(baseUrl, apiToken);
  for (const item of caregivers) {
    const id = extractId(item);
    if (!id) continue;
    try {
      const full = await getCaregiver(baseUrl, apiToken, id);
      const rawData = full && typeof full === 'object' ? (full as object) : {};
      const firstName = extractString(full, 'firstName') || extractString(full, 'FirstName') || 'Unknown';
      const lastName = extractString(full, 'lastName') || extractString(full, 'LastName') || 'Unknown';
      const email = extractOptionalString(full, 'email') ?? extractOptionalString(full, 'Email');
      const phone = extractOptionalString(full, 'phone') ?? extractOptionalString(full, 'Phone');

      const existing = await prisma.axisCareMapping.findFirst({
        where: { tenantId, axiscareCaregiverId: id },
        include: { person: true },
      });

      if (existing) {
        await prisma.person.update({
          where: { id: existing.personId },
          data: {
            firstName,
            lastName,
            email: email ?? undefined,
            phone: phone ?? undefined,
            axiscareCaregiverId: id,
            updatedAt: new Date(),
          },
        });
        await prisma.axisCareMapping.update({
          where: { id: existing.id },
          data: { lastSyncedAt: new Date(), updatedAt: new Date() },
        });
      } else {
        const person = await prisma.person.create({
          data: {
            tenantId,
            firstName,
            lastName,
            email: email ?? undefined,
            phone: phone ?? undefined,
            axiscareCaregiverId: id,
            eligibilityStatus: 'ELIGIBLE',
          },
        });
        await prisma.employmentEpisode.create({
          data: {
            tenantId,
            personId: person.id,
            episodeNumber: 1,
            lifecycleStatus: 'ACTIVE',
          },
        });
        await prisma.axisCareMapping.create({
          data: {
            tenantId,
            personId: person.id,
            axiscareCaregiverId: id,
            lastSyncedAt: new Date(),
          },
        });
      }
      stats.caregivers++;
    } catch (e) {
      console.error(`[AxisCare sync] Failed to sync caregiver ${id}:`, e);
    }
  }

  // Sync Clients (with responsible parties in rawData)
  const clients = await listClients(baseUrl, apiToken);
  for (const item of clients) {
    const id = extractId(item);
    if (!id) continue;
    try {
      const full = await getClient(baseUrl, apiToken, id);
      const rawData = full && typeof full === 'object' ? (full as object) : {};
      const rpList = await listClientResponsibleParties(baseUrl, apiToken, id);
      const enriched = { ...rawData, responsibleParties: rpList };

      await prisma.client.upsert({
        where: {
          tenantId_axiscareClientId: { tenantId, axiscareClientId: id },
        },
        create: {
          tenantId,
          axiscareClientId: id,
          firstName: extractString(full, 'firstName') || extractString(full, 'FirstName') || 'Unknown',
          lastName: extractString(full, 'lastName') || extractString(full, 'LastName') || 'Unknown',
          email: extractOptionalString(full, 'email') ?? extractOptionalString(full, 'Email'),
          phone: extractOptionalString(full, 'phone') ?? extractOptionalString(full, 'Phone'),
          address: extractOptionalString(full, 'address') ?? extractOptionalString(full, 'Address'),
          status: extractString(full, 'status') || extractString(full, 'Status') || 'Active',
          rawData: enriched as object,
        },
        update: {
          firstName: extractString(full, 'firstName') || extractString(full, 'FirstName') || 'Unknown',
          lastName: extractString(full, 'lastName') || extractString(full, 'LastName') || 'Unknown',
          email: extractOptionalString(full, 'email') ?? extractOptionalString(full, 'Email'),
          phone: extractOptionalString(full, 'phone') ?? extractOptionalString(full, 'Phone'),
          address: extractOptionalString(full, 'address') ?? extractOptionalString(full, 'Address'),
          status: extractString(full, 'status') || extractString(full, 'Status') || 'Active',
          rawData: enriched as object,
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      stats.clients++;
    } catch (e) {
      console.error(`[AxisCare sync] Failed to sync client ${id}:`, e);
    }
  }

  // Sync Leads (with responsible parties in rawData)
  const leads = await listLeads(baseUrl, apiToken);
  for (const item of leads) {
    const id = extractId(item);
    if (!id) continue;
    try {
      const full = await getLead(baseUrl, apiToken, id);
      const rawData = full && typeof full === 'object' ? (full as object) : {};
      const rpList = await listLeadResponsibleParties(baseUrl, apiToken, id);
      const enriched = { ...rawData, responsibleParties: rpList };

      await prisma.lead.upsert({
        where: {
          tenantId_axiscareLeadId: { tenantId, axiscareLeadId: id },
        },
        create: {
          tenantId,
          axiscareLeadId: id,
          firstName: extractString(full, 'firstName') || extractString(full, 'FirstName') || 'Unknown',
          lastName: extractString(full, 'lastName') || extractString(full, 'LastName') || 'Unknown',
          email: extractOptionalString(full, 'email') ?? extractOptionalString(full, 'Email'),
          phone: extractOptionalString(full, 'phone') ?? extractOptionalString(full, 'Phone'),
          rawData: enriched as object,
        },
        update: {
          firstName: extractString(full, 'firstName') || extractString(full, 'FirstName') || 'Unknown',
          lastName: extractString(full, 'lastName') || extractString(full, 'LastName') || 'Unknown',
          email: extractOptionalString(full, 'email') ?? extractOptionalString(full, 'Email'),
          phone: extractOptionalString(full, 'phone') ?? extractOptionalString(full, 'Phone'),
          rawData: enriched as object,
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      stats.leads++;
    } catch (e) {
      console.error(`[AxisCare sync] Failed to sync lead ${id}:`, e);
    }
  }

  return stats;
}
