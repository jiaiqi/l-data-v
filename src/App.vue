<script setup>
// import HelloWorld from './components/HelloWorld.vue'
// import PageEditor from "@/views/page-editor/index";
</script>

<template>
  <div id="app">
    <!-- <PageEditor /> -->
    <!-- <header>
      <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

      <div class="wrapper">
        <HelloWorld msg="You did it!" />

        <nav>
          <router-link to="/">Home</router-link>
          <router-link to="/about">About</router-link>
        </nav>
      </div>
    </header> -->

    <router-view />
  </div>
</template>

<style>
html,
body {
  margin: 0;
  padding: 0;
}
</style>
