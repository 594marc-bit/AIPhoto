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

    <!-- Footer with ICP filing information -->
    <q-footer class="bg-white text-black">
      <q-toolbar class="flex flex-center" style="min-height: 60px;">
        <div class="text-center q-gutter-sm">
          <div class="text-caption text-grey-7">
            20260129V1.1
          </div>
          <div class="text-caption">
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              class="text-grey-8"
              style="text-decoration: none;"
            >
              沪ICP备2025143813号
            </a>
          </div>
          <div class="text-caption">
            <a
              href="https://beian.mps.gov.cn/#/query/webSearch?code=31010402335782"
              target="_blank"
              rel="noreferrer"
              class="text-grey-8"
              style="text-decoration: none;"
            >
              沪公网安备31010402335782号
            </a>
          </div>
        </div>
      </q-toolbar>
    </q-footer>
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
