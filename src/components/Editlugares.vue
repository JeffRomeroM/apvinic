<template>
  <div class="admin-container">
    <CategoriaLugares @actualizar="cargarDatos" />
    
    <header class="main-header">
      <div class="header-content">
        <h1>Gestión de Lugares</h1>
        <div class="stats-bar">
          <span class="stat">Mostrando: <b>{{ lugaresFiltrados.length }}</b></span>
          <span class="stat alert" :class="{ critical: diasParaCobro <= 3 }">
            Próximo cobro: <b>{{ diasParaCobro }} días</b>
          </span>
        </div>
      </div>
      <button @click="abrirModal()" class="btn-primary">
        <Icon icon="solar:map-point-add-bold" /> Nuevo Lugar
      </button>
    </header>

    <div class="table-controls">
      <div class="search-box">
        <Icon icon="solar:magnifer-linear" />
        <input v-model="busquedaAdmin" type="text" placeholder="Buscar local..." />
      </div>
      
      <div class="filter-select">
        <Icon icon="solar:filter-bold" />
        <select v-model="filtroCatAdmin">
          <option value="all">Todas las categorías</option>
          <option v-for="cat in categorias" :key="cat.id" :value="cat.id">{{ cat.nombre }}</option>
        </select>
      </div>
    </div>

    <div class="table-card">
      <table class="desktop-table">
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Lugar</th>
            <th>Dirección</th>
            <th>Celular</th>
            <th>Pago</th>
            <th>Ubicación</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lugar in lugaresFiltrados" :key="lugar.id" :class="{ 'pending': !lugar.pago }">
            <td>
              <div class="img-wrapper">
                <img :src="lugar.foto_url || '/placeholder.png'" alt="" />
              </div>
            </td>
            <td data-label="Lugar">
              <div class="name-info">
                <strong>{{ lugar.nombre }}</strong>
                <span class="badge">{{ getCatNombre(lugar.tipo_id) }}</span>
              </div>
            </td>
            <td data-label="Dirección"><strong>{{ lugar.direccion }}</strong></td>
            <td data-label="Celular"><strong>{{ lugar.celular }}</strong></td>
            <td data-label="Pago">
              <label class="toggle">
                <input type="checkbox" :checked="lugar.pago" @change="togglePago(lugar)">
                <span class="slider"></span>
              </label>
            </td>
            <td data-label="GPS" class="mono">{{ lugar.lat.toFixed(4) }}, {{ lugar.lng.toFixed(4) }}</td>
            <td class="actions text-right">
              <button @click="abrirModal(lugar)" class="btn-icon edit"><Icon icon="solar:pen-bold" /></button>
              <button @click="borrarLugar(lugar)" class="btn-icon del"><Icon icon="solar:trash-bin-trash-bold" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal-window">
        <div class="modal-header">
          <h3>{{ editandoId ? 'Editar Detalles' : 'Nuevo Registro' }}</h3>
          <button @click="cerrarModal" class="btn-close"><Icon icon="solar:close-circle-bold" /></button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="guardarLugar" class="admin-form">
            <div class="upload-area">
              <label class="preview-box" :style="previewUrl ? `background-image: url(${previewUrl})` : ''">
                <input type="file" @change="handleFile" accept="image/*" hidden />
                <div v-if="!previewUrl" class="upload-placeholder">
                  <Icon icon="solar:camera-add-bold" />
                  <span>Subir Foto</span>
                </div>
                <div v-else class="upload-overlay"><Icon icon="solar:refresh-bold" /></div>
              </label>
            </div>

            <div class="form-grid">
              <div class="input-group full">
                <label>Nombre</label>
                <input v-model="form.nombre" required />
              </div>
              <div class="input-group full">
                <label>Dirección</label>
                <input v-model="form.direccion" required />
              </div>
              <div class="input-group">
                <label>Celular</label>
                <input v-model="form.celular" required type="tel" />
              </div>
              <div class="input-group">
                <label>Categoría</label>
                <select v-model="form.tipo_id" required>
                  <option v-for="cat in categorias" :key="cat.id" :value="cat.id">{{ cat.nombre }}</option>
                </select>
              </div>
              <div class="input-group full check-group">
                <div class="check-box-wrapper">
                  <input type="checkbox" v-model="form.pago" id="pago-modal" />
                  <label for="pago-modal">Habilitar en vista pública</label>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" @click="cerrarModal" class="btn-secondary">Cancelar</button>
              <button type="submit" class="btn-confirm" :disabled="loading">
                {{ loading ? 'Procesando...' : 'Guardar' }}
              </button>
            </div>
          </form>

          <div class="map-section">
            <p class="map-hint"><Icon icon="solar:point-on-map-bold" /> Toca para ubicar</p>
            <div id="map"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { createClient } from '@supabase/supabase-js';
