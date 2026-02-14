# AxisCare Integration Setup

This guide walks agency Admins through configuring the AxisCare integration in CareCommand.

## Prerequisites

- An active AxisCare account
- Admin access in both AxisCare and CareCommand

## Step 1: Create an API Token in AxisCare

1. Log in to AxisCare as an administrator
2. Navigate to **Settings** > **API** (or equivalent admin section)
3. Create a new API token
4. Enable the following permissions:
   - **Caregivers**: Read, Read Sensitive (if you need sensitive fields), Add, Edit, Edit External Id
   - **Applicants** (optional): If you plan to sync applicants in the future
5. Copy the token securely—you will paste it into CareCommand

## Step 2: Configure CareCommand

1. In CareCommand, go to **Settings** > **Organization** > **Integrations**
2. Enter your **Site Number** (from AxisCare)
3. Paste the **API Token**
4. Enable **Sync** and set the frequency (default: 1 hour)
5. If AxisCare has enabled webhooks for your account, enable **Webhook** and contact AxisCare support to configure the webhook subscriber URL

## Step 3: Test the Connection

1. Click **Test Connection** in the Integration settings
2. A successful test confirms that the site number and token are valid
3. If the test fails, verify:
   - Site number is correct
   - Token has the required permissions
   - No firewall or network restrictions block the API

## Step 4: Webhooks (Optional)

AxisCare supports webhook events such as `caregiver.created` and `caregiver.updated`. Webhook subscriber admin configuration may require contacting AxisCare support to enable.

- If enabled: CareCommand will receive near-real-time updates when caregivers change in AxisCare
- If not enabled: Hourly sync will keep data in sync

## Sync Behavior

- **CareCommand → AxisCare**: When you update a caregiver in CareCommand (e.g., mark offboarded, update compliance), changes are pushed to AxisCare
- **AxisCare → CareCommand**: When caregivers are updated in AxisCare, they are pulled into CareCommand on the next sync (or immediately via webhook)
- **Conflict resolution**: If both systems have changes, the most recently updated record wins. Conflicts are logged and can be reviewed in the Admin UI

## Status Mapping

| CareCommand Status | AxisCare |
|--------------------|----------|
| Onboarding incomplete | Inactive |
| Active & compliant | Active |
| Ineligible (expired docs, etc.) | Inactive |
| Offboarded (quit, fired, etc.) | Inactive |

When AxisCare marks a caregiver inactive, CareCommand pulls that change and creates an Admin review task to select the reason (quit/fired/on leave/expired/other).
