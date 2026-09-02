import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userName = user?.user_metadata?.full_name ?? "Usuario";
  const userEmail = user?.email ?? "";
  const userAvatar = user?.user_metadata?.avatar_url;

  return (
    <div>
      <PageHeader title="Perfil" description="Tu información de cuenta." />

      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center gap-4">
          {userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userAvatar}
              alt=""
              className="h-16 w-16 rounded-full"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ocean-tint text-[20px] font-medium text-ocean-dark">
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
      </div>
    </div>
  );
}
