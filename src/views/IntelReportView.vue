<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Intelligence Report Config</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Intelligence Report Config</span>
      </div>
    </div>

    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">Intelligence Report Configuration</div>
        <button class="btn btn-primary btn-sm" @click="openEditConfig">Edit Config</button>
      </div>
      <div class="form-group">
        <label class="form-label">Email Address</label>
        <input :value="config.EmailAddress" disabled />
      </div>
      <div class="form-group">
        <label class="form-label">Pre-configuration Message</label>
        <div class="html-preview" v-html="config.PreConfermationMessage"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Confirmation Message</label>
        <div class="html-preview" v-html="config.ConfermationMessage"></div>
      </div>
    </div>

    <AdminModal v-if="configOpen" title="Edit Intelligence Report Configuration" size="lg" mode="edit" @close="configOpen=false" @save="saveConfig">
      <div class="form-group">
        <label class="form-label">Email Address <span class="req">*</span></label>
        <input v-model.trim="configForm.EmailAddress" type="email" placeholder="email@example.com" />
        <span v-if="errors.EmailAddress" class="form-error">{{ errors.EmailAddress }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">Pre-configuration Message</label>
        <textarea v-model="configForm.PreConfermationMessage" rows="6" style="font-family:ui-monospace,Monaco,monospace;font-size:12px"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Confirmation Message</label>
        <textarea v-model="configForm.ConfermationMessage" rows="6" style="font-family:ui-monospace,Monaco,monospace;font-size:12px"></textarea>
      </div>
    </AdminModal>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AdminModal from '@/components/AdminModal.vue'
import { useIntelReportStore } from '@/store/intel-report.store.js'

const store = useIntelReportStore()
onMounted(() => store.init())

const config = computed(() => store.config)
const configOpen = ref(false)
const configForm = reactive({ EmailAddress:'', PreConfermationMessage:'', ConfermationMessage:'' })
const errors = reactive({})

function openEditConfig(){ Object.assign(configForm, config.value); configOpen.value=true }
async function saveConfig(){
  Object.keys(errors).forEach(k=>delete errors[k])
  if(!configForm.EmailAddress || !/^.+@.+\..+$/.test(configForm.EmailAddress)) { errors.EmailAddress='Please enter a valid email'; return }
  await store.saveConfig({ ...configForm })
  configOpen.value = false
}
</script>

<style scoped>
.html-preview { padding: 10px 12px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-page); font-size: 13px; min-height: 70px; }
.html-preview :deep(p) { margin-bottom: 6px; }
</style>
