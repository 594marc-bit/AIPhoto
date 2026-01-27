<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';

// Initialize user store on app mount
const userStore = useUserStore();

onMounted(() => {
  void userStore.initialize();
});
</script>
