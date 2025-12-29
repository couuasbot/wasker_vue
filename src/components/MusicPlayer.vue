<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMusicStore } from '../stores/musicStore'

const musicStore = useMusicStore()

// Responsive detection matching site's pattern (1200px breakpoint)
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1920)
const isDesktop = computed(() => windowWidth.value >= 1200)

const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

// Computed properties mapping from store
const isPlaying = computed(() => musicStore.isPlaying)
const currentTrack = computed(() => musicStore.currentTrack)
const progress = computed(() => musicStore.progress)
const volume = computed(() => musicStore.volume)
const isMuted = computed(() => musicStore.isMuted)

const formattedCurrentTime = computed(() => {
  return formatTime(musicStore.currentTime)
})

const formattedDuration = computed(() => {
  return formatTime(musicStore.duration)
})

// Methods
const formatTime = (seconds) => {
  if (!isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const handleProgressClick = (event) => {
  const progressBar = event.currentTarget
  const rect = progressBar.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percentage = (clickX / rect.width) * 100
  musicStore.seekByPercentage(percentage)
}

const handleVolumeClick = (event) => {
  const volumeBar = event.currentTarget
  const rect = volumeBar.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const newVolume = Math.max(0, Math.min(1, clickX / rect.width))
  musicStore.setVolume(newVolume)
}

// Touch/Mouse Drag Handlers
// Progress
const isDraggingProgress = ref(false)

const handleProgressMouseDown = (event) => {
  isDraggingProgress.value = true
  updateProgressFromEvent(event)
  event.preventDefault()
  document.addEventListener('mousemove', handleProgressMouseMove)
  document.addEventListener('mouseup', handleProgressMouseUp)
}

const handleProgressMouseMove = (event) => {
  if (!isDraggingProgress.value) return
  updateProgressFromEvent(event)
}

const handleProgressMouseUp = () => {
  isDraggingProgress.value = false
  document.removeEventListener('mousemove', handleProgressMouseMove)
  document.removeEventListener('mouseup', handleProgressMouseUp)
}

const handleProgressTouchStart = (event) => {
  isDraggingProgress.value = true
  updateProgressFromEvent(event.touches[0], event.currentTarget)
}

const handleProgressTouchMove = (event) => {
  if (!isDraggingProgress.value) return
  event.preventDefault()
  updateProgressFromEvent(event.touches[0], event.currentTarget)
}

const handleProgressTouchEnd = () => {
  isDraggingProgress.value = false
}

const updateProgressFromEvent = (clientEvent, targetElement) => {
  // targetElement is needed for touch events where event.currentTarget might be lost or different structure
  // For mouse events, we can use the element we selected
  const progressBar = document.querySelector('.mil-progress-bar')
  if (!progressBar) return
  
  const rect = progressBar.getBoundingClientRect()
  const clientX = clientEvent.clientX
  const x = clientX - rect.left
  const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
  musicStore.seekByPercentage(percentage)
}

// Volume
const isDraggingVolume = ref(false)

const handleVolumeMouseDown = (event) => {
  isDraggingVolume.value = true
  updateVolumeFromEvent(event)
  event.preventDefault()
  document.addEventListener('mousemove', handleVolumeMouseMove)
  document.addEventListener('mouseup', handleVolumeMouseUp)
}

const handleVolumeMouseMove = (event) => {
  if (!isDraggingVolume.value) return
  updateVolumeFromEvent(event)
}

const handleVolumeMouseUp = () => {
  isDraggingVolume.value = false
  document.removeEventListener('mousemove', handleVolumeMouseMove)
  document.removeEventListener('mouseup', handleVolumeMouseUp)
}

const handleVolumeTouchStart = (event) => {
  isDraggingVolume.value = true
  updateVolumeFromEvent(event.touches[0])
}

const handleVolumeTouchMove = (event) => {
  if (!isDraggingVolume.value) return
  event.preventDefault()
  updateVolumeFromEvent(event.touches[0])
}

const handleVolumeTouchEnd = () => {
  isDraggingVolume.value = false
}

const updateVolumeFromEvent = (clientEvent) => {
  const volumeBar = document.querySelector('.mil-volume-bar')
  if (!volumeBar) return
  
  const rect = volumeBar.getBoundingClientRect()
  const clientX = clientEvent.clientX
  const x = clientX - rect.left
  const newVolume = Math.max(0, Math.min(1, x / rect.width))
  musicStore.setVolume(newVolume)
}

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
  
  // Cleanup
  document.removeEventListener('mousemove', handleProgressMouseMove)
  document.removeEventListener('mouseup', handleProgressMouseUp)
  document.removeEventListener('mousemove', handleVolumeMouseMove)
  document.removeEventListener('mouseup', handleVolumeMouseUp)
})
</script>

