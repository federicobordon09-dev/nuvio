import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { _testGeminiIntegration } from "@/lib/actions/studies";

export default async function TestGeminiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  let result: unknown;
  let error: string | null = null;

  try {
    result = await _testGeminiIntegration();
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <pre className="p-8 text-xs whitespace-pre-wrap break-words">
      {error ? `ERROR: ${error}` : JSON.stringify(result, null, 2)}
    </pre>
  );
}