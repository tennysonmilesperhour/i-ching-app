// Number of $10/year supporters that covers hosting and upkeep for a year.
export const SUPPORTER_GOAL = 20;

export function parseSupporterCount(value) {
  if (value === null || value === undefined || value === '') return null;
  const count = Number(value);
  return Number.isInteger(count) && count >= 0 ? count : null;
}

export function goalProgress(count, goal = SUPPORTER_GOAL) {
  if (count === null || goal <= 0) return 0;
  return Math.min(100, Math.round((count / goal) * 100));
}

// Counts active subscriptions across Stripe list pages. Only the total leaves
// the server: no names, emails or amounts are returned to the browser.
export async function countStripeSupporters({ secretKey, priceId, fetchImpl = fetch }) {
  // Without a price filter every active subscription on the account would be
  // counted as a yearly supporter, so the price is required.
  if (!priceId) throw new Error('A Stripe price id is required');
  let count = 0;
  let startingAfter = null;
  for (let page = 0; page < 50; page += 1) {
    const params = new URLSearchParams({ status: 'active', limit: '100', price: priceId });
    if (startingAfter) params.set('starting_after', startingAfter);
    const response = await fetchImpl(`https://api.stripe.com/v1/subscriptions?${params}`, {
      headers: { authorization: `Bearer ${secretKey}` },
    });
    if (!response.ok) throw new Error(`Stripe responded ${response.status}`);
    const body = await response.json();
    const items = Array.isArray(body.data) ? body.data : [];
    count += items.length;
    if (!body.has_more || items.length === 0) break;
    startingAfter = items[items.length - 1].id;
  }
  return count;
}
