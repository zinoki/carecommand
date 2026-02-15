/**
 * AxisCare sync service - read-only sync from AxisCare to Care Command
 */
import { PrismaClient } from '@prisma/client';
import {
  getAxisCareBaseUrl,
  listApplicants,
  listCaregivers,
  listClients,
  listClientResponsibleParties,
  listLeads,
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

/** AxisCare uses contactEmail; also check email/Email */
function extractEmail(obj: unknown): string | null {
  return (
    extractOptionalString(obj, 'contactEmail') ??
    extractOptionalString(obj, 'email') ??
    extractOptionalString(obj, 'Email')
  );
}

/** AxisCare uses mobilePhone, homePhone, otherPhone; also check phone/Phone */
function extractPhone(obj: unknown): string | null {
  return (
    extractOptionalString(obj, 'mobilePhone') ??
    extractOptionalString(obj, 'homePhone') ??
    extractOptionalString(obj, 'otherPhone') ??
    extractOptionalString(obj, 'phone') ??
    extractOptionalString(obj, 'Phone')
  );
}

/** Map AxisCare status.label to Care Command lifecycleStatus for Caregivers page tabs */
function mapAxisCareStatusToLifecycle(obj: unknown): string {
  const status = obj && typeof obj === 'object' && 'status' in obj
    ? (obj as Record<string, unknown>).status
    : null;
  const label = status && typeof status === 'object' && status !== null && 'label' in status
    ? String((status as Record<string, unknown>).label)
    : '';
  if (label === 'Active') return 'Active';
  if (label === 'On Hold') return 'Ineligible';
  return 'Other'; // Inactive, Eligible For Rehire, In-Eligible For Rehire, etc.
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

  // Sync Applicants -> Person with axisCareLifecycleStage='applicant'
  const applicants = await listApplicants(baseUrl, apiToken);
  for (const item of applicants) {
    const id = extractId(item);
    if (!id) continue;
    try {
      const rawData = item && typeof item === 'object' ? (item as object) : {};
      const firstName = extractString(item, 'firstName') || extractString(item, 'FirstName') || 'Unknown';
      const lastName = extractString(item, 'lastName') || extractString(item, 'LastName') || 'Unknown';
      const email = extractEmail(item) ?? extractOptionalString(item, 'email') ?? extractOptionalString(item, 'Email');
      const phone = extractPhone(item) ?? extractOptionalString(item, 'phone') ?? extractOptionalString(item, 'Phone');

      await prisma.caregiver.upsert({
        where: {
          tenantId_axisCareId: { tenantId, axisCareId: id },
        },
        create: {
          tenantId,
          firstName,
          lastName,
          email: email ?? undefined,
          phone: phone ?? undefined,
          axisCareId: id,
          axisCareLifecycleStage: 'applicant',
          axisCareRawData: rawData as object,
          axisCareLastSyncedAt: new Date(),
          eligibilityStatus: 'ELIGIBLE',
        },
        update: {
          firstName,
          lastName,
          email: email ?? undefined,
          phone: phone ?? undefined,
          axisCareLifecycleStage: 'applicant',
          axisCareRawData: rawData as object,
          axisCareLastSyncedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      stats.applicants++;
    } catch (e) {
      console.error(`[AxisCare sync] Failed to sync applicant ${id}:`, e);
    }
  }

  // Sync Caregivers -> Person + AxisCareMapping (list contains full data, use contactEmail/mobilePhone)
  const caregivers = await listCaregivers(baseUrl, apiToken);
  for (const item of caregivers) {
    const id = extractId(item);
    if (!id) continue;
    try {
      const rawData = item && typeof item === 'object' ? (item as object) : {};
      const firstName = extractString(item, 'firstName') || extractString(item, 'FirstName') || 'Unknown';
      const lastName = extractString(item, 'lastName') || extractString(item, 'LastName') || 'Unknown';
      const email = extractEmail(item);
      const phone = extractPhone(item);
      const lifecycleStatus = mapAxisCareStatusToLifecycle(item);

      const existing = await prisma.axisCareMapping.findFirst({
        where: { tenantId, axiscareCaregiverId: id },
        include: { caregiver: true },
      });

      if (existing) {
        await prisma.caregiver.update({
          where: { id: existing.caregiverId },
          data: {
            firstName,
            lastName,
            email: email ?? undefined,
            phone: phone ?? undefined,
            axisCareId: id,
            axisCareLifecycleStage: 'caregiver',
            updatedAt: new Date(),
          },
        });
        await prisma.employmentEpisode.updateMany({
          where: { caregiverId: existing.caregiverId },
          data: { lifecycleStatus, updatedAt: new Date() },
        });
        await prisma.axisCareMapping.update({
          where: { id: existing.id },
          data: { rawData: rawData as object, lastSyncedAt: new Date(), updatedAt: new Date() },
        });
      } else {
        const caregiver = await prisma.caregiver.create({
          data: {
            tenantId,
            firstName,
            lastName,
            email: email ?? undefined,
            phone: phone ?? undefined,
            axisCareId: id,
            axisCareLifecycleStage: 'caregiver',
            eligibilityStatus: 'ELIGIBLE',
          },
        });
        await prisma.employmentEpisode.create({
          data: {
            tenantId,
            caregiverId: caregiver.id,
            episodeNumber: 1,
            lifecycleStatus,
          },
        });
        await prisma.axisCareMapping.create({
          data: {
            tenantId,
            caregiverId: caregiver.id,
            axiscareCaregiverId: id,
            rawData: rawData as object,
            lastSyncedAt: new Date(),
          },
        });
      }
      stats.caregivers++;
    } catch (e) {
      console.error(`[AxisCare sync] Failed to sync caregiver ${id}:`, e);
    }
  }

  // Sync Clients (list may have full data; fetch responsible parties separately)
  const clients = await listClients(baseUrl, apiToken);
  for (const item of clients) {
    const id = extractId(item);
    if (!id) continue;
    try {
      const rawData = item && typeof item === 'object' ? (item as object) : {};
      const rpList = await listClientResponsibleParties(baseUrl, apiToken, id);
      const enriched = { ...rawData, responsibleParties: rpList };
      const statusVal = extractString(item, 'status') || extractString(item, 'Status');
      const statusLabel = item && typeof item === 'object' && 'status' in item
        ? (item as Record<string, unknown>).status
        : null;
      const statusStr = statusLabel && typeof statusLabel === 'object' && statusLabel !== null && 'label' in statusLabel
        ? String((statusLabel as Record<string, unknown>).label)
        : statusVal || 'Active';

      await prisma.client.upsert({
        where: {
          tenantId_axisCareId: { tenantId, axisCareId: id },
        },
        create: {
          tenantId,
          axisCareId: id,
          axisCareLifecycleStage: 'client',
          firstName: extractString(item, 'firstName') || extractString(item, 'FirstName') || 'Unknown',
          lastName: extractString(item, 'lastName') || extractString(item, 'LastName') || 'Unknown',
          email: extractEmail(item) ?? extractOptionalString(item, 'email') ?? extractOptionalString(item, 'Email'),
          phone: extractPhone(item) ?? extractOptionalString(item, 'phone') ?? extractOptionalString(item, 'Phone'),
          address: extractOptionalString(item, 'address') ?? extractOptionalString(item, 'Address'),
          status: statusStr,
          rawData: enriched as object,
          axisCareLastSyncedAt: new Date(),
        },
        update: {
          axisCareLifecycleStage: 'client',
          firstName: extractString(item, 'firstName') || extractString(item, 'FirstName') || 'Unknown',
          lastName: extractString(item, 'lastName') || extractString(item, 'LastName') || 'Unknown',
          email: extractEmail(item) ?? extractOptionalString(item, 'email') ?? extractOptionalString(item, 'Email'),
          phone: extractPhone(item) ?? extractOptionalString(item, 'phone') ?? extractOptionalString(item, 'Phone'),
          address: extractOptionalString(item, 'address') ?? extractOptionalString(item, 'Address'),
          status: statusStr,
          rawData: enriched as object,
          axisCareLastSyncedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      stats.clients++;
    } catch (e) {
      console.error(`[AxisCare sync] Failed to sync client ${id}:`, e);
    }
  }

  // Sync Leads -> Client with axisCareLifecycleStage='lead'
  const leads = await listLeads(baseUrl, apiToken);
  for (const item of leads) {
    const id = extractId(item);
    if (!id) continue;
    try {
      const rawData = item && typeof item === 'object' ? (item as object) : {};
      const rpList = await listLeadResponsibleParties(baseUrl, apiToken, id);
      const enriched = { ...rawData, responsibleParties: rpList };

      await prisma.client.upsert({
        where: {
          tenantId_axisCareId: { tenantId, axisCareId: id },
        },
        create: {
          tenantId,
          axisCareId: id,
          axisCareLifecycleStage: 'lead',
          firstName: extractString(item, 'firstName') || extractString(item, 'FirstName') || 'Unknown',
          lastName: extractString(item, 'lastName') || extractString(item, 'LastName') || 'Unknown',
          email: extractEmail(item) ?? extractOptionalString(item, 'email') ?? extractOptionalString(item, 'Email'),
          phone: extractPhone(item) ?? extractOptionalString(item, 'phone') ?? extractOptionalString(item, 'Phone'),
          rawData: enriched as object,
          axisCareLastSyncedAt: new Date(),
        },
        update: {
          axisCareLifecycleStage: 'lead',
          firstName: extractString(item, 'firstName') || extractString(item, 'FirstName') || 'Unknown',
          lastName: extractString(item, 'lastName') || extractString(item, 'LastName') || 'Unknown',
          email: extractEmail(item) ?? extractOptionalString(item, 'email') ?? extractOptionalString(item, 'Email'),
          phone: extractPhone(item) ?? extractOptionalString(item, 'phone') ?? extractOptionalString(item, 'Phone'),
          rawData: enriched as object,
          axisCareLastSyncedAt: new Date(),
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
