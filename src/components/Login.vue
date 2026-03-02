<template>
  <div class="login-container">
    <div class="brand">
      <span class="iconify" data-icon="solar:bus-bold-duotone"></span>
      <h1>Apvinic</h1>
    </div>

    <form @submit.prevent="handleLogin" class="login-form">
      <div class="input-group">
        <label>Correo electrónico</label>
        <input 
          v-model="email" 
          type="email" 
          placeholder="correo@correo.com" 
          required 
        />
      </div>

      <div class="input-group">
        <label>Contraseña</label>
        <input 
          v-model="password" 
          type="password" 
          placeholder="********" 
          required 
        />
      </div>

      <button type="submit" :disabled="loading" class="btn-login">
        {{ loading ? 'Iniciando...' : 'Entrar' }}
      </button>
    </form>

    <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

    <div class="footer">
      <p>¿No tienes cuenta? <span @click="router.push('/registrarse')">Regístrate</span></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'vue-router'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  errorMessage.value = ''
  loading.value = true

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  if (error) {
    // Crítica: Manejo de errores específicos para no confundir al usuario
    if (error.message === 'Invalid login credentials') {
      errorMessage.value = "Correo o contraseña incorrectos."
    } else {
      errorMessage.value = error.message
    }
    loading.value = false
    return
  }

  // Si el login es exitoso, mandamos al dashboard
  router.push('/perfil')
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 15vh auto;
  padding: 2.5rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  font-family: 'Inter', sans-serif;
}

.brand { text-align: center; color: #d19a02; margin-bottom: 2rem; }
.brand h1 { font-size: 1.8rem; margin-top: 0.5rem; }

.input-group { margin-bottom: 1.2rem; }
.input-group label { display: block; font-size: 0.85rem; font-weight: 700; color: #f7d883; margin-bottom: 0.5rem; }
.input-group input {
  width: 100%; padding: 0.8rem; border: 1.5px solid #e2e8f0; border-radius: 10px; outline: none; transition: 0.3s;
}
.input-group input:focus { border-color: #d19a02; }

.btn-login {
  width: 100%; padding: 1rem; background: #d19a02; color: white;
  border: none; border-radius: 10px; font-weight: 700; cursor: pointer; transition: 0.3s;
}
.btn-login:disabled { background: #eecf7b; }

.error-msg { color: #dc2626; text-align: center; margin-top: 1rem; font-size: 0.9rem; font-weight: 600; }

.footer { text-align: center; margin-top: 1.5rem; color: #fdd76e; font-size: 0.9rem; }
.footer span { color: #d19a02; font-weight: 700; cursor: pointer; text-decoration: underline; }
</style>