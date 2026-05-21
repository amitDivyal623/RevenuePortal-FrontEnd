<template>
  <div class="modal-overlay" @click.self="$emit('close')" role="dialog" aria-modal="true" :aria-label="title">
    <div class="modal" :class="`modal-${size}`">
      <div class="modal-header">
        <h2 class="modal-title">{{ title }}</h2>
        <button type="button" class="modal-close" @click="$emit('close')" aria-label="Close">×</button>
      </div>

      <form class="modal-body" :class="bodyClass" @submit.prevent="$emit('save')" novalidate>
        <slot />
        <div class="modal-footer">
          <slot name="footer">
            <button v-if="mode==='view'" type="button" class="btn btn-secondary" @click="$emit('close')">Close</button>
            <template v-else>
              <button type="button" class="btn btn-secondary" @click="$emit('close')">Cancel</button>
              <button type="submit" class="btn btn-primary">Save</button>
            </template>
          </slot>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title:     { type: String, required: true },
  size:      { type: String, default: 'md' },   // sm | md | lg | xl
  mode:      { type: String, default: 'add' },  // add | edit | view
  bodyClass: { type: String, default: '' }
})
defineEmits(['close', 'save'])
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(30, 34, 54, 0.42);
  display: flex; align-items: center; justify-content: center;
  z-index: 1200;
  padding: 24px;
  animation: fadeIn 120ms ease-out;
}
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
.modal {
  background: #fff;
  border-radius: var(--radius);
  width: 100%;
  box-shadow: 0 20px 60px rgba(30, 34, 54, 0.25);
  overflow: hidden;
  display: flex; flex-direction: column;
  max-height: 90vh;
}
.modal-sm { max-width: 440px; }
.modal-md { max-width: 620px; }
.modal-lg { max-width: 860px; }
.modal-xl { max-width: 1080px; }
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px;
  background: var(--primary);
  color: #fff;
}
.modal-title { font-size: 15px; font-weight: 600; }
.modal-close {
  background: transparent; color: #fff;
  font-size: 22px; line-height: 1;
  padding: 0 6px;
  border-radius: 4px;
}
.modal-close:hover { background: rgba(255,255,255,0.15); }
.modal-body {
  padding: 20px;
  overflow-y: auto;
  display: flex; flex-direction: column;
  gap: 14px;
}
.modal-footer {
  margin: 20px -20px -20px;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  background: var(--bg-page);
  display: flex; gap: 8px; justify-content: flex-end;
  align-items: center;
}
</style>

<style>
/* Global helpers used inside admin modals — not scoped so view-level
   form-groups still get them. */
.modal-body .req { color: var(--danger); margin-left: 2px; }
.modal-body .inline-row { flex-direction: row; align-items: center; justify-content: space-between; }
.modal-body .inline-row .form-label { margin: 0; }
.modal-body .input-prefix {
  display: flex; align-items: stretch;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: border-color var(--transition);
  background: #fff;
}
.modal-body .input-prefix:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light); }
.modal-body .input-prefix .prefix {
  padding: 8px 12px;
  background: var(--bg-page);
  color: var(--text-muted);
  font-weight: 600;
  border-right: 1px solid var(--border);
}
.modal-body .input-prefix input { border: none; border-radius: 0; flex: 1; }
.modal-body .input-prefix input:focus { box-shadow: none; }
.modal-body textarea { min-height: 80px; font-family: inherit; resize: vertical; }
.modal-body .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 720px) { .modal-body .grid-2 { grid-template-columns: 1fr; } }
</style>
