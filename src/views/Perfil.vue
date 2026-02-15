<template>
  <div class="perfil-container">
    <header class="perfil-header">
      <div class="header-top">
        
        <Icon @click="router.back()" icon="mdi:exit-to-app" style="color: white; background-color: var(--primary);" />
        <h1>Mis Publicaciones</h1>
        <button @click="abrirModalCrear" class="btn-add">
          <span>+</span>
        </button>
      </div>
      <div class="stats-mini">
        <p>{{ servicios.length }} servicios activos</p>
      </div>
    </header>

    <main class="perfil-form">
      <div v-if="servicios.length === 0" class="empty-state">
        <span class="iconify" data-icon="solar:bus-stop-bold-duotone"></span>
        <p>No tienes servicios publicados todavía.</p>
      </div>

      <div v-for="item in servicios" :key="item.id" class="service-card">
        <img :src="item.foto_url" class="card-img" />
        <div class="card-info">
          <div class="type-badge" :class="item.tipo">{{ item.tipo }}</div>
          <h3>{{ item.origen }} <span v-if="item.destino">→ {{ item.destino }}</span></h3>
          <p class="price">C$ {{ item.precio }}</p>
        </div>
        <div class="card-actions">
          <button @click="abrirModalEditar(item)" class="btn-edit">
            <span class="iconify" data-icon="solar:pen-new-square-bold-duotone"></span>
          </button>
          <button @click="abrirConfirmacion(item.id)" class="btn-del">
            <span class="iconify" data-icon="solar:trash-bin-trash-bold-duotone"></span>
          </button>
        </div>
      </div>
    </main>

    <div v-if="idABorrar" class="modal-overlay confirm-overlay">
      <div class="modal-confirm-content">
        <div class="confirm-icon">
          <span class="iconify" data-icon="solar:danger-bold-duotone"></span>
        </div>
        <h3>¿Eliminar publicación?</h3>
        <p>Esta acción es permanente. Tu servicio dejará de aparecer en las búsquedas de los pasajeros.</p>
        <div class="confirm-actions">
          <button @click="idABorrar = null" class="btn-cancel">Cancelar</button>
          <button @click="eliminarServicio" class="btn-confirm-del" :disabled="loading">
            {{ loading ? 'Borrando...' : 'Sí, eliminar' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="mostrarModal" class="modal-overlay">
      <div class="modal-content">
        <header class="modal-header">
          <h2>{{ editandoId ? 'Editar Servicio' : 'Nuevo Servicio' }}</h2>
          <button @click="mostrarModal = false" class="btn-close">×</button>
        </header>

        <div class="modal-body">
          <div class="input-group">
            <label>Tipo de servicio</label>
            <div class="input-wrapper select-wrapper">
              <span class="iconify" :data-icon="tipoIcono"></span>
              <select v-model="tipoServicio" class="select-custom">
                <option value="bus"> Ruta / Bus</option>
                <option value="taxi"> Taxi</option>
                <option value="moto"> Motomandado</option>
              </select>
            </div>
          </div>

          <div class="input-group">
            <label>Foto de la Unidad</label>
            <div class="upload-container" @click="triggerFile">
              <img v-if="tempImageUrl" :src="tempImageUrl" class="preview-img" />
              <div v-else class="upload-placeholder">
                <span class="iconify" data-icon="solar:camera-add-bold-duotone"></span>
                <p>{{ editandoId ? 'Cambiar foto' : 'Subir foto' }}</p>
              </div>
              <input type="file" ref="fileInput" @change="handleFile" hidden accept="image/*">
            </div>
          </div>

          <template v-if="tipoServicio === 'bus'">
            <div class="input-group">
              <label>Ruta</label>
              <div class="input-row">
                <div class="input-wrapper"><input v-model="form.origen" type="text" placeholder="Origen"></div>
                <div class="input-wrapper"><input v-model="form.destino" type="text" placeholder="Destino"></div>
              </div>
            </div>
            <div class="input-group">
              <label>Hora de Salida</label>
              <div class="input-wrapper">
                <input v-model="form.hora_salida" type="time">
              </div>
            </div>
          </template>

          <template v-else>
            <div class="input-group">
              <label>Zona de Cobertura</label>
              <div class="input-wrapper">
                <input v-model="form.origen" type="text" placeholder="Ej: Estelí">
              </div>
            </div>
          </template>

          <div class="input-group">
            <label>Precio (C$)</label>
            <div class="input-wrapper">
              <input v-model="form.precio" type="number" placeholder="0.00">
            </div>
          </div>

          <div class="input-group">
            <label>WhatsApp</label>
            <div class="input-wrapper">
              <input v-model="form.whatsapp" type="tel" placeholder="88888888">
            </div>
          </div>

          <button @click="guardarServicio" :disabled="loading" class="btn-save">
            <span>{{ loading ? 'Procesando...' : (editandoId ? 'Guardar Cambios' : 'Publicar Ahora') }}</span>
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

import { Icon } from '@iconify/vue'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const router = useRouter();
const loading = ref(false);
const mostrarModal = ref(false);
const idABorrar = ref(null); // Estado para el modal de confirmación
const servicios = ref([]);
const editandoId = ref(null);

// Formulario reactivo
const tipoServicio = ref('bus');
const fileInput = ref(null);
const tempImageUrl = ref(null);
const fotoArchivo = ref(null);
const form = reactive({ origen: '', destino: '', hora_salida: '', precio: '', whatsapp: '' });

const tipoIcono = computed(() => {
  if (tipoServicio.value === 'bus') return 'solar:bus-bold-duotone';
  if (tipoServicio.value === 'taxi') return 'solar:automotive-bold-duotone';
  return 'solar:motorbike-bold-duotone';
});

const cargarServicios = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('servicios')
    .select('*')
    .eq('dueno_id', user.id)
    .order('creado_at', { ascending: false });
  if (!error) servicios.value = data;
};

const abrirConfirmacion = (id) => {
  idABorrar.value = id;
};

const eliminarServicio = async () => {
  loading.value = true;
  const { error } = await supabase.from('servicios').delete().eq('id', idABorrar.value);
  loading.value = false;
  
  if (error) {
    alert("Error al borrar");
  } else {
    idABorrar.value = null;
    cargarServicios();
  }
};

// ... (abrirModalCrear, abrirModalEditar, handleFile, guardarServicio permanecen igual)
const abrirModalCrear = () => {
  editandoId.value = null;
  form.origen = ''; form.destino = ''; form.hora_salida = ''; form.precio = ''; form.whatsapp = '';
  tempImageUrl.value = null; fotoArchivo.value = null;
  mostrarModal.value = true;
};

const abrirModalEditar = (item) => {
  editandoId.value = item.id;
  tipoServicio.value = item.tipo;
  form.origen = item.origen;
  form.destino = item.destino;
  form.hora_salida = item.hora_salida;
  form.precio = item.precio;
  form.whatsapp = item.whatsapp;
  tempImageUrl.value = item.foto_url;
  fotoArchivo.value = null;
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
  if (!editandoId.value && !fotoArchivo.value) return alert("Subí una foto");
  loading.value = true;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    let finalUrl = tempImageUrl.value;

    if (fotoArchivo.value) {
      const file = fotoArchivo.value;
      const fileName = `${user.id}/${Date.now()}.${file.name.split('.').pop()}`;
      await supabase.storage.from('fotos_servicios').upload(fileName, file);
      const { data: { publicUrl } } = supabase.storage.from('fotos_servicios').getPublicUrl(fileName);
      finalUrl = publicUrl;
    }

    const payload = {
      dueno_id: user.id,
      tipo: tipoServicio.value,
      origen: form.origen,
      destino: tipoServicio.value === 'bus' ? form.destino : 'Local',
      hora_salida: tipoServicio.value === 'bus' ? form.hora_salida : null,
      precio: parseFloat(form.precio),
      whatsapp: form.whatsapp,
      foto_url: finalUrl
    };

    let res = editandoId.value 
      ? await supabase.from('servicios').update(payload).eq('id', editandoId.value)
      : await supabase.from('servicios').insert(payload);

    if (res.error) throw res.error;
    mostrarModal.value = false;
    cargarServicios();
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    loading.value = false;
  }
};

