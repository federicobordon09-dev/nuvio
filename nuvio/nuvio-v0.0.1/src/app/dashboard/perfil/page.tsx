import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LogOut } from "@/components/ui/icons";

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userName = user?.user_metadata?.full_name ?? "Usuario";
  const userEmail = user?.email ?? "";
  const userAvatar = user?.user_metadata?.avatar_url;

  return (
    <div>
      <PageHeader title="Perfil" description="Tu información de cuenta." />

      <Card padding="lg">
        <div className="flex items-center gap-4">
          {userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userAvatar}
              alt=""
              className="h-16 w-16 rounded-full"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-muted text-[20px] font-medium text-primary">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-[18px] font-medium text-foreground">
              {userName}
            </h2>
            {userEmail && (
              <p className="text-[14px] text-muted-foreground">
                {userEmail}
              </p>
            )}
          </div>
        </div>
      </Card>

      <div className="mt-6">
        <form action={signOut}>
          <Button type="submit" variant="ghost">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </form>
      </div>
    </div>
  );
}
