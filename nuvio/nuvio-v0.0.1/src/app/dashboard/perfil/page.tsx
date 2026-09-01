import { createClient } from "@/lib/supabase/server";

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userName = user?.user_metadata?.full_name ?? "Usuario";
  const userEmail = user?.email ?? "";
  const userAvatar = user?.user_metadata?.avatar_url;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[24px] font-medium tracking-[-0.02em] text-foreground">
          Perfil
        </h1>
        <p className="mt-2 text-[14px] leading-[1.6] text-muted-foreground">
          Tu información de cuenta.
        </p>
      </div>

      <div className="rounded-xl border border-ink-700/10 bg-white p-6 shadow-[0_1px_2px_rgba(11,20,38,0.04)]">
        <div className="flex items-center gap-4">
          {userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userAvatar}
              alt=""
              className="h-16 w-16 rounded-full"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-[20px] font-medium text-primary-700">
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
