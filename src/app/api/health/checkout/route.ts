import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { kairosPrices } from "@/lib/pricing";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" as Stripe.LatestApiVersion });

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { assessmentId } = await request.json();
  if (!assessmentId) {
    return NextResponse.json({ error: "Missing assessmentId" }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card", "alipay", "wechat_pay"],
    payment_method_options: {
      wechat_pay: { client: "web" },
    },
    line_items: [{
      price_data: {
        currency: "usd",
          unit_amount: kairosPrices.health_report.usdCents,
        product_data: {
          name: "TCM Health Constitution Report",
          description: "Personalized health analysis based on Five Elements & Nine Constitutions",
        },
      },
      quantity: 1,
    }],
    mode: "payment",
    success_url: `${origin}/health/report/${assessmentId}?paid=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/health/quiz?paid=false`,
    metadata: { assessmentId, userId: user.id, tier: "health", product: "health" },
  });

  return NextResponse.json({ url: session.url });
}
