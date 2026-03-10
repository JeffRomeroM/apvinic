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
            <p class="itinerary-preview">{{ item.dias }} • {{ item.hora_origen }}</p>
            <p v-if="item.tipo === 'bus'" class="price">C$ {{ item.precio }}</p>  
          </div>
          <div class="card-actions">
            <button @click="abrirModalEditar(item)" class="btn-icon edit">
              <Icon icon="solar:pen-new-square-bold-duotone" />
            </button>
            <button @click="abrirConfirmacion(item)" class="btn-icon delete">
              <Icon icon="solar:trash-bin-trash-bold-duotone" />
            </button>
          </div>
        </div>
      </template>
    </main>

    <div v-if="mostrarModalLogout" class="modal-overlay centered">
      <div class="modal-alert">
        <div class="alert-icon warning"><Icon icon="solar:logout-3-bold-duotone" /></div>
        <h3>¿Cerrar sesión?</h3>
        <div class="alert-btns">
          <button @click="cerrarSesion" class="btn-danger">Cerrar Sesión</button>
          <button @click="mostrarModalLogout = false" class="btn-ghost">Cancelar</button>
        </div>
      </div>
    </div>

    <div v-if="itemABorrar" class="modal-overlay centered">
      <div class="modal-alert">
        <div class="alert-icon danger"><Icon icon="solar:danger-bold-duotone" /></div>
        <h3>¿Eliminar publicación?</h3>
        <div class="alert-btns">
          <button @click="eliminarServicio" class="btn-danger" :disabled="loading">{{ loading ? 'Borrando...' : 'Sí, eliminar' }}</button>
          <button @click="itemABorrar = null" class="btn-ghost">Cancelar</button>
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
            <label>Días de Salida</label>
            <div class="days-selector">
              <button v-for="dia in ['L', 'M', 'X', 'J', 'V', 'S', 'D']" :key="dia" type="button" 
                class="day-btn" :class="{ 'active': diasSeleccionados.includes(dia) }" @click="toggleDia(dia)">{{ dia }}</button>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Origen</label>
              <input v-model="form.origen" placeholder="Ej: Nueva Guinea" />
            </div>
            <div class="form-group" v-if="tipoServicio === 'bus'">
              <label>Destino</label>
              <input v-model="form.destino" placeholder="Ej: Managua" />
            </div>
          </div>

          <div class="form-group">
            <label>Salidas de {{ form.origen || 'Origen' }}</label>
            <div class="multi-hours">
              <div v-for="(hora, index) in horariosOrigen" :key="'o'+index" class="hour-chip">
                <input type="time" v-model="horariosOrigen[index]" />
                <button v-if="horariosOrigen.length > 1" type="button" @click="horariosOrigen.splice(index, 1)" class="btn-remove-hour">×</button>
              </div>
              <button type="button" @click="horariosOrigen.push('')" class="btn-add-hour" v-if="horariosOrigen.length < 5">
                <Icon icon="solar:add-circle-bold" /> Añadir horario de salida
              </button>
            </div>
          </div>

          <div class="form-group" v-if="tipoServicio === 'bus'">
            <label>Regresos de {{ form.destino || 'Destino' }}</label>
            <div class="multi-hours">
              <div v-for="(hora, index) in horariosDestino" :key="'d'+index" class="hour-chip">
                <input type="time" v-model="horariosDestino[index]" />
                <button v-if="horariosDestino.length > 1" type="button" @click="horariosDestino.splice(index, 1)" class="btn-remove-hour">×</button>
              </div>
              <button type="button" @click="horariosDestino.push('')" class="btn-add-hour" v-if="horariosDestino.length < 5">
                <Icon icon="solar:add-circle-bold" /> Añadir horario de regreso
              </button>
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

          <div class="form-group">
            <label>Foto de la Unidad</label>
            <div class="photo-upload" @click="triggerFile">
              <img v-if="tempImageUrl" :src="tempImageUrl" class="preview" />
              <div v-else class="placeholder"><Icon icon="solar:camera-add-bold-duotone" /><span>Subir foto</span></div>
              <input type="file" ref="fileInput" @change="handleFile" hidden accept="image/*"/>
            </div>
          </div>

          <button @click="guardarServicio" class="btn-submit" :disabled="loading">{{ loading ? 'Guardando...' : 'Publicar' }}</button>
        </div>
      </div>
    </div>

    <a href="https://wa.me/50577146128" target="_blank" class="whatsapp-float"><Icon icon="logos:whatsapp-icon" /></a>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { createClient } from '@supabase/supabase-js';
