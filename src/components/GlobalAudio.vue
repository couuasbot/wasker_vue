<script setup>
import { ref, onMounted } from 'vue'
import { useMusicStore } from '../stores/musicStore'

const musicStore = useMusicStore()
const audio = ref(null)

onMounted(() => {
  musicStore.initAudio(audio.value)
})
</script>

<template>
  <audio ref="audio" preload="metadata" style="display: none;"></audio>
</template>
