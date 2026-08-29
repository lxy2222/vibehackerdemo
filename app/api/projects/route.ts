import { createAndAnalyze } from "@/lib/projects/service";
import { errorMessage, jsonError, jsonOk } from "@/lib/http/respond";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      reportBackground?: string;
      leaderRequest?: string;
      materials?: string;
      durationMinutes?: number;
      useDemo?: boolean;
    };
    const project = await createAndAnalyze({
      reportBackground: body.reportBackground ?? body.leaderRequest,
      materials: body.materials,
      durationMinutes: body.durationMinutes,
      useDemo: body.useDemo,
    });
    return jsonOk(project, 201);
  } catch (error) {
    return jsonError(errorMessage(error, "分析失败"));
  }
}
