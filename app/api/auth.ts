import { NextRequest } from "next/server";
import { getServerSideConfig } from "../config/server";
import md5 from "spark-md5";
import {
  ACCESS_CODE_PREFIX,
  OIDC_TOKEN_PREFIX,
  ModelProvider,
} from "../constant";
import { verifyOidcToken } from "../utils/oidc";

function getIP(req: NextRequest) {
  let ip = req.ip ?? req.headers.get("x-real-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (!ip && forwardedFor) {
    ip = forwardedFor.split(",").at(0) ?? "";
  }

  return ip;
}

function getSystemApiKey(
  serverConfig: ReturnType<typeof getServerSideConfig>,
  modelProvider: ModelProvider,
  req: NextRequest,
): string | undefined {
  switch (modelProvider) {
    case ModelProvider.Stability:
      return serverConfig.stabilityApiKey;
    case ModelProvider.GeminiPro:
      return serverConfig.googleApiKey;
    case ModelProvider.Claude:
      return serverConfig.anthropicApiKey;
    case ModelProvider.Doubao:
      return serverConfig.bytedanceApiKey;
    case ModelProvider.Ernie:
      return serverConfig.baiduApiKey;
    case ModelProvider.Qwen:
      return serverConfig.alibabaApiKey;
    case ModelProvider.Moonshot:
      return serverConfig.moonshotApiKey;
    case ModelProvider.Iflytek:
      return serverConfig.iflytekApiKey + ":" + serverConfig.iflytekApiSecret;
    case ModelProvider.DeepSeek:
      return serverConfig.deepseekApiKey;
    case ModelProvider.XAI:
      return serverConfig.xaiApiKey;
    case ModelProvider.ChatGLM:
      return serverConfig.chatglmApiKey;
    case ModelProvider.SiliconFlow:
      return serverConfig.siliconFlowApiKey;
    case ModelProvider.GPT:
    default:
      if (req.nextUrl.pathname.includes("azure/deployments")) {
        return serverConfig.azureApiKey;
      } else {
        return serverConfig.apiKey;
      }
  }
}

function parseApiKey(bearToken: string) {
  const token = bearToken.trim().replaceAll("Bearer ", "").trim();

  // OIDC token: starts with "oidc-"
  if (token.startsWith(OIDC_TOKEN_PREFIX)) {
    return {
      accessCode: "",
      apiKey: "",
      oidcToken: token.slice(OIDC_TOKEN_PREFIX.length),
    };
  }

  // Access code: starts with "nk-"
  const isApiKey = !token.startsWith(ACCESS_CODE_PREFIX);
  return {
    accessCode: isApiKey ? "" : token.slice(ACCESS_CODE_PREFIX.length),
    apiKey: isApiKey ? token : "",
    oidcToken: "",
  };
}

export async function auth(req: NextRequest, modelProvider: ModelProvider) {
  const authToken = req.headers.get("Authorization") ?? "";

  // check if it is openai api key or user token
  const { accessCode, apiKey, oidcToken } = parseApiKey(authToken);

  // OIDC token verification
  if (oidcToken) {
    try {
      await verifyOidcToken(oidcToken);
      console.log("[Auth] OIDC token verified");
      const serverConfig = getServerSideConfig();
      const systemApiKey = getSystemApiKey(serverConfig, modelProvider, req);
      if (systemApiKey) {
        req.headers.set("Authorization", `Bearer ${systemApiKey}`);
      }
      return { error: false };
    } catch (e) {
      console.error("[Auth] OIDC token verification failed:", e);
      return {
        error: true,
        msg: "invalid or expired OIDC token",
      };
    }
  }

  const hashedCode = md5.hash(accessCode ?? "").trim();

  const serverConfig = getServerSideConfig();
  console.log("[Auth] allowed hashed codes: ", [...serverConfig.codes]);
  console.log("[Auth] got access code:", accessCode);
  console.log("[Auth] hashed access code:", hashedCode);
  console.log("[User IP] ", getIP(req));
  console.log("[Time] ", new Date().toLocaleString());

  if (serverConfig.needCode && !serverConfig.codes.has(hashedCode) && !apiKey) {
    return {
      error: true,
      msg: !accessCode ? "empty access code" : "wrong access code",
    };
  }

  if (serverConfig.hideUserApiKey && !!apiKey) {
    return {
      error: true,
      msg: "you are not allowed to access with your own api key",
    };
  }

  // if user does not provide an api key, inject system api key
  if (!apiKey) {
    const serverConfig = getServerSideConfig();
    const systemApiKey = getSystemApiKey(serverConfig, modelProvider, req);
    if (systemApiKey) {
      console.log("[Auth] use system api key");
      req.headers.set("Authorization", `Bearer ${systemApiKey}`);
    } else {
      console.log("[Auth] admin did not provide an api key");
    }
  } else {
    console.log("[Auth] use user api key");
  }

  return {
    error: false,
  };
}