<template>
  <div class="mil-music-player">
    <!-- No audio element here, it lives in CompactMusicPlayer/Store -->
    
    <div class="mil-player-container">
      <!-- Track Info Section -->
      <div class="mil-track-info">
        <div class="mil-track-cover">
          <i class="fas fa-music"></i>
        </div>
        <div class="mil-track-details">
          <div class="mil-track-title">{{ currentTrack.title }}</div>
          <div class="mil-track-artist">{{ currentTrack.artist }}</div>
        </div>
      </div>

      <!-- Controls Section -->
      <div class="mil-player-controls">
        <!-- Main Controls -->
        <div class="mil-control-buttons">
          <button @click="musicStore.previousTrack" class="mil-control-btn" aria-label="Previous track">
            <i class="fas fa-step-backward"></i>
          </button>
          <button @click="musicStore.togglePlay" class="mil-control-btn mil-play-btn" aria-label="Play/Pause">
            <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
          </button>
          <button @click="musicStore.nextTrack" class="mil-control-btn" aria-label="Next track">
            <i class="fas fa-step-forward"></i>
          </button>
        </div>

        <!-- Progress Bar -->
        <div class="mil-progress-container">
          <span class="mil-time mil-current">{{ formattedCurrentTime }}</span>
          <div 
            class="mil-progress-bar" 
            @click="handleProgressClick"
            @mousedown="handleProgressMouseDown"
            @touchstart="handleProgressTouchStart"
            @touchmove="handleProgressTouchMove"
            @touchend="handleProgressTouchEnd"
          >
            <div class="mil-progress-fill" :style="{ width: progress + '%' }">
              <div class="mil-progress-thumb"></div>
            </div>
          </div>
          <span class="mil-time mil-duration">{{ formattedDuration }}</span>
        </div>
      </div>

      <!-- Volume Section (Desktop Only) -->
      <div v-if="isDesktop" class="mil-volume-control">
        <button @click="musicStore.toggleMute" class="mil-volume-btn" aria-label="Toggle mute">
          <i :class="isMuted || volume === 0 ? 'fas fa-volume-mute' : volume < 0.5 ? 'fas fa-volume-down' : 'fas fa-volume-up'"></i>
        </button>
        <div 
          class="mil-volume-bar" 
          @click="handleVolumeClick"
          @mousedown="handleVolumeMouseDown"
          @touchstart="handleVolumeTouchStart"
          @touchmove="handleVolumeTouchMove"
          @touchend="handleVolumeTouchEnd"
        >
          <div class="mil-volume-fill" :style="{ width: (isMuted ? 0 : volume * 100) + '%' }">
            <div class="mil-volume-thumb"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mil-music-player {
  width: 100%;
  margin-top: 30px;
  padding: 20px;
  background: rgba(26, 26, 26, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(219, 169, 28, 0.1);
  border-radius: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0, 0, 0.3642, 1);
}

.mil-music-player:hover {
  border-color: rgba(219, 169, 28, 0.3);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
}

.mil-player-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Track Info */
.mil-track-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
}

.mil-track-cover {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #DBA91C 0%, #c99419 100%);
  border-radius: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.8rem;
  color: #000;
  box-shadow: 0 8px 24px rgba(219, 169, 28, 0.4), 
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  flex-shrink: 0;
  position: relative;
}

