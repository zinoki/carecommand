/**
 * AxisCare API client - read-only
 * Base URL: https://{siteNumber}.axiscare.com/api
 * Auth: Bearer token
 */
export function getAxisCareBaseUrl(siteNumber: string): string {
  return `https://${siteNumber}.axiscare.com`;
}

export function getAxisCareHeaders(apiToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
    'X-AxisCare-Api-Version': '2023-10-01',
  };
}

async function fetchAxisCare(
  baseUrl: string,
  apiToken: string,
  path: string
): Promise<unknown> {
  const url = `${baseUrl}/api${path}`;
  const res = await fetch(url, {
    headers: getAxisCareHeaders(apiToken),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AxisCare API error (${res.status}): ${err}`);
  }
  return res.json();
}

async function fetchAxisCareByUrl(url: string, apiToken: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: getAxisCareHeaders(apiToken),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AxisCare API error (${res.status}): ${err}`);
  }
  return res.json();
}

/** Extract array from results.{entity} object format. AxisCare returns { results: { caregivers: { "1": {...}, "2": {...} } } } */
function extractFromResults(data: unknown, entityKey: string): unknown[] {
  const o = data as Record<string, unknown>;
  const results = o?.results as Record<string, unknown> | undefined;
  const entity = results?.[entityKey];
  if (entity && typeof entity === 'object' && !Array.isArray(entity)) {
    return Object.values(entity);
  }
  if (Array.isArray(entity)) return entity;
  return [];
}

/** Get nextPage URL from response for pagination */
function getNextPage(data: unknown): string | null {
  const o = data as Record<string, unknown>;
  const results = o?.results as Record<string, unknown> | undefined;
  const next = results?.nextPage;
  return typeof next === 'string' && next ? next : null;
}

/** List all applicants with pagination */
export async function listApplicants(
  baseUrl: string,
  apiToken: string
): Promise<unknown[]> {
  const all: unknown[] = [];
  let data = await fetchAxisCare(baseUrl, apiToken, '/applicants');
  all.push(...extractFromResults(data, 'applicants'));
  let url = getNextPage(data);
  while (url) {
    data = await fetchAxisCareByUrl(url, apiToken);
    all.push(...extractFromResults(data, 'applicants'));
    url = getNextPage(data);
  }
  return all;
}

/** Get applicant by ID */
export async function getApplicant(
  baseUrl: string,
  apiToken: string,
  applicantId: string
): Promise<unknown> {
  return fetchAxisCare(baseUrl, apiToken, `/applicants/${applicantId}`);
}

/** List all caregivers with pagination. Uses results.caregivers object format. */
export async function listCaregivers(
  baseUrl: string,
  apiToken: string
): Promise<unknown[]> {
  const all: unknown[] = [];
  let data = await fetchAxisCare(baseUrl, apiToken, '/caregivers');
  all.push(...extractFromResults(data, 'caregivers'));
  let url = getNextPage(data);
  while (url) {
    data = await fetchAxisCareByUrl(url, apiToken);
    all.push(...extractFromResults(data, 'caregivers'));
    url = getNextPage(data);
  }
  return all;
}

/** Get caregiver by ID */
export async function getCaregiver(
  baseUrl: string,
  apiToken: string,
  caregiverId: string
): Promise<unknown> {
  return fetchAxisCare(baseUrl, apiToken, `/caregivers/${caregiverId}`);
}

/** List all clients with pagination */
export async function listClients(
  baseUrl: string,
  apiToken: string
): Promise<unknown[]> {
  const all: unknown[] = [];
  let data = await fetchAxisCare(baseUrl, apiToken, '/clients');
  all.push(...extractFromResults(data, 'clients'));
  let url = getNextPage(data);
  while (url) {
    data = await fetchAxisCareByUrl(url, apiToken);
    all.push(...extractFromResults(data, 'clients'));
    url = getNextPage(data);
  }
  return all;
}

/** Get client by ID */
export async function getClient(
  baseUrl: string,
  apiToken: string,
  clientId: string
): Promise<unknown> {
  return fetchAxisCare(baseUrl, apiToken, `/clients/${clientId}`);
}

/** List responsible parties for a client */
export async function listClientResponsibleParties(
  baseUrl: string,
  apiToken: string,
  clientId: string
): Promise<unknown[]> {
  const data = await fetchAxisCare(baseUrl, apiToken, `/clients/${clientId}/responsibleParties`);
  return extractFromResults(data, 'responsibleParties');
}

/** Get responsible party for a client */
export async function getClientResponsibleParty(
  baseUrl: string,
  apiToken: string,
  clientId: string,
  listNumber: string
): Promise<unknown> {
  return fetchAxisCare(
    baseUrl,
    apiToken,
    `/clients/${clientId}/responsibleParties/${listNumber}`
  );
}

/** List all leads with pagination */
export async function listLeads(
  baseUrl: string,
  apiToken: string
): Promise<unknown[]> {
  const all: unknown[] = [];
  let data = await fetchAxisCare(baseUrl, apiToken, '/leads');
  all.push(...extractFromResults(data, 'leads'));
  let url = getNextPage(data);
  while (url) {
    data = await fetchAxisCareByUrl(url, apiToken);
    all.push(...extractFromResults(data, 'leads'));
    url = getNextPage(data);
  }
  return all;
}

/** Get lead by ID */
export async function getLead(
  baseUrl: string,
  apiToken: string,
  leadId: string
): Promise<unknown> {
  return fetchAxisCare(baseUrl, apiToken, `/leads/${leadId}`);
}

/** List responsible parties for a lead */
export async function listLeadResponsibleParties(
  baseUrl: string,
  apiToken: string,
  leadId: string
): Promise<unknown[]> {
  const data = await fetchAxisCare(baseUrl, apiToken, `/leads/${leadId}/responsibleParties`);
  return extractFromResults(data, 'responsibleParties');
}

/** Get responsible party for a lead */
export async function getLeadResponsibleParty(
  baseUrl: string,
  apiToken: string,
  leadId: string,
  listNumber: string
): Promise<unknown> {
  return fetchAxisCare(
    baseUrl,
    apiToken,
    `/leads/${leadId}/responsibleParties/${listNumber}`
  );
}
