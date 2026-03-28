import { RequestUrlResponse, requestUrl } from "obsidian";

export class MementoApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "MementoApiError";
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

interface ApiErrorBody {
  error?: { code: string; message: string };
}

export interface TestConnectionResult {
  ok: true;
}

export interface TestConnectionFailure {
  ok: false;
  status: number;
  code: string;
  message: string;
}

/** Safely parse response.json — returns null if the body is not valid JSON. */
function safeParseJson(response: RequestUrlResponse): ApiErrorBody | null {
  try {
    return response.json as ApiErrorBody;
  } catch {
    return null;
  }
}

export class MementoApiClient {
  private cachedToken: string | null = null;

  constructor(
    private apiUrl: string,
    private clientId: string,
    private clientSecret: string
  ) {}

  async authenticate(): Promise<void> {
    try {
      const response = await requestUrl({
        url: `${this.apiUrl}/api/auth/token`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        throw: false,
      });

      if (response.status === 401) {
        throw new MementoApiError(401, "INVALID_CREDENTIALS", "Invalid client credentials");
      }
      if (response.status !== 200) {
        throw new MementoApiError(
          response.status,
          "AUTH_ERROR",
          `Authentication failed (${response.status})`
        );
      }

      // status is 200 here — safe to read json
      // The Memento API wraps responses in { data: ... } via ok()
      this.cachedToken = (response.json as { data: { access_token: string } }).data.access_token;
    } catch (err) {
      if (err instanceof MementoApiError) throw err;
      throw new NetworkError("Network error during authentication");
    }
  }

  /** Test credentials without caching the resulting token. */
  async testConnection(): Promise<TestConnectionResult | TestConnectionFailure> {
    try {
      const response = await requestUrl({
        url: `${this.apiUrl}/api/auth/token`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        throw: false,
      });

      if (response.status === 200) {
        return { ok: true };
      }

      const errorBody = safeParseJson(response);
      return {
        ok: false,
        status: response.status,
        code: errorBody?.error?.code ?? "UNKNOWN_ERROR",
        message: errorBody?.error?.message ?? `Server error (${response.status})`,
      };
    } catch {
      return { ok: false, status: 0, code: "NETWORK_ERROR", message: "Network error — check your API URL" };
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    isRetry = false
  ): Promise<T> {
    if (!this.cachedToken) {
      await this.authenticate();
    }

    try {
      const response = await requestUrl({
        url: `${this.apiUrl}${path}`,
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.cachedToken}`,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        throw: false,
      });

      if (response.status === 401 && !isRetry) {
        this.cachedToken = null;
        await this.authenticate();
        return this.request<T>(method, path, body, true);
      }

      if (response.status < 200 || response.status >= 300) {
        // Check status BEFORE accessing response.json to avoid SyntaxError on non-JSON bodies
        const errorBody = safeParseJson(response);
        const code = errorBody?.error?.code ?? "UNKNOWN_ERROR";
        const message = errorBody?.error?.message ?? `Server error (${response.status})`;
        throw new MementoApiError(response.status, code, message);
      }

      return response.json as T;
    } catch (err) {
      if (err instanceof MementoApiError) throw err;
      throw new NetworkError("Network error — check your API URL in settings");
    }
  }

  async createBookmark(data: {
    url: string;
    title?: string;
    content?: string;
    excerpt?: string;
  }): Promise<void> {
    const body: Record<string, string> = { url: data.url };
    if (data.title) body.title = data.title;
    if (data.content) body.content = data.content;
    if (data.excerpt) body.excerpt = data.excerpt;
    await this.request<unknown>("POST", "/api/v1/bookmarks", body);
  }

  async createTodo(title: string, dueDate?: string): Promise<void> {
    const body: Record<string, string> = { title };
    if (dueDate) body.due_date = dueDate;
    await this.request<unknown>("POST", "/api/v1/todos", body);
  }

  async generateNewspaper(templateId: string): Promise<void> {
    await this.request<unknown>(
      "POST",
      "/api/v1/newspaper/generate?format=json",
      { template_id: templateId }
    );
  }
}
