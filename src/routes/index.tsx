import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

const PosApp = lazy(() =>
  import("@/pos/PosApp").then((m) => ({ default: m.PosApp })),
);

const TITLE = "أسايل POS — نظام نقاط بيع للمطاعم";
const DESC =
  "نظام نقاط بيع متكامل للمطاعم: طلبات، طباعة فواتير حرارية 80mm، تذاكر مطبخ، ورديات، تقارير وإدارة مستخدمين.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <Loading />;

  return (
    <Suspense fallback={<Loading />}>
      <PosApp />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100" dir="rtl">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />
        <p className="text-sm font-semibold text-slate-600">جارٍ تحميل نظام الكاشير…</p>
      </div>
    </div>
  );
}
