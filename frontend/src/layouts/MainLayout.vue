<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> AI 照片边框处理 </q-toolbar-title>

        <div class="q-mr-md">Quasar v{{ $q.version }}</div>

        <!-- User Menu -->
        <user-menu />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> 菜单 </q-item-label>

        <q-item clickable to="/" exact>
          <q-item-section avatar>
            <q-icon name="photo_size_select_large" />
          </q-item-section>
          <q-item-section>
            <q-item-label>边框水印</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref } from 'vue';
import UserMenu from '@/components/UserMenu.vue';

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>
