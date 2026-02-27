<script setup>
import { ref, onMounted } from 'vue';
import { createClient } from '@supabase/supabase-js';
import { Icon } from '@iconify/vue';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY);

const categorias = ref([]);
const showModal = ref(false);
const editando = ref(false);
const loading = ref(false);

const form = ref({ id: null, nombre: '' });

const fetchCategorias = async () => {
  const { data } = await supabase.from('categorias_lugares').select('id, nombre').order('nombre');
  categorias.value = data || [];
};

const abrirModal = (cat = null) => {
  editando.value = !!cat;
  form.value = cat ? { ...cat } : { id: null, nombre: '' };
  showModal.value = true;
};

const guardarCategoria = async () => {
  loading.value = true;
  try {
    if (editando.value) {
      await supabase.from('categorias_lugares')
        .update({ nombre: form.value.nombre })
        .eq('id', form.value.id);
    } else {
      // SOLO enviamos el nombre. El ID se crea solo en la DB.
      await supabase.from('categorias_lugares').insert([{ nombre: form.value.nombre }]);
    }
    showModal.value = false;
    fetchCategorias();
  } catch (e) {
    alert("Error: " + e.message);
  } finally {
    loading.value = false;
  }
};

const borrarCategoria = async (id) => {
  if (!confirm("¿Eliminar?")) return;
  const { error } = await supabase.from('categorias_lugares').delete().eq('id', id);
  if (error) alert("Error: Verifica si hay lugares usando esta categoría");
  else fetchCategorias();
};

onMounted(fetchCategorias);
</script>

<template>
  <div class="admin-categorias">
    <header class="panel-header">
      <h2>Categorías</h2>
      <button @click="abrirModal()" class="btn-add">Nueva</button>
    </header>

    <div class="list">
      <div v-for="cat in categorias" :key="cat.id" class="item">
        <span>{{ cat.nombre }}</span>
        <div class="btns">
          <button @click="abrirModal(cat)" class="edit"><Icon icon="solar:pen-bold" /></button>
          <button @click="borrarCategoria(cat.id)" class="del"><Icon icon="solar:trash-bin-trash-bold" /></button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal" @click.self="showModal = false">
      <div class="card">
        <h3>{{ editando ? 'Editar' : 'Nueva' }} Categoría</h3>
        <input v-model="form.nombre" placeholder="Nombre" @keyup.enter="guardarCategoria" />
        <div class="modal-btns">
          <button @click="showModal = false">Cancelar</button>
          <button @click="guardarCategoria" :disabled="loading" class="primary">Guardar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-categorias { max-width: 500px; margin: auto; padding: 20px; }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.btn-add { background: #0f172a; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
.list { display: grid; gap: 8px; }
.item { background: white; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; }
.btns { display: flex; gap: 10px; }
.edit { color: #3b82f6; border: none; background: none; cursor: pointer; }
.del { color: #ef4444; border: none; background: none; cursor: pointer; }
.modal { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; }
.card { background: white; padding: 25px; border-radius: 15px; width: 300px; }
input { width: 100%; padding: 10px; margin: 15px 0; border: 1px solid #ddd; border-radius: 8px; }
.modal-btns { display: flex; justify-content: flex-end; gap: 10px; }
.primary { background: #0f172a; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; }
</style>