import { Icon } from '@iconify/vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import CategoriaLugares from './CategoriaLugares.vue';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY);

const lugares = ref([]);
const categorias = ref([]);
const busquedaAdmin = ref('');
const filtroCatAdmin = ref('all');
const showModal = ref(false);
const loading = ref(false);
const editandoId = ref(null);
const archivoFoto = ref(null);
const previewUrl = ref(null);
const map = ref(null);
const marker = ref(null);

const initialForm = { nombre: '', direccion: '', celular: '', tipo_id: '', lat: 12.1328, lng: -86.2504, pago: false, foto_url: '' };
const form = ref({ ...initialForm });

const lugaresFiltrados = computed(() => {
  return lugares.value.filter(l => {
    const mNombre = l.nombre?.toLowerCase().includes(busquedaAdmin.value.toLowerCase());
    const mCat = filtroCatAdmin.value === 'all' || l.tipo_id === filtroCatAdmin.value;
    return mNombre && mCat;
  });
});

const diasParaCobro = computed(() => {
  const hoy = new Date();
  let f = new Date(hoy.getFullYear(), hoy.getMonth(), 15);
  if (hoy.getDate() > 15) f.setMonth(f.getMonth() + 1);
  return Math.ceil((f - hoy) / (1000 * 60 * 60 * 24));
});

const getCatNombre = (id) => categorias.value.find(c => c.id === id)?.nombre || 'S/C';

const cargarDatos = async () => {
  const { data: c } = await supabase.from('categorias_lugares').select('*').order('nombre');
  categorias.value = c || [];
  const { data: l } = await supabase.from('lugares').select('*').order('creado_at', { ascending: false });
  lugares.value = l || [];
};

