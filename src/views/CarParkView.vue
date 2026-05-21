<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Car Park Locations</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Car Park Locations</span>
      </div>
    </div>

    <div class="card card-padded mb-lg">
      <div class="card-title">Filters</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Station</label>
          <select v-model="filterStation">
            <option value="">All stations</option>
            <option v-for="s in stations" :key="s.Id" :value="s.Id">{{ s.station_name }}</option>
          </select>
        </div>
      </div>
      <div class="flex gap-sm mt-md">
        <button class="btn btn-primary btn-sm" @click="page=1">Search</button>
        <button class="btn btn-secondary btn-sm" @click="filterStation='';page=1">Clear filters</button>
      </div>
    </div>

    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">Car Parks ({{ filtered.length }})</div>
        <button class="btn btn-primary btn-sm" @click="openAdd">+ Add Car Park</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Station</th><th>Car Park Location</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
          <tbody>
            <tr v-if="filtered.length===0"><td colspan="4"><div class="empty-state"><div class="empty-state-icon">🅿️</div><p class="empty-state-title">No car parks found</p></div></td></tr>
            <tr v-for="row in filtered" :key="row.car_park_id">
              <td><strong>{{ stationName(row.station_id) }}</strong></td>
              <td>{{ row.carpark_name }}</td>
              <td><span :class="`badge badge-${row.active===1?'success':'neutral'}`">{{ row.active===1?'Active':'Disabled' }}</span></td>
              <td style="text-align:right">
                <div class="flex gap-xs" style="justify-content:flex-end">
                  <button class="btn btn-secondary btn-sm" @click="openView(row)">View</button>
                  <button class="btn btn-secondary btn-sm" @click="openEdit(row)">Edit</button>
                  <button class="btn btn-danger btn-sm" @click="openDelete(row)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <AdminModal v-if="modalOpen" :title="modalTitle" size="md" :mode="modalMode" @close="closeModal" @save="saveCp">
      <div class="form-group">
        <label class="form-label">Car Park Location <span class="req">*</span></label>
        <input v-model.trim="form.carpark_name" :disabled="modalMode==='view'" placeholder="Car Park Location" maxlength="120" />
        <span v-if="errors.carpark_name" class="form-error">{{ errors.carpark_name }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">Select Station <span class="req">*</span></label>
        <select v-model="form.station_id" :disabled="modalMode==='view'">
          <option value="">Please Select</option>
          <option v-for="s in stations" :key="s.Id" :value="s.Id">{{ s.station_name }}</option>
        </select>
        <span v-if="errors.station_id" class="form-error">{{ errors.station_id }}</span>
      </div>
      <div class="form-group inline-row">
        <label class="form-label">Status</label>
        <label class="toggle"><input type="checkbox" v-model="form.active" :true-value="1" :false-value="0" :disabled="modalMode==='view'" /><span class="toggle-track"></span></label>
      </div>
    </AdminModal>

    <ConfirmDelete v-if="deleteOpen" title="Delete car park" :detail="deleteTarget?.carpark_name" @cancel="deleteOpen=false" @confirm="confirmDelete" />
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AdminModal from '@/components/AdminModal.vue'
import ConfirmDelete from '@/components/ConfirmDelete.vue'
import { carParks as seed, stations } from '@/mock/carParkData.js'

const rows = reactive([...seed])
const filterStation = ref('')
const page = ref(1)
const modalOpen = ref(false)
const modalMode = ref('add')
const deleteOpen = ref(false)
const deleteTarget = ref(null)

const blank = () => ({ car_park_id:'', station_id:'', carpark_name:'', active:1 })
const form = reactive(blank())
const errors = reactive({})

const modalTitle = computed(() => modalMode.value==='add'?'Add Car Park':modalMode.value==='edit'?'Edit Car Park':'View Car Park')
const filtered = computed(() => rows.filter(r => !filterStation.value || r.station_id === filterStation.value))

function stationName(id){ return stations.find(s=>s.Id===id)?.station_name ?? id }
function reset(){ Object.assign(form, blank()); Object.keys(errors).forEach(k=>delete errors[k]) }
function openAdd(){ reset(); modalMode.value='add'; modalOpen.value=true }
function load(r){ Object.assign(form, blank(), { ...r }) }
function openEdit(r){ reset(); load(r); modalMode.value='edit'; modalOpen.value=true }
function openView(r){ reset(); load(r); modalMode.value='view'; modalOpen.value=true }
function closeModal(){ modalOpen.value=false; reset() }
function openDelete(r){ deleteTarget.value=r; deleteOpen.value=true }
function confirmDelete(){ const t=rows.find(x=>x.car_park_id===deleteTarget.value?.car_park_id); if(t) t.active=0; deleteOpen.value=false }
function uuid(){ return 'CP-'+(crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2)).slice(0,8) }
function validate(){
  Object.keys(errors).forEach(k=>delete errors[k]); let ok=true
  if(!form.carpark_name) { errors.carpark_name='Please enter car park location'; ok=false }
  if(!form.station_id) { errors.station_id='Please select station'; ok=false }
  return ok
}
function saveCp(){
  if(!validate()) return
  if(modalMode.value==='add') rows.push({ car_park_id:uuid(), station_id:form.station_id, carpark_name:form.carpark_name, active:form.active })
  else { const r=rows.find(x=>x.car_park_id===form.car_park_id); if(r) Object.assign(r, { station_id:form.station_id, carpark_name:form.carpark_name, active:form.active }) }
  closeModal()
}
</script>