import { Icon } from '@iconify/vue';

const router = useRouter();
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY);

const usuario = ref(null);
const loading = ref(false);
const mostrarModal = ref(false);
const mostrarModalLogout = ref(false);
const itemABorrar = ref(null);
const servicios = ref([]);
const editandoId = ref(null);

const tipoServicio = ref('bus');
const diasSeleccionados = ref([]);
const horariosOrigen = ref(['']);
const horariosDestino = ref(['']);
const fileInput = ref(null);
const tempImageUrl = ref(null);
const fotoArchivo = ref(null);
const form = reactive({ origen: '', destino: '', precio: '', whatsapp: '' });

const checkAuth = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  usuario.value = user;
  if (user) fetchServicios();
};

const fetchServicios = async () => {
  const { data } = await supabase.from('servicios').select('*').eq('dueno_id', usuario.value.id).order('creado_at', { ascending: false });
  servicios.value = data || [];
};

const handleFile = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  fotoArchivo.value = file;
  tempImageUrl.value = URL.createObjectURL(file);
};

const toggleDia = (dia) => {
  const idx = diasSeleccionados.value.indexOf(dia);
  idx > -1 ? diasSeleccionados.value.splice(idx, 1) : diasSeleccionados.value.push(dia);
};

const guardarServicio = async () => {
  if (!form.origen || !form.whatsapp) return alert("Origen y WhatsApp son obligatorios");
  
  loading.value = true;
  try {
    let url = tempImageUrl.value;
    if (fotoArchivo.value) {
      const path = `${usuario.value.id}/${Date.now()}.webp`;
      await supabase.storage.from('fotos_servicios').upload(path, fotoArchivo.value);
      url = supabase.storage.from('fotos_servicios').getPublicUrl(path).data.publicUrl;
    }

    const payload = {
      ...form,
      tipo: tipoServicio.value,
      foto_url: url,
      dueno_id: usuario.value.id,
      dias: diasSeleccionados.value.join(','),
      hora_origen: horariosOrigen.value.filter(h => h).join(', '),
      hora_destino: horariosDestino.value.filter(h => h).join(', ')
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

const abrirModalCrear = () => {
  editandoId.value = null;
  diasSeleccionados.value = [];
  horariosOrigen.value = [''];
  horariosDestino.value = [''];
  Object.assign(form, { origen: '', destino: '', precio: '', whatsapp: '' });
  tempImageUrl.value = null;
  mostrarModal.value = true;
};

const abrirModalEditar = (item) => {
  editandoId.value = item.id;
  tipoServicio.value = item.tipo;
  Object.assign(form, item);
  diasSeleccionados.value = item.dias ? item.dias.split(',') : [];
  horariosOrigen.value = item.hora_origen ? item.hora_origen.split(', ') : [''];
  horariosDestino.value = item.hora_destino ? item.hora_destino.split(', ') : [''];
  tempImageUrl.value = item.foto_url;
  mostrarModal.value = true;
};

const triggerFile = () => fileInput.value.click();
const cerrarSesion = async () => { await supabase.auth.signOut(); router.push('/login'); };
const abrirConfirmacion = (item) => itemABorrar.value = item;
const eliminarServicio = async () => {
  await supabase.from('servicios').delete().eq('id', itemABorrar.value.id);
  itemABorrar.value = null;
  fetchServicios();
};
const verificarYCrear = () => !usuario.value ? router.push('/login') : abrirModalCrear();

const tipoIcono = computed(() => {
  const icons = { bus: 'solar:bus-bold-duotone', taxi: 'solar:automotive-bold-duotone', moto: 'solar:motorbike-bold-duotone' };
  return icons[tipoServicio.value];
});

onMounted(checkAuth);
</script>

<style scoped>
.perfil-container { --primary: #d19a02; --dark: #1e293b; --gray: #64748b; --bg: #f1f5f9; background: var(--bg); min-height: 100vh; font-family: 'Inter', sans-serif; }
.perfil-header { background: var(--primary); padding: 1.5rem 1.5rem 3.5rem; color: white; border-radius: 0 0 2rem 2rem; box-shadow: 0 4px 12px rgba(209, 154, 2, 0.3); }
.header-top { display: flex; justify-content: space-between; align-items: center; }
.user-name { font-size: 1.2rem; margin: 0; font-weight: 800; text-transform: capitalize; }
.btn-add { background: white; color: var(--primary); border: none; width: 30px; height: 30px; border-radius: 12px; font-size: 1.7rem; margin-top: 7px; display: flex; align-items: center; justify-content: center; }
.header-stats { display: flex; justify-content: space-between; margin-top: 1.2rem; }
.stat-badge { background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; display: flex; gap: 6px; }
.btn-logout-minimal { background: transparent; border: 1px solid rgba(255,255,255,0.5); color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; }
.perfil-content { padding: 0 1.2rem; margin-top: -2rem; }

.service-card { background: white; border-radius: 1.2rem; padding: 0.8rem; display: flex; gap: 1rem; margin-bottom: 1rem; align-items: center; border: 1px solid rgba(0,0,0,0.03); margin-right: 5%; }
.card-img { width: 80px; height: 80px; border-radius: 1rem; object-fit: cover; }
.card-info { flex: 1; }
.card-info h3 { font-size: 0.95rem; margin: 4px 0; color: var(--dark); display: flex; align-items: center; gap: 5px; }
.itinerary-preview { font-size: 0.7rem; color: var(--gray); margin: 0; font-weight: 600; }
.type-badge { font-size: 0.6rem; font-weight: 900; text-transform: uppercase; padding: 2px 8px; border-radius: 5px; }
.type-badge.bus { background: #e0f2fe; color: #0369a1; }
.price { color: #16a34a; font-weight: 800; margin: 0; }
.card-actions { display: flex; flex-direction: column; gap: 0.5rem; }
.btn-icon { padding: 8px; border-radius: 50%; border: none; font-size: 1.1rem; }
.btn-icon.edit { background: #f1f5f9; color: var(--gray); }
.btn-icon.delete { background: #fee2e2; color: #ef4444; }

.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(4px); z-index: 1000; display: flex; }
.modal-overlay.centered { align-items: center; justify-content: center; padding: 1.5rem; }
.modal-overlay.bottom { align-items: flex-end; }
.modal-sheet { background: white; width: 100%; border-radius: 2rem 2rem 0 0; padding: 2rem; max-height: 90vh; overflow-y: auto; }
.sheet-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }

.form-group { margin-bottom: 1.2rem; }
.form-group label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--gray); text-transform: uppercase; margin-bottom: 0.4rem; }
input, .custom-select { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 1rem; padding: 0.8rem 1rem; width: 100%; font-size: 1rem; outline: none; }
.custom-select select { border: none; background: transparent; width: 100%; outline: none; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.days-selector { display: flex; justify-content: space-between; gap: 5px; }
.day-btn { flex: 1; height: 40px; border-radius: 12px; border: 2px solid #e2e8f0; background: #f8fafc; font-weight: 800; font-size: 0.8rem; }
.day-btn.active { background: var(--primary); color: white; border-color: var(--primary); }

.multi-hours { display: flex; flex-direction: column; gap: 8px; }
.hour-chip { display: flex; gap: 8px; }
.btn-remove-hour { background: #fee2e2; color: #ef4444; border: none; width: 38px; height: 38px; border-radius: 50%; font-size: 1.2rem; }
.btn-add-hour { background: white; border: 2px solid var(--primary); color: var(--primary); padding: 8px; border-radius: 10px; font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 5px; }

.photo-upload { height: 120px; border: 2px dashed #cbd5e1; border-radius: 1.2rem; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; }
.photo-upload .preview { width: 100%; height: 100%; object-fit: cover; }
.btn-submit { background: var(--primary); color: white; border: none; padding: 1rem; border-radius: 1rem; font-weight: 700; width: 100%; }

.whatsapp-float { position: fixed; bottom: 70px; right: 20px; background: #25d366; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 35px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); z-index: 1001; }
</style>