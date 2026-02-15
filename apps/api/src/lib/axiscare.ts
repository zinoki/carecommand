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

function toArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data;
    if (Array.isArray(o.items)) return o.items;
    if (Array.isArray(o.results)) return o.results;
  }
  return [];
}

/** List applicants */
export async function listApplicants(
  baseUrl: string,
  apiToken: string
): Promise<unknown[]> {
  const data = await fetchAxisCare(baseUrl, apiToken, '/applicants');
  return toArray(data);
}

/** Get applicant by ID */
export async function getApplicant(
  baseUrl: string,
  apiToken: string,
  applicantId: string
): Promise<unknown> {
  return fetchAxisCare(baseUrl, apiToken, `/applicants/${applicantId}`);
}

/** List caregivers */
export async function listCaregivers(
  baseUrl: string,
  apiToken: string
): Promise<unknown[]> {
  const data = await fetchAxisCare(baseUrl, apiToken, '/caregivers');
  return toArray(data);
}

/** Get caregiver by ID */
export async function getCaregiver(
  baseUrl: string,
  apiToken: string,
  caregiverId: string
): Promise<unknown> {
  return fetchAxisCare(baseUrl, apiToken, `/caregivers/${caregiverId}`);
}

/** List clients */
export async function listClients(
  baseUrl: string,
  apiToken: string
): Promise<unknown[]> {
  const data = await fetchAxisCare(baseUrl, apiToken, '/clients');
  return toArray(data);
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
  return toArray(data);
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

/** List leads */
export async function listLeads(
  baseUrl: string,
  apiToken: string
): Promise<unknown[]> {
  const data = await fetchAxisCare(baseUrl, apiToken, '/leads');
  return toArray(data);
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
  return toArray(data);
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
