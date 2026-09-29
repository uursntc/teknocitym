import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/admin-app";
import { LoginForm } from "@/components/admin/login-form";
import { isAdmin } from "@/lib/auth";
import { getContent, listRequests } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Yönetim paneli | teknocitym", robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!(await isAdmin())) return <LoginForm configured={!!process.env.ADMIN_PASSWORD} />;
  const [content, requests] = await Promise.all([getContent(), listRequests()]);
  return <AdminApp initialContent={content} initialRequests={requests} />;
}
