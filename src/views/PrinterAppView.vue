<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Printer App Control</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Printer App Control</span>
      </div>
    </div>

    <div class="card card-padded mb-lg">
      <div class="card-title">Filters</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Case Type</label>
          <select v-model="filterCaseType">
            <option value="">All</option>
            <option v-for="ct in caseTypes" :key="ct.case_type_id" :value="ct.case_type_id">{{ ct.case_option }}</option>
          </select>
        </div>
      </div>
      <div class="flex gap-sm mt-md">
        <button class="btn btn-primary btn-sm">Search</button>
        <button class="btn btn-secondary btn-sm" @click="filterCaseType=''">Clear filters</button>
      </div>
    </div>

    <div class="card card-padded">
      <div class="card-title">Printer App Toggles</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Description</th><th>Case Option</th><th>Enabled</th><th style="text-align:right">Actions</th></tr></thead>
          <tbody>
            <tr v-for="row in filtered" :key="row.ID">
              <td>{{ row.description }}</td>
              <td><span class="badge badge-primary">{{ row.case_option }}</span></td>
              <td>
                <label class="toggle">
                  <input type="checkbox" v-model="row.enabled" :true-value="1" :false-value="0" />
                  <span class="toggle-track"></span>
                </label>
              </td>
              <td style="text-align:right">
                <button class="btn btn-secondary btn-sm" @click="openEdit(row)">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <AdminModal v-if="modalOpen" title="Edit Printer App Control" size="md" mode="edit" @close="modalOpen=false" @save="save">
      <div class="form-group">
        <label class="form-label">Case Type</label>
        <input :value="form.case_option" disabled />
      </div>
      <div class="form-group inline-row">
        <label class="form-label">Enable</label>
        <label class="toggle"><input type="checkbox" v-model="form.enabled" :true-value="1" :false-value="0" /><span class="toggle-track"></span></label>
      </div>
    </AdminModal>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AdminModal from '@/components/AdminModal.vue'
import { printerAppRows as seed, caseTypes } from '@/mock/appControlData.js'

const rows = reactive([...seed])
const filterCaseType = ref('')
const modalOpen = ref(false)
const form = reactive({ ID:'', case_type_id:'', case_option:'', description:'', enabled:0 })

const filtered = computed(() => rows.filter(r => !filterCaseType.value || r.case_type_id === filterCaseType.value))

function openEdit(r){ Object.assign(form, r); modalOpen.value=true }
function save(){ const r=rows.find(x=>x.ID===form.ID); if(r) Object.assign(r, { enabled:form.enabled }); modalOpen.value=false }
</script>
