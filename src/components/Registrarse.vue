<template>
  <div class="register-container">
    <div class="brand">
      <span class="iconify logo-icon" data-icon="solar:bus-bold-duotone"></span>
      <h1>Viajá Inteligente</h1>
    </div>

    <h2>Crear cuenta de Dueño</h2>
    
    <form @submit.prevent="registrar" class="form">
      <div class="input-group">
        <label>Nombre del Negocio / Cooperativa</label>
        <div class="input-wrapper">
          <span class="iconify" data-icon="solar:shop-bold-duotone"></span>
          <input v-model="nombreNegocio" type="text" placeholder="Ej: Romero S.A." required />
        </div>
      </div>

      <div class="input-group">
        <label>Correo electrónico</label>
        <div class="input-wrapper">
          <span class="iconify" data-icon="solar:letter-bold-duotone"></span>
          <input v-model="email" type="email" placeholder="correo@ejemplo.com" required />
        </div>
      </div>

      <div class="input-group">
        <label>Contraseña</label>
        <div class="input-wrapper">
          <span class="iconify" data-icon="solar:lock-password-bold-duotone"></span>
          <input v-model="password" type="password" placeholder="********" required />
        </div>
      </div>

      <button type="submit" :disabled="loading" class="btn-register">
        <span v-if="!loading">{{ 'Registrar mi Negocio' }}</span>
        <span v-else class="iconify spin" data-icon="solar:restart-bold-duotone"></span>
      </button>
    </form>

    <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

    <div class="login-footer">
      <span>¿Ya tienes cuenta?</span>
      <button @click="router.push('/login')" class="btn-link">Inicia sesión</button>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <span class="iconify success-icon" data-icon="solar:check-circle-bold-duotone"></span>
        <h3>¡Registro Exitoso!</h3>
        <p>Tu cuenta ha sido creada. Ahora puedes configurar tus rutas.</p>
        <button @click="router.push('/login')" class="btn-modal">Ir al Login</button>
      </div>
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

const nombreNegocio = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const showModal = ref(false)
const router = useRouter()

const registrar = async () => {
  errorMessage.value = ''
  loading.value = true

  // 1. Registro en Auth
  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
  })

  if (error) {
    errorMessage.value = "Error: " + error.message
    loading.value = false
    return
  }

  // 2. Crear perfil en la tabla 'perfiles_duenos'
  if (data.user) {
    const { error: insertError } = await supabase.from('perfiles_duenos').insert({
      id: data.user.id,
      nombre_negocio: nombreNegocio.value,
      verificado: false
    })

    if (insertError) {
      errorMessage.value = "Perfil: " + insertError.message
      loading.value = false
      return
    }
  }

  showModal.value = true
  loading.value = false
  if (error) {
  if (error.status === 429) {
    errorMessage.value = "Demasiados intentos. Esperá un minuto antes de volver a probar."
  } else {
    errorMessage.value = error.message
  }
  loading.value = false
  return
}
}

</script>

<style scoped>
.register-container {
  max-width: 420px;
  margin: 8vh auto;
  padding: 2.5rem;
  background: white;
  border-radius: 2rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.05);
  font-family: 'Inter', sans-serif;
}

.brand { text-align: center; margin-bottom: 1rem; color: #d19a02; }
.logo-icon { font-size: 3rem; }
h1 { font-size: 1.2rem; font-weight: 800; margin-top: 0.5rem; text-transform: uppercase; }
h2 { text-align: center; color: #fdda78; font-size: 1rem; margin-bottom: 2rem; }

.input-group { margin-bottom: 1.5rem; }
.input-group label { display: block; font-size: 0.8rem; font-weight: 700; color: #d19a02; margin-bottom: 0.5rem; }

.input-wrapper {
  display: flex; align-items: center; background: #f8fafc;
  border: 2px solid #f1f5f9; border-radius: 1rem; padding: 0 1rem;
  transition: all 0.3s;
}

.input-wrapper:focus-within { border-color: #d19a02; background: white; }
.input-wrapper .iconify { color: #94a3b8; font-size: 1.2rem; }
.input-wrapper input {
  border: none; background: none; padding: 1rem; width: 100%; outline: none; font-size: 1rem;
}

.btn-register {
  width: 100%; padding: 1.2rem; background: #d19a02; color: white;
  border: none; border-radius: 1rem; font-weight: 700; font-size: 1rem;
  cursor: pointer; margin-top: 1rem; transition: 0.3s;
}

.btn-register:disabled { background: #94a3b8; }
.btn-register:active { transform: scale(0.98); }

.error-msg { color: #ef4444; text-align: center; font-size: 0.85rem; margin-top: 1rem; font-weight: 600; }

.login-footer { text-align: center; margin-top: 2rem; font-size: 0.9rem; color: #f7d67b; }
.btn-link { background: none; border: none; color: #d19a02; font-weight: 700; text-decoration: underline; cursor: pointer; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);
}
.modal {
  background: white; padding: 2.5rem; border-radius: 2rem; text-align: center; width: 85%; max-width: 350px;
}
.success-icon { font-size: 4rem; color: #10b981; margin-bottom: 1rem; }
.btn-modal {
  width: 100%; padding: 1rem; background: #d19a02; color: white; border: none; border-radius: 1rem; font-weight: 700; margin-top: 1.5rem;
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>