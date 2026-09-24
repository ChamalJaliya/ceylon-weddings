import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import type { Request, Response } from "express";
import { firstValueFrom } from "rxjs";
import { AiService } from "./ai.service";
import { JwtCookieGuard } from "../auth/jwt-cookie.guard";

@ApiTags("AI")
@ApiBearerAuth()
@UseGuards(JwtCookieGuard)
@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // ── Chat (SSE streaming) ────────────────────────────────────────────────

  @Post("chat")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Streaming chat assistant",
    description:
      "Proxies a streaming SSE response from the AI service. " +
      "Each SSE event has the shape `{delta: string}`. Stream ends with `[DONE]`.",
  })
  @ApiResponse({ status: 200, description: "text/event-stream of SSE deltas" })
  async chat(
    @Body() body: Record<string, unknown>,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    try {
      const axiosResponse = await firstValueFrom(
        this.aiService.streamChat(body),
      );
      axiosResponse.data.pipe(res);
      axiosResponse.data.on("end", () => res.end());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Stream error";
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    }
  }

  // ── Checklist ───────────────────────────────────────────────────────────

  @Post("checklist")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Generate personalised wedding checklist",
    description:
      "Returns a structured list of planning tasks tailored to the couple's " +
      "traditions, location, timeline, and guest count.",
  })
  @ApiResponse({
    status: 200,
    description: "{ tasks: ChecklistTask[] }",
  })
  async checklist(
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.aiService.forwardJson("/ai/checklist", body);
  }

  // ── Budget ──────────────────────────────────────────────────────────────

  @Post("budget")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Generate LKR budget estimate",
    description:
      "Returns a detailed Sri Lankan wedding budget breakdown in LKR " +
      "with per-category min/max ranges and practical notes.",
  })
  @ApiResponse({
    status: 200,
    description: "BudgetResponse with total_lkr and breakdown[]",
  })
  async budget(
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.aiService.forwardJson("/ai/budget", body);
  }
}
