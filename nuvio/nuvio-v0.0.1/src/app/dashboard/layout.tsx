import { getServerUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { signOut } from "@/lib/actions/auth";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Upload } from "@/components/ui/icons";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userName = user.user_metadata?.full_name ?? user.email ?? "Usuario";
  const userEmail = user.email ?? "";
  const userAvatar = user.user_metadata?.avatar_url;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur-xl lg:hidden">
        <Link href="/dashboard" className="flex items-center" aria-label="Nuvio">
          <Image
            src="/nuvio_logo_nuevo.png"
            alt="Nuvio"
            width={100}
            height={24}
            className="h-6 w-auto"
            priority
          />
        </Link>
        <MobileNav userName={userName} userEmail={userEmail} userAvatar={userAvatar} />
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-surface lg:shadow-sm">
          <div className="flex h-full flex-col">
            <div className="flex h-16 shrink-0 items-center px-6">
              <Link href="/dashboard" className="flex items-center" aria-label="Nuvio">
                <Image
                  src="/nuvio_logo_nuevo.png"
                  alt="Nuvio"
                  width={120}
                  height={32}
                  className="h-8 w-auto"
                  priority
                />
              </Link>
            </div>

            {/* CTA principal */}
            <div className="px-4 pb-4">
              <Link
                href="/dashboard/subir"
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-body font-medium text-primary-foreground shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-primary-hover active:translate-y-0"
              >
                <Upload className="h-4 w-4" />
                Subir estudio
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <DashboardNav />
            </div>

            {/* Pie: usuario + cierre de sesión */}
            <div className="p-4">
              <div className="rounded-md bg-background p-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  {userAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={userAvatar}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-muted text-caption font-medium text-primary">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body font-medium text-foreground">
                      {userName}
                    </p>
                    {userEmail && (
                      <p className="truncate text-caption text-muted-foreground">
                        {userEmail}
                      </p>
                    )}
                  </div>
                </div>
                <form action={signOut} className="mt-2">
                  <button
                    type="submit"
                    className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2.5 text-body font-medium text-muted-foreground transition-all duration-150 hover:bg-primary-muted/40 hover:text-foreground active:scale-[0.98]"
                  >
                    <LogOut />
                    Cerrar sesión
                  </button>
                </form>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 lg:pl-64">
          <div className="mx-auto w-full max-w-[1340px] px-4 pb-16 pt-8 sm:px-6 lg:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
