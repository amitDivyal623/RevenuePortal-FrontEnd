<template>
  <div class="modal-overlay" @click.self="$emit('cancel')" role="dialog" aria-modal="true">
    <div class="modal modal-sm">
      <div class="modal-header">
        <h2 class="modal-title">{{ title }}</h2>
        <button type="button" class="modal-close" @click="$emit('cancel')" aria-label="Close">×</button>
      </div>
      <div class="modal-body">
        <strong>{{ message }}</strong>
        <p v-if="detail" class="text-muted" style="margin-top:8px;font-size:13px">{{ detail }}</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-success" @click="$emit('cancel')">Cancel</button>
        <button type="button" class="btn btn-danger" @click="$emit('confirm')">Delete</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title:   { type: String, default: 'Confirm Delete' },
  message: { type: String, default: 'Are you sure you want to delete this record?' },
  detail:  { type: String, default: '' }
})
defineEmits(['cancel', 'confirm'])
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(30, 34, 54, 0.42);
  display: flex; align-items: center; justify-content: center;
  z-index: 1200;
  padding: 24px;
}
.modal {
  background: #fff;
  border-radius: var(--radius);
  width: 100%; max-width: 440px;
  box-shadow: 0 20px 60px rgba(30, 34, 54, 0.25);
  overflow: hidden;
  display: flex; flex-direction: column;
}
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
.modal-body { padding: 20px; }
.modal-footer {
  display: flex; gap: 8px; justify-content: flex-end;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  background: var(--bg-page);
}
</style>
