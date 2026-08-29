import { createAndGenerateTemplate } from "@/lib/projects/service";
import { errorMessage, jsonError, jsonOk } from "@/lib/http/respond";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      leaderRequest?: string;
      durationMinutes?: number;
      brief?: unknown;
      useDemo?: boolean;
    };
    const project = await createAndGenerateTemplate({
      leaderRequest: body.leaderRequest,
      durationMinutes: body.durationMinutes,
      brief: body.brief,
      useDemo: body.useDemo,
    });
    return jsonOk(project, 201);
  } catch (error) {
    return jsonError(errorMessage(error, "创建失败"));
  }
}
