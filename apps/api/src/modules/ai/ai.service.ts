import { Injectable, BadGatewayException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom, Observable } from "rxjs";
import { AxiosResponse } from "axios";

@Injectable()
export class AiService {
  constructor(private readonly http: HttpService) {}

  /**
   * Forward a JSON body to the FastAPI AI service and return the response data.
   * Used for non-streaming endpoints (checklist, budget).
   */
  async forwardJson<T>(path: string, body: unknown): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.http.post<T>(path, body, {
          headers: { "Content-Type": "application/json" },
        }),
      );
      return response.data;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "AI service unavailable";
      throw new BadGatewayException(`AI service error: ${message}`);
    }
  }

  /**
   * Return a streaming Observable for SSE piping (chat endpoint).
   */
  streamChat(
    body: unknown,
  ): Observable<AxiosResponse<NodeJS.ReadableStream>> {
    return this.http.post<NodeJS.ReadableStream>("/ai/chat", body, {
      headers: { "Content-Type": "application/json" },
      responseType: "stream",
    });
  }
}
