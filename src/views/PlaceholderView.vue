<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">{{ title }}</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent v-if="parent">{{ parent }}</a>
        <template v-if="parent"> / </template>
        <span class="breadcrumb-active">{{ title }}</span>
      </div>
    </div>

    <div class="card card-padded">
      <div class="empty-state">
        <div class="empty-state-icon">🚧</div>
        <p class="empty-state-title">Coming soon</p>
        <p class="empty-state-desc">This page is part of the Agent Portal admin tools and will be populated with real data once the backend is connected.</p>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'

const route = useRoute()
const title = computed(() => route.meta.title ?? 'Page')
const parent = computed(() => route.meta.parent ?? '')
</script>
