import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const billingRouter = Router();

billingRouter.use(requireAuth);
billingRouter.use(requireRole(['ADMIN']));

billingRouter.get('/portal', async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const billing = await prisma.tenantBilling.findUnique({
      where: { tenantId },
      include: { plan: true },
    });
    if (!billing) return res.status(404).json({ error: 'Tenant not found' });

    if (process.env.FORCE_FREE_PLAN === 'true' || billing.plan.isFree) {
      return res.json({
        plan: billing.plan.name,
        portalUrl: null,
        message: 'Free plan - full access. Billing portal not available.',
      });
    }

    if (!billing.stripeCustomerId) {
      return res.json({
        plan: billing.plan.name,
        portalUrl: null,
        message: 'No billing account yet',
      });
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/app/settings/organization`,
    });
    res.json({ portalUrl: session.url });
  } catch (err) {
    next(err);
  }
});

billingRouter.get('/plan', async (req, res, next) => {
  try {
    const { tenantId } = req.auth!;
    const billing = await prisma.tenantBilling.findUnique({
      where: { tenantId },
      include: { plan: true },
    });
    if (!billing) return res.status(404).json({ error: 'Not found' });
    res.json({ plan: billing.plan.name, status: billing.status });
  } catch (err) {
    next(err);
  }
});

export { billingRouter };
