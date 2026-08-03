import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import {
  handleCheckoutSessionCompleted,
  handleCheckoutSessionExpired,
} from "@/services/paymentService";

// Signature verification requires the exact raw request body — never parse
// it as JSON before this. See CLAUDE.md Section 13.
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Signature verification failed: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event);
      break;
    case "checkout.session.expired":
      await handleCheckoutSessionExpired(event);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
