import axios, { AxiosInstance, AxiosError } from 'axios';
import FormData from 'form-data';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { PlaneApiError, AuthenticationError } from './utils/errors.js';

class PlaneClient {
  private v1: AxiosInstance;        // API key auth — v1 public endpoints
  private internal: AxiosInstance;   // Session auth — pages, assets, internal APIs
  private sessionCookie: string | null = null;
  private csrfToken: string | null = null;

  constructor() {
    this.v1 = axios.create({
      baseURL: `${config.baseUrl}/api/v1/workspaces/${config.workspaceSlug}`,
      headers: { 'x-api-key': config.apiKey, 'Content-Type': 'application/json' },
      timeout: 30000,
    });
    this.v1.interceptors.response.use(undefined, this.handleError.bind(this));

    this.internal = axios.create({
      baseURL: `${config.baseUrl}/api/workspaces/${config.workspaceSlug}`,
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000,
      maxRedirects: 0,
      validateStatus: (s) => s < 400,
    });
    this.internal.interceptors.request.use((req) => {
      if (this.sessionCookie) req.headers['Cookie'] = this.sessionCookie;
      if (this.csrfToken && req.method !== 'get') req.headers['X-CSRFToken'] = this.csrfToken;
      return req;
    });
    this.internal.interceptors.response.use(undefined, this.handleError.bind(this));
  }

  // ── Session auth ──────────────────────────────────────────────

  async authenticate(): Promise<void> {
    try {
      const csrfResp = await axios.get(`${config.baseUrl}/auth/get-csrf-token/`, {
        maxRedirects: 0,
        validateStatus: (s) => s < 400,
      });
      const csrfCookies = csrfResp.headers['set-cookie'] || [];
      const csrfCookie = csrfCookies.find((c: string) => c.startsWith('csrftoken='));
      this.csrfToken = csrfCookie?.match(/csrftoken=([^;]+)/)?.[1] || null;
      if (!this.csrfToken) throw new AuthenticationError('Failed to get CSRF token');

      const formData = new URLSearchParams();
      formData.append('email', config.email);
      formData.append('password', config.password);
      formData.append('csrfmiddlewaretoken', this.csrfToken);

      let loginCookies: string[] = [];
      try {
        await axios.post(`${config.baseUrl}/auth/sign-in/`, formData.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': `csrftoken=${this.csrfToken}`,
            'Referer': config.baseUrl,
          },
          maxRedirects: 0,
        });
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 302) {
          loginCookies = (err.response.headers['set-cookie'] || []) as string[];
        } else {
          throw err;
        }
      }

      const allCookies: string[] = [];
      for (const c of loginCookies) {
        const match = c.match(/^([^=]+=[^;]+)/);
        if (match) allCookies.push(match[1]);
      }
      allCookies.push(`csrftoken=${this.csrfToken}`);
      this.sessionCookie = allCookies.join('; ');

      if (!loginCookies.some(c => c.includes('session-id'))) {
        throw new AuthenticationError('No session cookie — login failed');
      }

      const me = await axios.get(`${config.baseUrl}/api/users/me/`, {
        headers: { Cookie: this.sessionCookie },
      });
      logger.info('Session authenticated', { user: me.data.display_name });
    } catch (error) {
      if (error instanceof AuthenticationError) throw error;
      const msg = error instanceof Error ? error.message : String(error);
      throw new AuthenticationError(`Sign-in failed: ${msg}`);
    }
  }

  private async ensureSession(): Promise<void> {
    if (!this.sessionCookie) await this.authenticate();
  }

  get isSessionActive(): boolean {
    return this.sessionCookie !== null;
  }

  // ── v1 API (API key) ─────────────────────────────────────────

  async v1Get<T = unknown>(path: string): Promise<T> {
    return (await this.v1.get(path)).data;
  }

  async v1Post<T = unknown>(path: string, data: unknown): Promise<T> {
    return (await this.v1.post(path, data)).data;
  }

  async v1Patch<T = unknown>(path: string, data: unknown): Promise<T> {
    return (await this.v1.patch(path, data)).data;
  }

  async v1Delete(path: string): Promise<void> {
    await this.v1.delete(path);
  }

  async v1RootGet<T = unknown>(path: string): Promise<T> {
    return (await axios.get(`${config.baseUrl}/api/v1${path}`, {
      headers: { 'x-api-key': config.apiKey },
      timeout: 30000,
    })).data;
  }

  // ── Internal API (session) ────────────────────────────────────

  async get<T = unknown>(path: string): Promise<T> {
    await this.ensureSession();
    return (await this.internal.get(path)).data;
  }

  async post<T = unknown>(path: string, data: unknown): Promise<T> {
    await this.ensureSession();
    return (await this.internal.post(path, data)).data;
  }

  async patch<T = unknown>(path: string, data: unknown): Promise<T> {
    await this.ensureSession();
    return (await this.internal.patch(path, data)).data;
  }

  async delete(path: string): Promise<void> {
    await this.ensureSession();
    await this.internal.delete(path);
  }

  // ── Asset API (session, different base paths) ─────────────────

  /**
   * POST to the v2 asset creation endpoint.
   * Base: /api/assets/v2/workspaces/{slug}/...
   */
  async assetCreate<T = unknown>(path: string, data: unknown): Promise<T> {
    await this.ensureSession();
    const url = `${config.baseUrl}/api/assets/v2/workspaces/${config.workspaceSlug}${path}`;
    const resp = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': this.sessionCookie!,
        'X-CSRFToken': this.csrfToken!,
      },
      timeout: 30000,
    });
    return resp.data;
  }

  /**
   * PATCH to mark an asset upload as complete.
   */
  async assetPatch<T = unknown>(path: string, data: unknown): Promise<T> {
    await this.ensureSession();
    const url = `${config.baseUrl}/api/assets/v2/workspaces/${config.workspaceSlug}${path}`;
    const resp = await axios.patch(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': this.sessionCookie!,
        'X-CSRFToken': this.csrfToken!,
      },
      timeout: 30000,
    });
    return resp.data;
  }

  /**
   * Upload a file to a presigned URL using multipart/form-data.
   * @param uploadUrl The presigned upload URL (e.g., http://localhost/uploads)
   * @param fields The policy fields from the asset creation response
   * @param fileBuffer The file content as a Buffer
   * @param fileName The file name
   * @param contentType MIME type
   */
  async uploadToPresigned(
    uploadUrl: string,
    fields: Record<string, string>,
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
  ): Promise<void> {
    const form = new FormData();
    // Add all policy fields first (order matters for S3 presigned)
    for (const [key, value] of Object.entries(fields)) {
      form.append(key, value);
    }
    // File must be last
    form.append('file', fileBuffer, { filename: fileName, contentType });

    await axios.post(uploadUrl, form, {
      headers: form.getHeaders(),
      timeout: 120000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
  }

  // ── Error handling ────────────────────────────────────────────

  private handleError(error: AxiosError): never {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as Record<string, unknown> | undefined;
      const msg = data?.detail || data?.error || error.message;
      if (status === 401 || status === 403) {
        this.sessionCookie = null;
        throw new AuthenticationError(String(msg));
      }
      throw new PlaneApiError(String(msg), status, error.config?.url, data);
    }
    throw new PlaneApiError(error.message, 0, error.config?.url);
  }
}

export const planeClient = new PlaneClient();
