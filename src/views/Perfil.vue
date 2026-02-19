<template>
  <div class="perfil-container">
    <header class="perfil-header">
      <div class="header-top">
        
        <div class="user-identity" v-if="usuario">
          <span class="welcome-txt">Hola,</span>
          <h2 class="user-name">{{ usuario.email.split('@')[0] }}</h2>
        </div>
        <h1 v-else>Mi Perfil</h1>

        <button @click="verificarYCrear" class="btn-add" title="Nuevo Servicio">
          +
        </button>
      </div>

      <div class="header-stats" v-if="usuario">
        <div class="stat-badge">
          <Icon icon="solar:bus-bold-duotone" />
          <span>{{ servicios.length }} Activos</span>
        </div>
        <button @click="mostrarModalLogout = true" class="btn-logout-minimal">
          <Icon icon="solar:logout-2-bold-duotone" />
          Salir
        </button>
      </div>
    </header>

    <main class="perfil-content">
      <div v-if="!usuario" class="auth-card">
        <div class="auth-icon">
          <Icon icon="solar:shield-user-bold-duotone" />
        </div>
        <h3>¿Sos transportista?</h3>
        <p>Iniciá sesión para publicar tus horarios de bus, taxi o moto y llegar a más pasajeros.</p>
        <div class="auth-actions">
          <button @click="router.push('/login')" class="btn-primary">Iniciar Sesión</button>
          <button @click="router.push('/registrarse')" class="btn-secondary">Crear Cuenta Gratis</button>
        </div>
      </div>

      <template v-else>
        <div v-if="servicios.length === 0" class="empty-state">
          <Icon icon="solar:bus-stop-bold-duotone" />
          <p>Aún no tenés servicios publicados.</p>
          <button @click="abrirModalCrear" class="btn-text">Publicar mi primer servicio</button>
        </div>

        <div v-for="item in servicios" :key="item.id" class="service-card">
          <img :src="item.foto_url" class="card-img" @error="item.foto_url = 'https://via.placeholder.com/150'" />
          <div class="card-info">
            <span class="type-badge" :class="item.tipo">{{ item.tipo }}</span>
            <h3>{{ item.origen }} <Icon icon="solar:arrow-right-bold" v-if="item.destino" /> {{ item.destino }}</h3>
            <p v-if="item.tipo !== 'taxi' && item.tipo !== 'moto'" class="price">
              C$ {{ item.precio }}
            </p>  
          </div>
          <div class="card-actions">
            <button @click="abrirModalEditar(item)" class="btn-icon edit">
              <Icon icon="solar:pen-new-square-bold-duotone" />
            </button>
            <button @click="abrirConfirmacion(item.id)" class="btn-icon delete">
              <Icon icon="solar:trash-bin-trash-bold-duotone" />
            </button>
          </div>
        </div>
      </template>
    </main>

    <div v-if="mostrarModalLogout" class="modal-overlay centered">
      <div class="modal-alert">
        <div class="alert-icon warning">
          <Icon icon="solar:logout-3-bold-duotone" />
        </div>
        <h3>¿Cerrar sesión?</h3>
        <p>Tendrás que ingresar de nuevo para gestionar tus rutas en Apvinic.</p>
        <div class="alert-btns">
          <button @click="cerrarSesion" class="btn-danger">Cerrar Sesión</button>
          <button @click="mostrarModalLogout = false" class="btn-ghost">Cancelar</button>
        </div>
      </div>
    </div>

    <div v-if="idABorrar" class="modal-overlay centered">
      <div class="modal-alert">
        <div class="alert-icon danger">
          <Icon icon="solar:danger-bold-duotone" />
        </div>
        <h3>¿Eliminar publicación?</h3>
        <p>Esta acción no se puede deshacer. Los pasajeros ya no verán este servicio.</p>
        <div class="alert-btns">
          <button @click="eliminarServicio" class="btn-danger" :disabled="loading">
            {{ loading ? 'Borrando...' : 'Sí, eliminar' }}
          </button>
          <button @click="idABorrar = null" class="btn-ghost">Cancelar</button>
        </div>
      </div>
    </div>

    <div v-if="mostrarModal" class="modal-overlay bottom">
      <div class="modal-sheet">
        <header class="sheet-header">
          <h2>{{ editandoId ? 'Actualizar Servicio' : 'Nueva Publicación' }}</h2>
          <button @click="mostrarModal = false" class="btn-close">✕</button>
        </header>

        <div class="sheet-body">
          <div class="form-group">
            <label>Tipo de Unidad</label>
            <div class="custom-select">
              <Icon :icon="tipoIcono" />
              <select v-model="tipoServicio">
                <option value="bus">Ruta / Bus Expreso</option>
                <option value="taxi">Taxi / Colectivo</option>
                <option value="moto">Moto Mandado</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Foto Real</label>
            <div class="photo-upload" @click="triggerFile">
              <img v-if="tempImageUrl" :src="tempImageUrl" class="preview" />
              <div v-else class="placeholder">
                <Icon icon="solar:camera-add-bold-duotone" />
                <span>Tocar para subir</span>
              </div>
              <input type="file" ref="fileInput" @change="handleFile" hidden accept="image/*" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Origen</label>
              <input v-model="form.origen" placeholder="Ej: Estelí" />
            </div>
            <div class="form-group" v-if="tipoServicio === 'bus'">
              <label>Destino</label>
              <input v-model="form.destino" placeholder="Ej: Managua" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" v-if="tipoServicio === 'bus'">
              <label>Precio (C$)</label>
              <input v-model="form.precio" type="number" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label>WhatsApp</label>
              <input v-model="form.whatsapp" type="tel" placeholder="88888888" />
            </div>
          </div>

          <button @click="guardarServicio" class="btn-submit" :disabled="loading">
            {{ loading ? 'Guardando...' : 'Publicar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { createClient } from '@supabase/supabase-js';
import { Icon } from '@iconify/vue';

const router = useRouter();
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY);

// Estados de Usuario y UI
const usuario = ref(null);
const loading = ref(false);
const mostrarModal = ref(false);
const mostrarModalLogout = ref(false);
const idABorrar = ref(null);
const servicios = ref([]);
const editandoId = ref(null);

// Formulario
const tipoServicio = ref('bus');
const fileInput = ref(null);
const tempImageUrl = ref(null);
const fotoArchivo = ref(null);
const form = reactive({ origen: '', destino: '', precio: '', whatsapp: '' });

// Lógica de Autenticación
const checkAuth = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  usuario.value = user;
  if (user) fetchServicios();
};

