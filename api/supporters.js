import { countStripeSupporters, parseSupporterCount, SUPPORTER_GOAL } from '../src/lib/supporterGoal.js';

const HEADERS = {
  'cache-control': 'public, s-maxage=600, stale-while-revalidate=3600',
};

// Returns only { count, goal }. A live count needs both STRIPE_SECRET_KEY
// (restricted, read access to subscriptions) and STRIPE_SUPPORT_PRICE_ID.
// SUPPORTER_COUNT_OVERRIDE sets the number by hand when Stripe is not connected.
export async function GET() {
  const override = parseSupporterCount(process.env.SUPPORTER_COUNT_OVERRIDE?.trim() || undefined);
  if (override !== null) {
    return Response.json({ count: override, goal: SUPPORTER_GOAL }, { headers: HEADERS });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const priceId = process.env.STRIPE_SUPPORT_PRICE_ID?.trim();
  if (!secretKey || !priceId) {
    return Response.json({ count: null, goal: SUPPORTER_GOAL }, { headers: HEADERS });
  }

  try {
    const count = await countStripeSupporters({ secretKey, priceId });
    return Response.json({ count, goal: SUPPORTER_GOAL }, { headers: HEADERS });
  } catch {
    return Response.json({ count: null, goal: SUPPORTER_GOAL }, { status: 502, headers: { 'cache-control': 'no-store' } });
  }
}