.mil-track-cover::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 1.2rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.mil-music-player:hover .mil-track-cover {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 12px 32px rgba(219, 169, 28, 0.6),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.mil-music-player:hover .mil-track-cover::before {
  opacity: 1;
}

.mil-track-details {
  flex: 1;
  min-width: 0;
  text-align: center;
  width: 100%;
}

.mil-track-title {
  font-size: 1.7rem;
  font-weight: 700;
  color: #E0E0E0;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: color 0.3s ease;
}

.mil-music-player:hover .mil-track-title {
  color: #DBA91C;
}

.mil-track-artist {
  font-size: 1.3rem;
  color: #A5A5A5;
  font-weight: 400;
  letter-spacing: 0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.mil-music-player:hover .mil-track-artist {
  opacity: 1;
}

/* Controls */
.mil-player-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.mil-control-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.mil-control-btn {
  background: rgba(224, 224, 224, 0.1);
  border: 1px solid rgba(219, 169, 28, 0.2);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #A5A5A5;
  font-size: 1.6rem;
  transition: all 0.3s cubic-bezier(0, 0, 0.3642, 1);
}

.mil-control-btn:hover {
  background: rgba(219, 169, 28, 0.2);
  border-color: #DBA91C;
  color: #DBA91C;
  transform: scale(1.1);
}

.mil-control-btn:active {
  transform: scale(0.95);
}

.mil-play-btn {
  width: 56px;
  height: 56px;
  font-size: 2rem;
  background: linear-gradient(135deg, rgba(219, 169, 28, 0.2) 0%, rgba(219, 169, 28, 0.1) 100%);
  border-color: #DBA91C;
}

.mil-play-btn:hover {
  background: linear-gradient(135deg, #DBA91C 0%, #c99419 100%);
  color: #000;
  box-shadow: 0 6px 20px rgba(219, 169, 28, 0.4);
}

/* Progress Bar */
.mil-progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mil-time {
  font-size: 1.2rem;
  color: #A5A5A5;
  min-width: 40px;
  font-variant-numeric: tabular-nums;
}

.mil-progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(44, 44, 44, 0.5);
  border-radius: 3px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
  user-select: none;
}

.mil-progress-bar:hover {
  height: 8px;
}

.mil-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #DBA91C 0%, #f0c040 100%);
  border-radius: 3px;
  position: relative;
  transition: width 0.1s linear;
  box-shadow: 0 0 12px rgba(219, 169, 28, 0.5);
}

.mil-progress-thumb {
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  background: #DBA91C;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(219, 169, 28, 0.6);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.mil-progress-bar:hover .mil-progress-thumb {
  opacity: 1;
}

/* Volume Control */
.mil-volume-control {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(44, 44, 44, 0.5);
}

.mil-volume-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #A5A5A5;
  font-size: 1.8rem;
  padding: 8px;
  transition: all 0.3s cubic-bezier(0, 0, 0.3642, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  width: 36px;
  height: 36px;
}

.mil-volume-btn:hover {
  color: #DBA91C;
  background: rgba(219, 169, 28, 0.1);
}

.mil-volume-bar {
  flex: 1;
  max-width: 100px;
  height: 4px;
  background: rgba(44, 44, 44, 0.5);
  border-radius: 2px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
  user-select: none;
}

.mil-volume-bar:hover {
  height: 6px;
}

.mil-volume-fill {
  height: 100%;
  background: linear-gradient(90deg, #DBA91C 0%, #f0c040 100%);
  border-radius: 2px;
  position: relative;
  transition: width 0.1s ease;
}

.mil-volume-thumb {
  position: absolute;
  right: -5px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  background: #DBA91C;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(219, 169, 28, 0.6);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.mil-volume-bar:hover .mil-volume-thumb {
  opacity: 1;
}

/* Desktop Layout (>= 1200px) */
@media (min-width: 1200px) {
  .mil-player-container {
    flex-direction: row;
    align-items: center;
    gap: 35px;
  }

  .mil-track-info {
    min-width: 180px;
    max-width: 200px;
    padding: 5px 0;
  }

  .mil-player-controls {
    flex: 1;
    gap: 12px;
  }

  .mil-progress-container {
    gap: 15px;
  }

  .mil-volume-control {
    min-width: 140px;
    padding-top: 0;
    border-top: none;
    padding-left: 20px;
    border-left: 1px solid rgba(44, 44, 44, 0.5);
  }
}

/* Tablet adjustments */
@media (max-width: 1199px) and (min-width: 768px) {
  .mil-music-player {
    padding: 18px;
  }

  .mil-track-cover {
    width: 55px;
    height: 55px;
    font-size: 2.2rem;
  }

  .mil-control-btn {
    width: 40px;
    height: 40px;
    font-size: 1.5rem;
  }

  .mil-play-btn {
    width: 50px;
    height: 50px;
    font-size: 1.8rem;
  }
}

/* Mobile adjustments */
@media (max-width: 767px) {
  .mil-music-player {
    padding: 15px;
    margin-top: 20px;
  }

  .mil-track-info {
    gap: 10px;
    padding: 5px 0;
  }

  .mil-track-cover {
    width: 60px;
    height: 60px;
    font-size: 2.2rem;
  }

  .mil-track-title {
    font-size: 1.5rem;
  }

  .mil-track-artist {
    font-size: 1.2rem;
  }

  .mil-control-btn {
    width: 38px;
    height: 38px;
    font-size: 1.4rem;
  }

  .mil-play-btn {
    width: 48px;
    height: 48px;
    font-size: 1.7rem;
  }

  .mil-control-buttons {
    gap: 12px;
  }

  .mil-time {
    font-size: 1.1rem;
    min-width: 35px;
  }
}
</style>