const initMap = () => {
  if (map.value) map.value.remove();
  map.value = L.map('map', { zoomControl: false }).setView([form.value.lat, form.value.lng], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png').addTo(map.value);
  marker.value = L.marker([form.value.lat, form.value.lng]).addTo(map.value);
  map.value.on('click', (e) => {
    form.value.lat = e.latlng.lat;
    form.value.lng = e.latlng.lng;
    marker.value.setLatLng(e.latlng);
  });
};

const abrirModal = async (lugar = null) => {
  if (lugar) {
    editandoId.value = lugar.id;
    form.value = { 
      nombre: lugar.nombre, direccion: lugar.direccion, celular: lugar.celular,
      tipo_id: lugar.tipo_id, lat: lugar.lat, lng: lugar.lng, pago: lugar.pago, foto_url: lugar.foto_url 
    };
    previewUrl.value = lugar.foto_url;
  } else {
    editandoId.value = null;
    form.value = { ...initialForm };
    previewUrl.value = null;
  }
  showModal.value = true;
  await nextTick();
  initMap();
};

const guardarLugar = async () => {
  loading.value = true;
  try {
    let url = form.value.foto_url;
    if (archivoFoto.value) {
      const fileName = `lugar_${Date.now()}.webp`;
      await supabase.storage.from('fotos_lugares').upload(fileName, archivoFoto.value);
      url = supabase.storage.from('fotos_lugares').getPublicUrl(fileName).data.publicUrl;
    }

    const payload = {
      nombre: form.value.nombre, direccion: form.value.direccion, tipo_id: form.value.tipo_id,
      celular: form.value.celular, lat: parseFloat(form.value.lat), lng: parseFloat(form.value.lng),
      foto_url: url, pago: Boolean(form.value.pago)
    };

    const { error } = editandoId.value 
      ? await supabase.from('lugares').update(payload).eq('id', editandoId.value)
      : await supabase.from('lugares').insert([payload]);

    if (error) throw error;
    cerrarModal(); cargarDatos();
  } catch (e) { alert("Error: " + e.message); }
  finally { loading.value = false; }
};

const handleFile = (e) => {
  const file = e.target.files[0];
  if (file) { archivoFoto.value = file; previewUrl.value = URL.createObjectURL(file); }
};

const cerrarModal = () => { showModal.value = false; archivoFoto.value = null; };
const togglePago = async (lugar) => {
  await supabase.from('lugares').update({ pago: !lugar.pago }).eq('id', lugar.id);
  cargarDatos();
};
const borrarLugar = async (lugar) => {
  if (confirm("¿Eliminar?")) {
    await supabase.from('lugares').delete().eq('id', lugar.id);
    cargarDatos();
  }
};

onMounted(cargarDatos);
</script>

<style scoped>
.admin-container { padding: 1rem; max-width: 1200px; margin: auto; background: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif; }
.main-header { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }
@media (min-width: 768px) { .main-header { flex-direction: row; justify-content: space-between; align-items: center; } }

.table-controls { display: grid; grid-template-columns: 1fr; gap: 1rem; margin-bottom: 1.5rem; }
@media (min-width: 768px) { .table-controls { grid-template-columns: 2fr 1fr; } }

.search-box, .filter-select { display: flex; align-items: center; background: white; padding: 12px; border-radius: 14px; border: 1px solid #e2e8f0; }
.search-box input, .filter-select select { border: none; width: 100%; outline: none; padding-left: 10px; }

/* Responsive Table */
.table-card { overflow: hidden; }
.desktop-table { width: 100%; border-collapse: collapse; }
th { background: #f1f5f9; padding: 1rem; text-align: left; font-size: 0.7rem; color: #64748b; text-transform: uppercase; }

@media (max-width: 767px) {
  .desktop-table thead { display: none; }
  .desktop-table tr { display: block; background: white; margin-bottom: 1rem; padding: 1rem; border-radius: 15px; border: 1px solid #e2e8f0; }
  .desktop-table td { display: flex; justify-content: space-between; padding: 0.5rem 0; border: none; font-size: 0.9rem; }
  .desktop-table td::before { content: attr(data-label); font-weight: bold; color: #94a3b8; }
  .desktop-table td:first-child { justify-content: center; border-bottom: 1px solid #f1f5f9; }
  .desktop-table td:first-child::before { content: none; }
}

@media (min-width: 768px) {
  td { padding: 1rem; border-bottom: 1px solid #f1f5f9; background: white; }
}

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7); display: flex; align-items: flex-end; z-index: 1000; }
@media (min-width: 768px) { .modal-overlay { align-items: center; padding: 2rem; } }

.modal-window { background: white; width: 100%; max-height: 95vh; border-radius: 20px 20px 0 0; display: flex; flex-direction: column; }
@media (min-width: 768px) { .modal-window { max-width: 900px; border-radius: 20px; margin: auto; } }

.modal-body { display: flex; flex-direction: column; overflow-y: auto; }
@media (min-width: 900px) { .modal-body { display: grid; grid-template-columns: 1fr 1fr; } }

.admin-form { padding: 1.5rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.full { grid-column: span 2; }
.map-section { min-height: 300px; background: #eee; position: relative; }
#map { height: 100%; width: 100%; }

.btn-primary { background: #0f172a; color: white; border: none; padding: 12px 20px; border-radius: 12px; font-weight: bold; cursor: pointer; }
.btn-confirm { background: #0f172a; color: white; border: none; padding: 15px; border-radius: 12px; font-weight: bold; width: 100%; margin-top: 1rem; }
.btn-icon { background: none; border: none; font-size: 1.2rem; cursor: pointer; padding: 5px; }
.edit { color: #3b82f6; } .del { color: #ef4444; }

.preview-box { width: 100%; height: 150px; border-radius: 15px; background-size: cover; background-position: center; border: 2px dashed #cbd5e1; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.img-wrapper img { width: 45px; height: 45px; border-radius: 10px; object-fit: cover; }
.toggle { position: relative; width: 40px; height: 20px; }
.toggle input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; inset: 0; background: #cbd5e1; border-radius: 20px; cursor: pointer; transition: 0.3s; }
.slider:before { content: ""; position: absolute; height: 14px; width: 14px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s; }
input:checked + .slider { background: #10b981; }
input:checked + .slider:before { transform: translateX(20px); }
</style>