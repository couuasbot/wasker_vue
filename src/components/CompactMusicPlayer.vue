<script setup>
import { ref, computed } from 'vue'
import { useMusicStore } from '../stores/musicStore'

const musicStore = useMusicStore()
</script>

<template>
  <div class="compact-music-player" :class="{ 'is-playing': musicStore.isPlaying }">
    
    <div class="compact-disc-container" @click="musicStore.togglePlay" title="Play/Pause">

      <!-- Circular Progress (SVG) -->
      <svg class="progress-ring" viewBox="0 0 36 36">
        <circle 
          class="progress-ring-bg" 
          cx="18" 
          cy="18" 
          r="17" 
          fill="none" 
          stroke-width="1.5" 
        />
        <circle 
          class="progress-ring-circle" 
          :stroke-dasharray="`${musicStore.progress}, 100`"
          cx="18" 
          cy="18" 
          r="17" 
          fill="none" 
          stroke-width="1.5" 
          pathLength="100"
        />
      </svg>
      
      <!-- Disc/Cover Content -->
      <div class="compact-disc">
        <i v-if="!musicStore.isPlaying" class="fas fa-play play-icon"></i>
        <i v-else class="fas fa-pause pause-icon"></i>
        
        <div class="compact-cover-icon">
           <i class="fas fa-music"></i>
        </div>
      </div>
    </div>
    
    <!-- Mini Info (Optional: only visible on hover or wide state if sidebar expands) -->
    <!-- Keeping it hidden/subtle to match request for "minimal and not affecting layout width" -->
  </div>
</template>

<style scoped>
.compact-music-player {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding-bottom: 5px;
}

/* Responsive Adjustments */
@media (max-width: 1199px) {
  .compact-music-player {
    padding: 0;
    width: auto;
    margin: 0;
    display: flex;
    align-items: center;
  }
  
  .compact-disc-container {
    width: 38px;
    height: 38px;
  }
  
  .compact-disc {
    width: 28px;
    height: 28px;
  }
  
  .compact-cover-icon {
    font-size: 10px;
  }
}

.compact-disc-container {
  position: relative;
  width: 30px;
  height: 30px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.2s ease;
}

.compact-disc-container:active {
  transform: scale(0.95);
}

/* SVG Progress Ring */
.progress-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg); /* Start from top */
  pointer-events: none;
}

.progress-ring-bg {
  stroke: rgba(255, 255, 255, 0.1);
}

.progress-ring-circle {
  stroke: #DBA91C;
  stroke-linecap: round;
  transition: stroke-dasharray 0.3s linear;
}

/* Disc Content */
.compact-disc {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a1a1a 0%, #000 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
}

.compact-cover-icon {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #555;
  font-size: 10px;
  transition: opacity 0.3s ease;
}

/* Playing Animation */
.compact-music-player.is-playing .compact-cover-icon {
  animation: spin 4s linear infinite;
  color: #DBA91C;
  opacity: 0.3; /* Fade out icon when playing to show pause button better on hover */
}

/* Hover States for Play/Pause Icons */
.play-icon, .pause-icon {
  z-index: 2;
  font-size: 10px;
  color: #FFF;
  opacity: 0;
  transition: opacity 0.2s ease;
  text-shadow: 0 1px 3px rgba(0,0,0,0.8);
}

.compact-disc-container:hover .play-icon,
.compact-disc-container:hover .pause-icon {
  opacity: 1;
}

.compact-disc-container:hover .compact-cover-icon {
  opacity: 0.2;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
