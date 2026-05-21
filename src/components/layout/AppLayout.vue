<template>
  <div class="app-shell">
    <AppSidebar v-show="!sidebarHidden" />
    <div class="app-main">
      <AppTopbar @toggle-sidebar="sidebarHidden = !sidebarHidden" />
      <main class="app-content page-enter" id="main-content" tabindex="-1">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'

const sidebarHidden = ref(false)
</script>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
  background: var(--bg-page);
}
.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.app-content {
  flex: 1;
  padding: 24px 28px 32px;
  overflow-y: auto;
}
</style>