const verificarYCrear = () => {
  if (!usuario.value) router.push('/login');
  else abrirModalCrear();
};

const cerrarSesion = async () => {
  await supabase.auth.signOut();
  usuario.value = null;
  servicios.value = [];
  mostrarModalLogout.value = false;
  router.push('/login');
};

// Lógica de Datos
const fetchServicios = async () => {
  const { data } = await supabase.from('servicios').select('*').eq('dueno_id', usuario.value.id).order('creado_at', { ascending: false });
  servicios.value = data || [];
};

const abrirModalCrear = () => {
  editandoId.value = null;
  Object.assign(form, { origen: '', destino: '', precio: '', whatsapp: '' });
  tempImageUrl.value = null;
  mostrarModal.value = true;
};

const abrirModalEditar = (item) => {
  editandoId.value = item.id;
  tipoServicio.value = item.tipo;
  Object.assign(form, item);
  tempImageUrl.value = item.foto_url;
  mostrarModal.value = true;
};

const triggerFile = () => fileInput.value.click();
const handleFile = (e) => {
  const file = e.target.files[0];
  if (file) {
    fotoArchivo.value = file;
    tempImageUrl.value = URL.createObjectURL(file);
  }
};

const guardarServicio = async () => {
  if (!form.origen ) return alert("Completá los campos básicos");
  loading.value = true;
  try {
    let url = tempImageUrl.value;
    if (fotoArchivo.value) {
      const path = `${usuario.value.id}/${Date.now()}`;
      await supabase.storage.from('fotos_servicios').upload(path, fotoArchivo.value);
      url = supabase.storage.from('fotos_servicios').getPublicUrl(path).data.publicUrl;
    }

    const payload = { 
        ...form, 
        tipo: tipoServicio.value, 
        foto_url: url, 
        dueno_id: usuario.value.id,
        destino: tipoServicio.value === 'bus' ? form.destino : ''
    };
    
    const res = editandoId.value 
      ? await supabase.from('servicios').update(payload).eq('id', editandoId.value)
      : await supabase.from('servicios').insert(payload);

    if (res.error) throw res.error;
    mostrarModal.value = false;
    fetchServicios();
  } catch (e) { alert(e.message); } 
  finally { loading.value = false; }
};

const eliminarServicio = async () => {
  loading.value = true;
  await supabase.from('servicios').delete().eq('id', idABorrar.value);
  idABorrar.value = null;
  loading.value = false;
  fetchServicios();
};

const tipoIcono = computed(() => {
  const icons = { bus: 'solar:bus-bold-duotone', taxi: 'solar:automotive-bold-duotone', moto: 'solar:motorbike-bold-duotone' };
  return icons[tipoServicio.value];
});

onMounted(checkAuth);
</script>

<style scoped>
/* VARIABLES Y RESET */
.perfil-container {
  --primary: #d19a02;
  --dark: #1e293b;
  --gray: #64748b;
  --bg: #f1f5f9;
  background: var(--bg);
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
}