onMounted(cargarServicios);
</script>

<style scoped>
/* REUTILIZO TUS ESTILOS Y AGREGO LOS DEL MODAL DE CONFIRMACIÓN */
.perfil-container { --primary: #d19a02; --bg: #f8fafc; --text-muted: #64748b; background: var(--bg); min-height: 100vh; font-family: sans-serif; padding-bottom: 2rem;}
.perfil-header { background: var(--primary); padding: 2rem 1.5rem 4rem; border-radius: 0 0 2.5rem 2.5rem; color: white; }
.header-top { display: flex; justify-content: space-between; align-items: center; }
.btn-add { background: #ffffff; border: none; border-radius: 50%;  font-size: 1.5rem; color: #d19a02; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2);  width: 24px; height: 24px; }

.perfil-form { padding: 1.5rem; margin-top: -3rem; display: flex; flex-direction: column; gap: 1rem; }

/* SERVICE CARDS */
.service-card { background: white; border-radius: 1.2rem; padding: 1rem; display: flex; gap: 1rem; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
.card-img { width: 75px; height: 75px; border-radius: 0.8rem; object-fit: cover; }
.card-info { flex: 1; }
.card-info h3 { font-size: 0.9rem; margin: 4px 0; color: #1e293b; }
.type-badge { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; padding: 2px 8px; border-radius: 6px; display: inline-block; }
.type-badge.bus { background: #dbeafe; color: #1e40af; }
.type-badge.taxi { background: #fef9c3; color: #a16207; }
.type-badge.moto { background: #dcfce7; color: #15803d; }
.price { font-weight: 800; color: #15803d; font-size: 0.95rem; margin: 0; }

.card-actions { display: flex; gap: 0.5rem; }
.btn-edit { background: #f1f5f9; color: #475569; border: none; padding: 0.6rem; border-radius: 50%; cursor: pointer; display: flex; }
.btn-del { background: #fee2e2; color: #dc2626; border: none; padding: 0.6rem; border-radius: 50%; cursor: pointer; display: flex; }

/* MODALES */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: flex-end; z-index: 100; backdrop-filter: blur(2px); }
.modal-content { background: white; width: 100%; border-radius: 2rem 2rem 0 0; padding: 2rem; max-height: 92vh; overflow-y: auto; }

/* MODAL CONFIRMACIÓN ESPECÍFICO */
.confirm-overlay { align-items: center; justify-content: center; padding: 2rem; }
.modal-confirm-content { background: white; width: 100%; max-width: 320px; border-radius: 1.5rem; padding: 2rem; text-align: center; }
.confirm-icon { color: #dc2626; font-size: 3rem; margin-bottom: 1rem; }
.modal-confirm-content h3 { margin: 0 0 0.5rem; color: #1e293b; }
.modal-confirm-content p { color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem; line-height: 1.4; }
.confirm-actions { display: flex; flex-direction: column; gap: 0.75rem; }
.btn-confirm-del { background: #dc2626; color: white; border: none; padding: 1rem; border-radius: 0.8rem; font-weight: 700; cursor: pointer; }
.btn-cancel { background: #f1f5f9; color: #475569; border: none; padding: 1rem; border-radius: 0.8rem; font-weight: 600; cursor: pointer; }

/* REUTILIZO TUS ESTILOS DE FORMULARIO */
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem; }
.btn-close { background: #f1f5f9; border: none; font-size: 1.2rem; width: 32px; height: 32px; border-radius: 50%; }
.input-group label { display: block; font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.4rem; }
.input-wrapper { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 1rem; display: flex; align-items: center; padding: 0 1rem; margin-bottom: 0.8rem; }
.input-wrapper input, .select-custom { border: none; padding: 0.9rem; width: 100%; outline: none; background: transparent; font-size: 1rem; }
.upload-container { border: 2px dashed #cbd5e1; border-radius: 1rem; height: 140px; display: flex; justify-content: center; align-items: center; overflow: hidden; margin-bottom: 1rem; background: #f8fafc; }
.preview-img { width: 100%; height: 100%; object-fit: cover; }
.btn-save { background: var(--primary); color: white; border: none; padding: 1.2rem; border-radius: 1.2rem; font-weight: 700; width: 100%; margin-top: 1rem; font-size: 1.1rem;}
.input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }

.empty-state { text-align: center; padding: 4rem 1rem; color: #94a3b8; }
.empty-state .iconify { font-size: 4rem; margin-bottom: 1rem; opacity: 0.3; }
</style>