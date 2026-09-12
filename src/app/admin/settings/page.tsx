import Link from "next/link";
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/actions/admin";
import { getPlatformSettings } from "@/lib/actions/settings";
import PlatformSettingsForm from "@/components/PlatformSettingsForm";

export default async function AdminSettingsPage() {
  if (!(await isCurrentUserAdmin())) {
    redirect("/dashboard");
  }

  const settings = await getPlatformSettings();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-chaos-white md:text-4xl">
          Payment settings
        </h1>
        <Link href="/admin" className="text-sm font-semibold text-chaos-gold hover:underline">
          ← Back to admin
        </Link>
      </div>

      <PlatformSettingsForm
        entryFeeCents={settings.entry_fee_cents}
        platformFeePercent={Number(settings.platform_fee_percent)}
        winnerSharePercent={Number(settings.winner_share_percent)}
      />
    </div>
  );
}
