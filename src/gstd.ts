import createClient, { type Middleware } from "openapi-fetch";
import { GstcError, GstcErrorCode, GstdError } from "./types/error";
import type { paths } from "./types/gstd-api";

export interface GstdClientOptions {
  ip?: string;
  port?: number;
  url?: string;
}

const errorHandlingMiddleware: Middleware = {
  async onResponse({ response, request }) {
    let responseData: any;
    try {
      responseData = await response.clone().json();
    } catch {
      responseData = null;
    }

    if (
      responseData &&
      "code" in responseData &&
      "description" in responseData
    ) {
      const gstdCode = responseData.code;
      const description = responseData.description;

      if (gstdCode !== 0) {
        throw new GstdError(description, gstdCode);
      }
    }

    if (!response.ok) {
      if (responseData && "description" in responseData) {
        throw new GstdError(responseData.description, responseData.code || -1);
      }
      throw new GstcError(
        `HTTP ${response.status}: ${response.statusText}`,
        GstcErrorCode.GSTC_RECV_ERROR
      );
    }

    return response;
  },

  async onError({ error }) {
    if (error instanceof GstdError || error instanceof GstcError) {
      throw error;
    }

    if (
      error instanceof Error &&
      (error.name === "TypeError" || error.message?.includes("fetch"))
    ) {
      throw new GstcError(
        "Gstd did not respond. Is it up?",
        GstcErrorCode.GSTC_UNREACHABLE
      );
    }

    throw new GstcError("Unexpected error", GstcErrorCode.GSTC_RECV_ERROR);
  },
};

export class GstdClient {
  private client: ReturnType<typeof createClient<paths>>;

  constructor(options: GstdClientOptions = {}) {
    const baseUrl =
      options.url ??
      `http://${options.ip ?? "127.0.0.1"}:${options.port ?? 5001}`;

    this.client = createClient<paths>({ baseUrl });
    this.client.use(errorHandlingMiddleware);
  }

  async listPipelines() {
    const { data, error } = await this.client.GET("/pipelines");
    if (error) throw error;

    return data.response.nodes.map((node) => node.name);
  }

  async pipelineCreate(name: string, description: string) {
    const { data, error } = await this.client.POST("/pipelines", {
      params: {
        query: { name, description },
      },
    });
    if (error) throw error;
    return data;
  }

  async pipelinePlay(name: string) {
    const { data, error } = await this.client.PUT(
      "/pipelines/{pipelineName}/state",
      {
        params: {
          path: { pipelineName: name },
          query: { name: "playing" },
        },
      }
    );
    if (error) throw error;
    return data;
  }

  async pipelinePause(name: string) {
    const { data, error } = await this.client.PUT(
      "/pipelines/{pipelineName}/state",
      {
        params: {
          path: { pipelineName: name },
          query: { name: "paused" },
        },
      }
    );
    if (error) throw error;
    return data;
  }

  async pipelineStop(name: string) {
    const { data, error } = await this.client.PUT(
      "/pipelines/{pipelineName}/state",
      {
        params: {
          path: { pipelineName: name },
          query: { name: "null" },
        },
      }
    );
    if (error) throw error;
    return data;
  }

  async pipelineDelete(name: string) {
    const { data, error } = await this.client.DELETE("/pipelines", {
      params: {
        query: { name },
      },
    });
    if (error) throw error;
    return data;
  }

  async busRead(name: string) {
    const { data, error } = await this.client.GET(
      "/pipelines/{pipelineName}/bus/message",
      {
        params: {
          path: { pipelineName: name },
        },
      }
    );
    if (error) throw error;
    return data;
  }

  async busFilter(name: string, filter: string) {
    const { data, error } = await this.client.PUT(
      "/pipelines/{pipelineName}/bus/types",
      {
        params: {
          path: { pipelineName: name },
          query: { name: filter },
        },
      }
    );
    if (error) throw error;
    return data;
  }

  async waitForMessage(pipeline: string, filter: string, timeout?: number) {
    await this.busFilter(pipeline, filter);
    if (timeout) {
      await this.busTimeout(pipeline, timeout);
    }
    return this.busRead(pipeline);
  }

  async eventSeek(
    name: string,
    rate = 1.0,
    format = 3,
    flags = 1,
    startType = 1,
    start = 0,
    endType = 1,
    end = -1
  ) {
    const description = [
      rate,
      format,
      flags,
      startType,
      start,
      endType,
      end,
    ].join(" ");
    const { data, error } = await this.client.PUT(
      "/pipelines/{pipelineName}/event",
      {
        params: {
          path: { pipelineName: name },
          query: { name: "seek", description },
        },
      }
    );
    if (error) throw error;
    return data;
  }

  async elementSet(
    pipeName: string,
    elementName: string,
    property: string,
    value: any
  ) {
    const { data, error } = await this.client.PUT(
      "/pipelines/{pipelineName}/elements/{elementName}/properties/{propertyName}",
      {
        params: {
          path: { pipelineName: pipeName, elementName, propertyName: property },
          query: { name: value.toString() },
        },
      }
    );
    if (error) throw error;
    return data;
  }

  async busTimeout(pipeName: string, timeout: number) {
    const { data, error } = await this.client.PUT(
      "/pipelines/{pipelineName}/bus/timeout",
      {
        params: {
          path: { pipelineName: pipeName },
          query: { name: timeout },
        },
      }
    );
    if (error) throw error;
    return data;
  }

