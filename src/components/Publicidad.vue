<template>
    <div v-if="mostrar && publicidadActual" class="modal">
      <div class="contenido">
        <img
          v-if="publicidadActual.imagen"
          :src="publicidadActual.imagen"
          alt="Imagen de publicidad"
          class="imagen"
        />

        <h2>{{ publicidadActual.nombre }}</h2>
        <p class="descripcion">{{ publicidadActual.descripcion }}</p>
        <p class="contacto"><strong>Contacto:</strong> {{ publicidadActual.contacto }}</p>
        <p class="contacto"><strong></strong> {{ publicidadActual.accion }}</p>
        <p class="contacto"><strong></strong> {{ publicidadActual.imagen }}</p>
        <button class="cerrar" @click="cerrarModal">Cerrar</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  
  const publicidades = ref([])
  const publicidadActual = ref(null)
  const mostrar = ref(false)
  let ultimaPublicidadId = null
  
  const cargarPublicidades = async () => {
    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbyNqiapCsNjqqn_dYCXRSczK0wssBVBUw3eBHVWhzJSGayFyoC2TF9yWCH47JKtne8/exec')
      const data = await response.json()
      publicidades.value = data
    } catch (error) {
      console.error("Error al cargar publicidad:", error)
    }
  }
  
  const mostrarPublicidad = () => {
    if (mostrar.value || publicidades.value.length === 0) return
  
    const disponibles = publicidades.value.filter(p => p.nombre !== ultimaPublicidadId)
    if (disponibles.length === 0) return
  
    const aleatoria = disponibles[Math.floor(Math.random() * disponibles.length)]
    publicidadActual.value = aleatoria
    ultimaPublicidadId = aleatoria.nombre
    mostrar.value = true
  }
  
  const cerrarModal = () => {
    mostrar.value = false
  }
  
  onMounted(async () => {
    await cargarPublicidades()
    setInterval(mostrarPublicidad, 50000)
  })
  </script>
  
  <style scoped>
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(30, 30, 30, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease-in-out;
  }
  
  .contenido {
    background: #ffffff;
    padding: 30px 25px;
    border-radius: 16px;
    max-width: 90%;
    width: 360px;
    text-align: center;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    animation: scaleIn 0.3s ease-in-out;
  }
  
  h2 {
    font-size: 24px;
    margin-bottom: 12px;
    color: #1e88e5;
  }
  
  .descripcion {
    font-size: 16px;
    color: #333;
    margin-bottom: 10px;
  }
  
  .contacto {
    font-size: 15px;
    color: #555;
    margin-bottom: 20px;
  }
  
  .cerrar {
    background-color: #1e88e5;
    color: white;
    padding: 10px 22px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  
  .cerrar:hover {
    background-color: #1565c0;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes scaleIn {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  </style>
  