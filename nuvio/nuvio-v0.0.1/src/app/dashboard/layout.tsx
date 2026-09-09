import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { signOut } from "@/lib/actions/auth";
import Image from "next/image";
import Link from "next/link";
import { LogOut } from "@/components/ui/icons";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data) {
    redirect("/auth/login");
  }

  const { data: { user } } = await supabase.auth.getUser();

  const userName = user?.user_metadata?.full_name ?? user?.email ?? "Usuario";
  const userEmail = user?.email ?? "";
  const userAvatar = user?.user_metadata?.avatar_url;

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
        <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-surface">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center px-5">
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

            <div className="px-3">
              <div className="divider" />
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4">
              <DashboardNav />
            </div>

            <div className="px-3">
              <div className="divider" />
            </div>

            <div className="px-3 py-4">
              <div className="flex items-center gap-3 px-3 mb-3">
                {userAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={userAvatar}
                    alt=""
                    className="h-9 w-9 rounded-full"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-muted text-caption font-medium text-primary">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-foreground truncate">
                    {userName}
                  </p>
                  {userEmail && (
                    <p className="text-caption text-muted-foreground truncate">
                      {userEmail}
                    </p>
                  )}
                </div>
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-body font-medium text-muted-foreground transition-all duration-150 hover:bg-primary-muted/40 hover:text-foreground active:scale-[0.98]"
                >
                  <LogOut />
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:pl-64">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
