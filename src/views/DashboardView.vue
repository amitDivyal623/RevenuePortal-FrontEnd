<template>
  <AppLayout>
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
      </div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> / <span class="breadcrumb-active">Dashboard</span>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon stat-icon-indigo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Open cases</div>
          <div class="stat-value">1,284</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-green">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Resolved this week</div>
          <div class="stat-value">312</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-orange">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Pending actions</div>
          <div class="stat-value">87</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-red">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Overdue</div>
          <div class="stat-value">14</div>
        </div>
      </div>
    </div>

    <div class="card card-padded">
      <div class="card-title">Welcome to Agent Portal</div>
      <p class="text-muted" style="font-size:13px">
        Use the left navigation to access Revenue Protection cases, the action tracker, print queue,
        and admin tools. To configure workflow actions, open
        <RouterLink :to="{ name: 'action-template' }" class="link-cell">Revenue Protection Admin → Action Template</RouterLink>.
      </p>
    </div>
  </AppLayout>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
</script>
