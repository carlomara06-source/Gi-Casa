# Stripe test-mode setup

The app runs fine with no Stripe keys at all — `/api/billing/checkout` falls
back to activating the plan directly (see `STRIPE_SECRET_KEY` in
`.env.example`). Set these up when you want the real Checkout flow.

1. Create a Stripe account (or use an existing one) and grab your **test
   mode** keys from https://dashboard.stripe.com/test/apikeys.
   - `STRIPE_SECRET_KEY` = the `sk_test_...` key.
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = the `pk_test_...` key (not
     currently used client-side since we redirect to Checkout, but handy for
     Payment Element work later).

2. Create the three paid weekly plans as Products + Prices (test mode), one
   Price per plan, recurring weekly:

   ```
   stripe products create --name "Visibility Boost"
   stripe prices create --product <prod_id> --currency eur --unit-amount 2900 \
     --recurring[interval]=week

   stripe products create --name "Smart Agent"
   stripe prices create --product <prod_id> --currency eur --unit-amount 5900 \
     --recurring[interval]=week

   stripe products create --name "Concierge Luxury"
   stripe prices create --product <prod_id> --currency eur --unit-amount 9900 \
     --recurring[interval]=week
   ```

   Put the resulting `price_...` ids into `STRIPE_PRICE_VISIBILITY_BOOST`,
   `STRIPE_PRICE_SMART_AGENT`, `STRIPE_PRICE_CONCIERGE_LUXURY`.

   Note: the "4 settimane · −15%" billing-cycle toggle in the UI only
   changes the *displayed* price when Stripe isn't wired up; the real
   Checkout path always uses the weekly Price above. To offer a true 4-week
   cycle, create a second Price per plan with `interval=week
   interval_count=4` and a discounted `unit_amount`, and branch on `cycle`
   in `src/app/api/billing/checkout/route.ts`.

3. Forward webhooks to your dev server and copy the printed signing secret
   into `STRIPE_WEBHOOK_SECRET`:

   ```
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. Restart `pnpm dev`. Activating a paid plan from `/abbonamenti` now opens
   a real Stripe Checkout session; the webhook activates the plan in the DB
   once payment succeeds, and pause/resume/downgrade from the seller
   dashboard call `subscriptions.update`/`cancel` on the real subscription.
