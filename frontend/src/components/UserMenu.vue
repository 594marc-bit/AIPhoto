<template>
  <div class="user-menu-wrapper">
    <!-- API Status Indicator -->
    <q-icon
      v-if="!userStore.isApiConnected() && userStore.isAuthenticated"
      name="cloud_off"
      color="negative"
      size="sm"
      class="api-status-icon"
    >
      <q-tooltip>云端同步已断开</q-tooltip>
    </q-icon>

    <!-- Guest Button -->
    <q-btn
      v-if="userStore.isGuest"
      flat
      dense
      label="登录/注册"
      icon="login"
      @click="showAuthDialog = true"
    />

    <!-- User Menu -->
    <q-btn v-else flat dense round>
      <q-avatar size="32px" color="primary" text-color="white">
        {{ userStore.displayName.charAt(0).toUpperCase() }}
      </q-avatar>
      <q-menu>
        <q-list style="min-width: 200px">
          <q-item>
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white">
                {{ userStore.displayName.charAt(0).toUpperCase() }}
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ userStore.displayName }}</q-item-label>
              <q-item-label caption>
                {{ userStore.userTypeLabel }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-separator />

          <q-item clickable v-close-popup @click="showPermissionsInfo = true">
            <q-item-section avatar>
              <q-icon name="verified_user" />
            </q-item-section>
            <q-item-section>
              <q-item-label>我的权限</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="!userStore.isGuest" clickable v-close-popup @click="handleLogout">
            <q-item-section avatar>
              <q-icon name="logout" color="negative" />
            </q-item-section>
            <q-item-section>
              <q-item-label>退出登录</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="userStore.isGuest" clickable v-close-popup @click="showAuthDialog = true">
            <q-item-section avatar>
              <q-icon name="login" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>登录/注册</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>

    <!-- Auth Dialog -->
    <q-dialog v-model="showAuthDialog" persistent>
      <user-auth @success="handleAuthSuccess" />
    </q-dialog>

    <!-- Permissions Info Dialog -->
    <q-dialog v-model="showPermissionsInfo">
      <q-card>
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">当前权限</div>
        </q-card-section>

        <q-card-section>
          <q-list>
            <q-item>
              <q-item-section avatar>
                <q-icon :name="userStore.canSaveSettings ? 'check' : 'close'" :color="userStore.canSaveSettings ? 'positive' : 'negative'" />
              </q-item-section>
              <q-item-section>
                <q-item-label>保存设置</q-item-label>
                <q-item-label caption>登录后可保存个人设置到云端</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar>
                <q-icon :name="userStore.canUseCustomLogo ? 'check' : 'close'" :color="userStore.canUseCustomLogo ? 'positive' : 'negative'" />
              </q-item-section>
              <q-item-section>
                <q-item-label>自定义Logo</q-item-label>
                <q-item-label caption>登录后可上传并使用自定义Logo</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar>
                <q-icon :name="userStore.canBatchProcess ? 'check' : 'close'" :color="userStore.canBatchProcess ? 'positive' : 'negative'" />
              </q-item-section>
              <q-item-section>
                <q-item-label>批量处理</q-item-label>
                <q-item-label caption>
                  {{ userStore.isGuest ? '访客不支持批量处理' : `最多可处理 ${userStore.maxImagesPerBatch} 张图片` }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="userStore.isAdmin">
              <q-item-section avatar>
                <q-icon name="admin_panel_settings" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label>管理员权限</q-item-label>
                <q-item-label caption>拥有完整的系统管理权限</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="关闭" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Welcome Toast (shown after login) -->
    <q-dialog v-model="showWelcomeToast">
      <q-card class="bg-positive text-white">
        <q-card-section>
          <div class="text-h6 flex items-center">
            <q-icon name="check_circle" class="q-mr-sm" />
            欢迎，{{ userStore.displayName }}！
          </div>
        </q-card-section>
        <q-card-section>
          <div>您现在拥有完整的用户权限</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="开始使用" color="white" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '@/stores/userStore';
import UserAuth from './UserAuth.vue';

// Store
const userStore = useUserStore();

// State
const showAuthDialog = ref(false);
const showPermissionsInfo = ref(false);
const showWelcomeToast = ref(false);

// Methods
const handleAuthSuccess = () => {
  showAuthDialog.value = false;
  if (!userStore.isGuest) {
    showWelcomeToast.value = true;
  }
};

const handleLogout = () => {
  userStore.logout();
};
</script>

<style scoped>
.user-menu-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.api-status-icon {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
