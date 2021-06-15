import { endpoint } from "./consts"
import { get as getStoreValue } from "svelte/store"
import { authState } from "./auth"

export interface FetchOptions<Body = {}> {
  endpointName: string,
  body?: Body,
  method?: "GET" | "POST" | "PUT" | "DELETE",
  fetchMethod?: typeof fetch,
  dataKey?: string,
  errorKey?: string,
  headers?: {[key: string]: string},
  authorize?: boolean
}

export type FetchResponse<Body = any> = Promise<[Body, null] | [null, Error | string]>

const getAuthorizationHeader: () => string | null = () => {
  const { accessToken, isSignedIn } = getStoreValue(authState)
  if (isSignedIn) {
    return `Bearer ${accessToken}`
  }
  return null
}

export async function betterFetch<RequestBody = any, ResponseBody = any>(options: FetchOptions<RequestBody>): FetchResponse<ResponseBody> {
  const {
    endpointName, 
    body = null, 
    method = "GET",
    dataKey = null,
    errorKey = null,
    fetchMethod = fetch,
    headers = {},
    authorize = true
  } = options

  const res = await fetchMethod(
    endpoint(endpointName), 
    {
      method,
      body: method !== "GET" ? JSON.stringify(body) : null,
      headers: Object.entries({
        "Content-Type": "application/json", 
        // Add authorization header if it exists and if we want to
        ...(authorize && getAuthorizationHeader() ? {"Authorization": getAuthorizationHeader()} : {}), 
        ...headers
      })
    }
  )

  if (!res.ok) {
    return [null, res.statusText]
  }

  const data = await res.json()

  if (errorKey && data[errorKey]) {
    return [null, data[errorKey]]
  }

  return [dataKey ? data[dataKey] : data, null]
}