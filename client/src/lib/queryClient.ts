import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

type ApiRequestOptions = {
  method: string;
  url: string;
  data?: unknown;
};

export async function apiRequest(
  options: ApiRequestOptions
): Promise<any>;

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<any>;

export async function apiRequest(...args: any[]): Promise<any> {
  let method: string;
  let url: string;
  let data: unknown | undefined;

  if (args.length === 1 && typeof args[0] === 'object') {
    const options = args[0] as ApiRequestOptions;
    method = options.method;
    url = options.url;
    data = options.data;
  } else {
    [method, url, data] = args;
  }

  // Verificar se é FormData ou dados normais
  const isFormData = data instanceof FormData;
  
  // Prepara o objeto de configuração básico
  const fetchConfig: RequestInit = {
    method,
    credentials: "include",
  };
  
  // Adiciona os headers e body apropriados dependendo do tipo de dados
  if (isFormData) {
    // Não adiciona Content-Type para FormData (o navegador configura automaticamente)
    fetchConfig.body = data as FormData;
  } else if (data) {
    fetchConfig.headers = { "Content-Type": "application/json" };
    fetchConfig.body = JSON.stringify(data);
  }
  
  const res = await fetch(url, fetchConfig);

  await throwIfResNotOk(res);
  return res.json().catch(() => null);
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
