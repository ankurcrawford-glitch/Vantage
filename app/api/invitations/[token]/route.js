// Public invitation lookup by token. The token in the URL is the secret —
// no auth required. Uses service role so we can apply strict RLS on
// essay_invitations (owner + invitee email only) without breaking accept flow.

import { getAdminClient } from "@/lib/auth";

const SELECT = `
  id, essay_id, student_id, invitee_email, invitee_name, role, status, token, student_name,
  essays:essay_id (
    id, user_id, college_prompt_id,
    college_prompts:college_prompt_id (
      id, college_id, prompt_text, sort_order, word_limit,
      colleges:college_id ( id, name )
    )
  )
`;

export async function GET(_req, { params }) {
  try {
    const token = params?.token;
    if (!token || typeof token !== "string") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("essay_invitations")
      .select(SELECT)
      .eq("token", token)
      .maybeSingle();

    if (error || !data) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json({ invitation: data });
  } catch (err) {
    console.error("invitation lookup error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