/* HEADER PROFESIONAL */
.perfil-header {
  background: var(--primary);
  padding: 1.5rem 1.5rem 3.5rem;
  color: white;
  border-radius: 0 0 2rem 2rem;
  box-shadow: 0 4px 12px rgba(209, 154, 2, 0.3);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-icon { font-size: 1.6rem; cursor: pointer; }

.user-identity .welcome-txt { font-size: 0.75rem; opacity: 0.9; display: block; }
.user-identity .user-name { font-size: 1.2rem; margin: 0; font-weight: 800; text-transform: capitalize; }

.btn-add {
  background: white;
  color: var(--primary);
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.7rem;
  margin-top: 7px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.header-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 1.2rem;
}

.stat-badge {
  background: rgba(255,255,255,0.2);
  padding: 6px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.btn-logout-minimal {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.5);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* CONTENIDO PRINCIPAL */
.perfil-content {
  padding: 0 1.2rem;
  margin-top: -2rem;
}

/* CARD DE AUTENTICACIÓN */
.auth-card {
  background: white;
  padding: 2.5rem 1.5rem;
  border-radius: 1.5rem;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
}

.auth-icon { font-size: 4rem; color: var(--primary); margin-bottom: 1rem; }
.auth-actions { display: flex; flex-direction: column; gap: 0.8rem; margin-top: 1.5rem; }

/* CARDS DE SERVICIO */
.service-card {
  background: white;
  border-radius: 1.2rem;
  padding: 0.8rem;
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
  border: 1px solid rgba(0,0,0,0.03);
}

.card-img { width: 80px; height: 80px; border-radius: 1rem; object-fit: cover; }

.card-info { flex: 1; }
.card-info h3 { font-size: 0.95rem; margin: 4px 0; color: var(--dark); display: flex; align-items: center; gap: 5px; }

.type-badge {
  font-size: 0.6rem;
  font-weight: 900;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 5px;
}
.type-badge.bus { background: #e0f2fe; color: #0369a1; }
.type-badge.taxi { background: #fef9c3; color: #854d0e; }
.type-badge.moto { background: #dcfce7; color: #166534; }

.price { color: #16a34a; font-weight: 800; margin: 0; }

.card-actions { display: flex; flex-direction: column; gap: 0.5rem; }
.btn-icon { padding: 8px; border-radius: 50%; border: none; cursor: pointer; font-size: 1.1rem; }
.btn-icon.edit { background: #f1f5f9; color: var(--gray); }
.btn-icon.delete { background: #fee2e2; color: #ef4444; }

/* MODALES */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
}

.modal-overlay.centered { align-items: center; justify-content: center; padding: 1.5rem; }
.modal-overlay.bottom { align-items: flex-end; }

.modal-alert {
  background: white;
  width: 100%;
  max-width: 340px;
  padding: 2rem;
  border-radius: 1.5rem;
  text-align: center;
}

.alert-icon { font-size: 3.5rem; margin-bottom: 1rem; }
.alert-icon.warning { color: var(--primary); }
.alert-icon.danger { color: #ef4444; }

.alert-btns { display: flex; flex-direction: column; gap: 0.8rem; margin-top: 1.5rem; }

.modal-sheet {
  background: white;
  width: 100%;
  border-radius: 2rem 2rem 0 0;
  padding: 2rem;
  max-height: 90vh;
  overflow-y: auto;
}

.sheet-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }

/* FORMULARIO */
.form-group { margin-bottom: 1.2rem; }
.form-group label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--gray); text-transform: uppercase; margin-bottom: 0.4rem; }

.custom-select, input {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 1rem;
  padding: 0.8rem 1rem;
  width: 100%;
  outline: none;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.custom-select select {
  border: none;
  background: transparent;
  flex: 1;
  font-size: 1rem;
  outline: none;
}
.custom-select option{
  opacity: 0;
}
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.photo-upload {
  height: 150px;
  border: 2px dashed #cbd5e1;
  border-radius: 1.2rem;
  display: flex;
  align-items: center;
  background: #f8fafc;
  cursor: pointer;
  overflow: hidden;
  width: 100%;
}

.photo-upload .preview { width: 100%; height: 100%; object-fit: cover; }
.photo-upload .placeholder { width: 100%; margin-left: 30%; color: var(--gray);  }
.photo-upload .placeholder span { font-size: 1.2rem; width: 100%; text-align: center; }

/* BOTONES */
.btn-primary, .btn-submit { background: var(--primary); color: white; border: none; padding: 1rem; border-radius: 1rem; font-weight: 700; width: 100%; font-size: 1rem; }
.btn-secondary { background: white; border: 2px solid var(--primary); color: var(--primary); padding: 1rem; border-radius: 1rem; font-weight: 700; }
.btn-danger { background: #ef4444; color: white; border: none; padding: 1rem; border-radius: 1rem; font-weight: 700; }
.btn-ghost { background: transparent; border: none; color: var(--gray); font-weight: 600; padding: 0.8rem; }
.btn-close { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; }

.empty-state { text-align: center; padding: 4rem 1rem; color: var(--gray); opacity: 0.6; }
.empty-state .iconify { font-size: 4rem; }

input[type="file"]{
  opacity: 0;
  
}
.btn-text {
  background: transparent;
  border-radius: 0.5rem;
  color: var(--primary);
  font-weight: 600;
  padding: 0.8rem;
  font-size: .9rem;
  text-align: left;
}
</style>