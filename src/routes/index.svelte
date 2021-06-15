<script lang="ts">
  import { refreshAccessToken, signIn, authState, signout, signup } from "$lib/auth";
  import { onMount } from "svelte";

  let email = "";
  let password = "";
  let loading = true;
  let componentError = null

  onMount(async () => {
    componentError = null
    const [_, error] = await refreshAccessToken();
    error && (componentError = error)
    loading = false
  });

  const resetInputs = () => {
    email = "";
    password = "";
  }

  const handleSubmit = async () => {
    loading = true
    componentError = null
    const [_, error] = await signIn(email, password);
    error && (componentError = error)
    loading = false
    resetInputs()
  };

  const handleRefresh = async () => {
    loading = true
    componentError = null
    const [_, error] = await refreshAccessToken();
    error && (componentError = error)
    loading = false
  };

  const handleSignout = async () => {
    loading = true
    componentError = null
    const [_, error] = await signout();
    error && (componentError = error)
    loading = false
  };

  const handleSignup = async () => {
    loading = true
    componentError = null
    const [_, error] = await signup(email, password)
    error && (componentError = error)
    loading = false
    resetInputs()
  }
</script>

<template>
  <div class="container">
    {#if componentError}
    <p>error: {typeof componentError === "string" ? componentError : componentError.message}</p>
    {/if}
    {#if loading}
    <p>Loading...</p>
    {:else if $authState.isSignedIn}
    <p>hi!</p>
    <p>access: <code>{$authState.accessToken}</code></p>
    <p>refresh: <code>{$authState.refreshToken}</code></p>
    <p>metadata:</p>
    <pre>
      {JSON.stringify($authState.meta, null, 2)}
    </pre>
    <button on:click="{handleRefresh}">refresh access token</button>
    <button on:click="{handleSignout}">sign out</button>
    {:else}
    <form on:submit|preventDefault="{handleSubmit}">
      <label for="email">email</label>
      <input type="email" name="email" id="email" bind:value="{email}" />
      <label for="password">password</label>
      <input
        type="password"
        name="password"
        id="password"
        bind:value="{password}" />
      <button type="submit">sign in</button>
      <button on:click="{handleSignup}" type="button">sign up</button>
    </form>
    {/if}
  </div>
</template>

<style>
  .container {
    padding: 1rem;
  }
  code, pre {
    display: block;
    max-width: 100%;
    max-height: 30ch;
    min-height: 10ch;
    overflow-y: scroll;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    padding: 0.5rem 1rem;
    background: #333;
    color: #f5f5f5;
    margin: 1rem 0;
  }
  @media (min-width: 768px) {
    .container {
      max-width: calc(100vw - 400px);
      margin: 0 auto;
    }
  } 
</style>