<template>
  <q-card class="auth-card">
    <q-card-section class="bg-primary text-white">
      <div class="text-h5 text-weight-bold text-center">
        {{ isLoginMode ? '用户登录' : '用户注册' }}
      </div>
    </q-card-section>

    <q-card-section>
      <q-form @submit="handleSubmit" class="q-gutter-md">
        <!-- Username -->
        <q-input
          v-model="formData.username"
          label="用户名"
          outlined
          dense
          :rules="[val => !!val || '请输入用户名', val => val.length >= 3 || '用户名至少3个字符']"
          lazy-rules
        >
          <template v-slot:prepend>
            <q-icon name="person" />
          </template>
        </q-input>

        <!-- Email (only for registration) -->
        <q-input
          v-if="!isLoginMode"
          v-model="formData.email"
          label="邮箱"
          outlined
          dense
          type="email"
          :rules="[(val: string) => !!val || '请输入邮箱', (val: string) => /.+@.+\..+/.test(val) || '请输入有效的邮箱']"
          lazy-rules
        >
          <template v-slot:prepend>
            <q-icon name="email" />
          </template>
        </q-input>

        <!-- Password -->
        <q-input
          v-model="formData.password"
          label="密码"
          outlined
          dense
          :type="showPassword ? 'text' : 'password'"
          :rules="[(val: string) => !!val || '请输入密码', (val: string) => val.length >= 6 || '密码至少6个字符']"
          lazy-rules
        >
          <template v-slot:prepend>
            <q-icon name="lock" />
          </template>
          <template v-slot:append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>

        <!-- Confirm Password (only for registration) -->
        <q-input
          v-if="!isLoginMode"
          v-model="formData.confirmPassword"
          label="确认密码"
          outlined
          dense
          :type="showConfirmPassword ? 'text' : 'password'"
          :rules="[
            (val: string) => !!val || '请确认密码',
            (val: string) => val === formData.password || '两次密码不一致'
          ]"
          lazy-rules
        >
          <template v-slot:prepend>
            <q-icon name="lock" />
          </template>
          <template v-slot:append>
            <q-icon
              :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showConfirmPassword = !showConfirmPassword"
            />
          </template>
        </q-input>

        <!-- Error Message -->
        <q-banner v-if="errorMessage" class="bg-negative text-white rounded-borders">
          <template v-slot:avatar>
            <q-icon name="error" />
          </template>
          {{ errorMessage }}
        </q-banner>

        <!-- Submit Button -->
        <q-btn
          type="submit"
          :label="isLoginMode ? '登录' : '注册'"
          color="primary"
          class="full-width"
          :loading="isLoading"
          :disable="isLoading"
          size="md"
        />
      </q-form>
    </q-card-section>

    <q-card-section class="text-center">
      <q-btn
        flat
        :label="isLoginMode ? '没有账号？立即注册' : '已有账号？返回登录'"
        color="primary"
        @click="toggleMode"
      />
    </q-card-section>

    <!-- Permissions Info -->
    <q-card-section class="bg-grey-1">
      <div class="text-subtitle2 text-grey-8 q-mb-sm">用户权限对比：</div>
      <q-markup-table dense flat bordered>
        <thead>
          <tr>
            <th class="text-left">功能</th>
            <th class="text-center">访客</th>
            <th class="text-center">注册用户</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>保存设置</td>
            <td class="text-center"><q-icon name="close" color="negative" /></td>
            <td class="text-center"><q-icon name="check" color="positive" /></td>
          </tr>
          <tr>
            <td>自定义Logo</td>
            <td class="text-center"><q-icon name="close" color="negative" /></td>
            <td class="text-center"><q-icon name="check" color="positive" /></td>
          </tr>
          <tr>
            <td>批量处理</td>
            <td class="text-center">5张</td>
            <td class="text-center">50张</td>
          </tr>
          <tr>
            <td>导出设置</td>
            <td class="text-center"><q-icon name="close" color="negative" /></td>
            <td class="text-center"><q-icon name="check" color="positive" /></td>
          </tr>
        </tbody>
      </q-markup-table>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive } from 'vue';
import { useUserStore } from '@/stores/userStore';
import type { LoginCredentials, RegisterData } from '@/types/user';

// Emits
const emit = defineEmits<{
  success: [];
}>();

// Store
const userStore = useUserStore();

// State
const isLoginMode = ref(true);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const errorMessage = ref('');
const isLoading = ref(false);

// Form data
const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
});

// Methods
const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value;
  errorMessage.value = '';
  // Clear form
  formData.username = '';
  formData.email = '';
  formData.password = '';
  formData.confirmPassword = '';
};

const handleSubmit = async () => {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    if (isLoginMode.value) {
      // Login
      const credentials: LoginCredentials = {
        username: formData.username,
        password: formData.password,
      };

      const result = await userStore.login(credentials);

      if (result.success) {
        emit('success');
      } else {
        errorMessage.value = result.error ?? '登录失败';
      }
    } else {
      // Register
      const registerData: RegisterData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      };

      const result = await userStore.register(registerData);

      if (result.success) {
        emit('success');
      } else {
        errorMessage.value = result.error ?? '注册失败';
      }
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.auth-card {
  max-width: 500px;
  width: 100%;
}

.full-width {
  width: 100%;
}
</style>
