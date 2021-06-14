import { endpoint, REFRESH_TOKEN_KEY } from "./consts"
import { writable, get as getStoreValue } from "svelte/store"
import {browser} from "$app/env"

export const authState = writable({
  accessToken: "",
  refreshToken: browser ? localStorage.getItem(REFRESH_TOKEN_KEY) ?? "" : "",
  isSignedIn: false,
  meta: {}
})

function setTokens({refresh_token = null, token = null, ...meta}) {
  const access_token = token // API of function is like this to allow us to give response directly to function
  authState.update(currentState => {
    const newState = {...currentState}

    if (access_token) {
      newState.accessToken = access_token
      newState.isSignedIn = true
    } else {
      newState.accessToken = ""
      newState.isSignedIn = false
    }

    if (refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token)
      newState.refreshToken = refresh_token
    } else {
      localStorage.setItem(REFRESH_TOKEN_KEY, null)
      newState.refreshToken = ""
    }

    newState.meta = meta

    return newState
  })
}

type DoneOrError<T = any> = [T | null, string | null]
type AsyncDoneOrError<T = any> = Promise<DoneOrError<T>>

const fetchOrError = async ({endpointName, body = {}, method = "GET"}) => {
  const res = await fetch(endpoint(endpointName), {
    method,
    body: method !== "GET" ? JSON.stringify(body) : null,
    headers: Object.entries({"Content-Type": "application/json"})
  })

  if (!res.ok) {
    console.log({ failedRefreshResponse: res })
    return [null, "response not ok"]
  }

  const data = await res.json()
  if (data.error) {
    return [null, data.error]
  }

  return [data, null]
}

export const refreshAccessToken: () => AsyncDoneOrError = async () => {
  const currentRefreshToken = getStoreValue(authState).refreshToken
  if (!currentRefreshToken) {
    return [null, "not logged in"]
  }

  const [res, error] = await fetchOrError({ 
    endpointName: "users/refresh", 
    body: {refresh_token: currentRefreshToken},
    method: "POST" 
  })

  if (error) {
    return [null, error]
  }
  
  setTokens(res.data)
  return [getStoreValue(authState).accessToken, null]
}

export const signIn: (email: string, password: string) => AsyncDoneOrError = async (email, password) => {
  if (getStoreValue(authState).isSignedIn) {
    return [null, "already logged in"]
  }

  const [res, error] = await fetchOrError({
    endpointName: "users/signin",
    method: "POST",
    body: {email, password}
  })

  if (error) {
    return [null, error]
  }

  setTokens(res.data)
  return [getStoreValue(authState).isSignedIn, null]
}

export const signout: () => AsyncDoneOrError = async () => {
  const currentAuthState = getStoreValue(authState)
  if (!currentAuthState.isSignedIn) {
    return [null, "not signed in"]
  }

  const [res, error] = await fetchOrError({
    endpointName: "users/signout",
    method: "POST",
    body: {
      refresh_token: currentAuthState.refreshToken
    }
  })

  if (error) {
    return [null, error]
  }
   
  setTokens({ refresh_token: null, token: null })
  return [res.data.success, null]
}

export const signup: (email: string, password: string) => AsyncDoneOrError = async (email, password) => {
  const currentAuthState = getStoreValue(authState)
  if (currentAuthState.isSignedIn) {
    return [null, "already signed in"]
  }

  const [res, error] = await fetchOrError({
    endpointName: "users/signup",
    method: "POST",
    body: {user: {email, password}},
  })

  if (error) {
    return [null, error]
  }

  setTokens(res.data)
  return [getStoreValue(authState).isSignedIn, null]
} 
