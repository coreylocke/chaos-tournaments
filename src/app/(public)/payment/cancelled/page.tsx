import Link from "next/link";

export default function PaymentCancelledPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">Payment cancelled</h1>
      <p className="max-w-sm text-sm text-zinc-500">
        No charge was made. The entries you selected are still unpaid and
        available.
      </p>
      <Link
        href="/dashboard"
        className="flex h-11 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
