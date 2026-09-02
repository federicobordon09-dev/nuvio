import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { _testAnalyzeStudy } from "@/lib/actions/studies";

export default async function TestAnalyzePage({
  searchParams,
}: {
  searchParams: Promise<{ studyId?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { studyId } = await searchParams;

  if (!studyId) {
    return (
      <pre className="p-8 text-xs">
        Uso: /dashboard/test-analyze?studyId=UUID_DE_UN_ESTUDIO_PROCESADO
      </pre>
    );
  }

  let result: unknown;
  let error: string | null = null;

  try {
    result = await _testAnalyzeStudy(studyId);
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <pre className="p-8 text-xs whitespace-pre-wrap break-words">
      {error ? `ERROR: ${error}` : JSON.stringify(result, null, 2)}
    </pre>
  );
}