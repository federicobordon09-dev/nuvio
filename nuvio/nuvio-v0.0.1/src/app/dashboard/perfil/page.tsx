import { getServerUser } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LogOut } from "@/components/ui/icons";

export default async function PerfilPage() {
  const user = await getServerUser();

  const userName = user?.user_metadata?.full_name ?? "Usuario";
  const userEmail = user?.email ?? "";
  const userAvatar = user?.user_metadata?.avatar_url;

  return (
    <div className="space-y-6">
      <PageHeader title="Perfil" description="Tu información de cuenta." />

      <Card padding="lg">
        <p className="data-label text-muted-foreground">Cuenta</p>
        <div className="mt-4 flex items-center gap-4">
          {userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userAvatar}
              alt=""
              className="h-16 w-16 shrink-0 rounded-full border border-border object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-muted text-[20px] font-semibold text-primary"
            >
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-heading truncate">{userName}</h2>
            {userEmail && (
              <p className="mt-1 truncate text-[14px] text-muted-foreground">
                {userEmail}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <p className="data-label text-muted-foreground">Sesión</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-prose text-[14px] leading-relaxed text-muted-foreground">
            Cerrá la sesión de este dispositivo cuando termines de usar Nuvio.
          </p>
          <form action={signOut}>
            <Button type="submit" variant="ghost">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
