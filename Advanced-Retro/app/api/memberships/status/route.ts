import { getUserMembership } from '@/lib/membership';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await getUserMembership(user.id);
    return Response.json({ success: true, membership });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'No se pudo cargar la membresía' },
      { status: 500 }
    );
  }
}