  async debugColor(enable: boolean) {
    const { data, error } = await this.client.PUT("/debug/color", {
      params: {
        query: { value: enable },
      },
    });
    if (error) throw error;
    return data;
  }

  async debugEnable(enable: boolean) {
    const { data, error } = await this.client.PUT("/debug/enable", {
      params: {
        query: { value: enable },
      },
    });
    if (error) throw error;
    return data;
  }

  async debugReset(enable: boolean) {
    const { data, error } = await this.client.PUT("/debug/reset", {
      params: {
        query: { value: enable },
      },
    });
    if (error) throw error;
    return data;
  }

  async debugThreshold(threshold: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 9) {
    const { data, error } = await this.client.PUT("/debug/threshold", {
      params: {
        query: { value: threshold },
      },
    });
    if (error) throw error;
    return data;
  }

  async elementGet(pipeName: string, elementName: string, property: string) {
    const { data, error } = await this.client.GET(
      "/pipelines/{pipelineName}/elements/{elementName}/properties/{propertyName}",
      {
        params: {
          path: { pipelineName: pipeName, elementName, propertyName: property },
        },
      }
    );
    if (error) throw error;
    return data.response;
  }

  async listElements(pipeName: string) {
    const { data, error } = await this.client.GET(
      "/pipelines/{pipelineName}/elements",
      {
        params: {
          path: { pipelineName: pipeName },
        },
      }
    );
    if (error) throw error;
    return data.response.nodes.map((node) => node.name);
  }

  async listProperties(pipeName: string, elementName: string) {
    const { data, error } = await this.client.GET(
      "/pipelines/{pipelineName}/elements/{elementName}/properties",
      {
        params: {
          path: { pipelineName: pipeName, elementName },
        },
      }
    );
    if (error) throw error;
    return data.response.nodes.map((node) => node.name);
  }

  async listSignals(pipeName: string, elementName: string) {
    const { data, error } = await this.client.GET(
      "/pipelines/{pipelineName}/elements/{elementName}/signals",
      {
        params: {
          path: { pipelineName: pipeName, elementName },
        },
      }
    );
    if (error) throw error;
    return data.response.nodes.map((node) => node.name);
  }

  async signalConnect(pipeName: string, elementName: string, signal: string) {
    const { data, error } = await this.client.GET(
      "/pipelines/{pipelineName}/elements/{elementName}/signals/{signalName}/callback",
      {
        params: {
          path: { pipelineName: pipeName, elementName, signalName: signal },
        },
      }
    );
    if (error) throw error;
    return data;
  }

  async signalDisconnect(
    pipeName: string,
    elementName: string,
    signal: string
  ) {
    const { data, error } = await this.client.GET(
      "/pipelines/{pipelineName}/elements/{elementName}/signals/{signalName}/disconnect",
      {
        params: {
          path: { pipelineName: pipeName, elementName, signalName: signal },
        },
      }
    );
    if (error) throw error;
    return data;
  }

  async signalTimeout(
    pipeName: string,
    elementName: string,
    signal: string,
    timeout: number
  ) {
    const { data, error } = await this.client.PUT(
      "/pipelines/{pipelineName}/elements/{elementName}/signals/{signalName}/timeout",
      {
        params: {
          path: { pipelineName: pipeName, elementName, signalName: signal },
          query: { timeout },
        },
      }
    );
    if (error) throw error;
    return data;
  }

  async waitForSignal(
    pipeName: string,
    elementName: string,
    signal: string,
    timeout: number
  ) {
    await this.signalTimeout(pipeName, elementName, signal, timeout);
    const waitingForSignal = this.signalConnect(pipeName, elementName, signal);
    return waitingForSignal;
  }

  async eventEos(pipeName: string) {
    const { data, error } = await this.client.POST(
      "/pipelines/{pipelineName}/event",
      {
        params: {
          path: { pipelineName: pipeName },
          query: { name: "eos" },
        },
      }
    );
    if (error) throw error;
    return data;
  }

  async eventFlushStart(pipeName: string) {
    const { data, error } = await this.client.POST(
      "/pipelines/{pipelineName}/event",
      {
        params: {
          path: { pipelineName: pipeName },
          query: { name: "flush_start" },
        },
      }
    );
    if (error) throw error;
    return data;
  }

  async eventFlushStop(pipeName: string) {
    const { data, error } = await this.client.POST(
      "/pipelines/{pipelineName}/event",
      {
        params: {
          path: { pipelineName: pipeName },
          query: { name: "flush_stop" },
        },
      }
    );
    if (error) throw error;
    return data;
  }

  async pipelineGetGraph(pipeName: string) {
    const { data, error } = await this.client.GET(
      "/pipelines/{pipelineName}/graph",
      {
        params: {
          path: { pipelineName: pipeName },
        },
      }
    );
    if (error) throw error;
    return data;
  }

  async pipelineVerbose(pipeName: string, enable: boolean) {
    const { data, error } = await this.client.PUT(
      "/pipelines/{pipelineName}/verbose",
      {
        params: {
          path: { pipelineName: pipeName },
          query: { value: enable },
        },
      }
    );
    if (error) throw error;
    return data;
  }
}
