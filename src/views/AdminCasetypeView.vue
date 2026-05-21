<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Casetype Appeal Enabled</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Casetype Appeal Enabled</span>
      </div>
    </div>

    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">All case types</div>
        <div class="flex items-center gap-sm">
          <span class="text-sm text-light">{{ rows.length }} entries</span>
          <select v-model.number="perPage" style="width:auto;padding:5px 10px;font-size:12px">
            <option :value="10">10</option><option :value="25">25</option>
          </select>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th @click="sort('name')" class="sortable">Name {{ sortIcon('name') }}</th>
              <th @click="sort('code')" class="sortable">Code {{ sortIcon('code') }}</th>
              <th>Appeal Disabled</th>
              <th style="text-align:right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pagedRows" :key="row.id">
              <td>{{ row.name }}</td>
              <td><span class="badge badge-primary">{{ row.code }}</span></td>
              <td>
                <label class="toggle" :aria-label="`Toggle disable for ${row.name}`">
                  <input type="checkbox" v-model="row.disabled" />
                  <span class="toggle-track"></span>
                </label>
              </td>
              <td style="text-align:right"><button class="btn btn-secondary btn-sm" @click="openEdit(row)">Edit</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <button class="page-btn" :disabled="page===1" @click="page--">‹ Prev</button>
        <button v-for="p in totalPages" :key="p" class="page-btn" :class="{active:p===page}" @click="page=p">{{ p }}</button>
        <button class="page-btn" :disabled="page===totalPages" @click="page++">Next ›</button>
        <span class="page-meta">{{ rows.length }} total</span>
      </div>
    </div>

    <AdminModal v-if="modalOpen" title="Edit Case Type" size="md" mode="edit" @close="modalOpen=false" @save="save">
      <div class="form-group">
        <label class="form-label">Name <span class="req">*</span></label>
        <input v-model.trim="form.name" maxlength="80" />
        <span v-if="errors.name" class="form-error">{{ errors.name }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">Code <span class="req">*</span></label>
        <input v-model.trim="form.code" maxlength="20" style="text-transform:uppercase" />
        <span v-if="errors.code" class="form-error">{{ errors.code }}</span>
      </div>
      <div class="form-group inline-row">
        <label class="form-label">Appeal Disabled</label>
        <label class="toggle"><input type="checkbox" v-model="form.disabled" /><span class="toggle-track"></span></label>
      </div>
    </AdminModal>
  </AppLayout>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AdminModal from '@/components/AdminModal.vue'

const page = ref(1)
const perPage = ref(10)
const sortKey = ref('name')
const sortDir = ref('asc')

const rows = reactive([
  { id:1,  name:'Car park',      code:'PCN',   disabled:false },
  { id:2,  name:'EMP',           code:'EMP',   disabled:false },
  { id:3,  name:'EPF',           code:'EPF',   disabled:true  },
  { id:4,  name:'EUN',           code:'EUN',   disabled:false },
  { id:5,  name:'Fraud team',    code:'FT',    disabled:true  },
  { id:6,  name:'FT',            code:'FT',    disabled:false },
  { id:7,  name:'FT-CR',         code:'FT-CR', disabled:false },
  { id:8,  name:'FT-DR',         code:'FT-DR', disabled:false },
  { id:9,  name:'MG cautions',   code:'MG',    disabled:true  },
  { id:10, name:'MG11',          code:'MG11',  disabled:false },
  { id:11, name:'MICS',          code:'MICS',  disabled:false },
  { id:12, name:'PCN',           code:'PCN',   disabled:false },
  { id:13, name:'PFN',           code:'PFN',   disabled:false },
  { id:14, name:'UFN',           code:'UFN',   disabled:false },
  { id:15, name:'Zero fare',     code:'ZF',    disabled:true  }
])

const sorted = computed(() =>
  [...rows].sort((a,b) => {
    const mul = sortDir.value === 'asc' ? 1 : -1
    return a[sortKey.value] > b[sortKey.value] ? mul : -mul
  })
)

const totalPages = computed(() => Math.max(1, Math.ceil(sorted.value.length / perPage.value)))
const pagedRows  = computed(() => sorted.value.slice((page.value-1)*perPage.value, page.value*perPage.value))

function sort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}
function sortIcon(k) { return sortKey.value===k ? (sortDir.value==='asc'?'↑':'↓') : '' }

const modalOpen = ref(false)
const form = reactive({ id:0, name:'', code:'', disabled:false })
const errors = reactive({})

function openEdit(r){
  Object.keys(errors).forEach(k=>delete errors[k])
  Object.assign(form, r)
  modalOpen.value = true
}
function save(){
  Object.keys(errors).forEach(k=>delete errors[k])
  let ok = true
  if(!form.name) { errors.name='Please enter name'; ok=false }
  if(!form.code) { errors.code='Please enter code'; ok=false }
  if(!ok) return
  form.code = form.code.toUpperCase()
  const r = rows.find(x => x.id === form.id)
  if(r) Object.assign(r, { name:form.name, code:form.code, disabled:form.disabled })
  modalOpen.value = false
}
</script>
