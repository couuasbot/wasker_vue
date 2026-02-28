<script setup>
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDraggable, useWindowSize, useMouse, useElementHover } from '@vueuse/core'
import TheSidebar from '../components/TheSidebar.vue'
import TheRightBar from '../components/TheRightBar.vue'
import GlobalAudio from '../components/GlobalAudio.vue'
import CompactMusicPlayer from '../components/CompactMusicPlayer.vue'
import { useAppStore } from '../stores/app'

import { useScrollAnimations } from '../composables/useScrollAnimations'
import { Fancybox } from "@fancyapps/ui"
import "@fancyapps/ui/dist/fancybox/fancybox.css"
import gsap from 'gsap'

const appStore = useAppStore()
const route = useRoute()
const { initAnimations, killAnimations } = useScrollAnimations()

// Responsive window width detection
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1920)
const isDesktop = computed(() => windowWidth.value >= 1200)

const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

// State for layout management
// We use a separate ref for body class to delay updates until AFTER the leave animation
const currentBodyClass = ref(route.meta.bodyClass)
const previousBodyClass = ref(route.meta.bodyClass) // Track previous layout for transition logic

// Determine if RightBar should be visible based on DELAYED route state (currentBodyClass)
// This prevents the sidebar from snapping before the page fades out
const shouldShowRightBar = computed(() => currentBodyClass.value !== 'mil-fw-page')

// Floating Player Logic
const floatingPlayerRef = ref(null)
const { width: windowWidthReactive, height: windowHeight } = useWindowSize()

// Default positions
// X: right edge (windowWidth - playerSize - gap)
// Y: middle (windowHeight / 2 - playerSize / 2)
const playerY = ref(windowHeight.value / 2 - 30) 
const playerX = ref(windowWidthReactive.value - (windowWidthReactive.value < 1200 ? 63 : 82))

// Enable dragging on both axes
const { position: dragPosition, isDragging } = useDraggable(floatingPlayerRef, {
  initialValue: { x: playerX.value, y: playerY.value },
  axis: 'both',
  activeElement: floatingPlayerRef
})

// Sync dragged position, clamping to screen bounds
watch(() => dragPosition.value, (newPos) => {
    const isMob = windowWidthReactive.value < 1200
    const gap = isMob ? 5 : 20
    const size = isMob ? 58 : 62 // Approximate player size with padding and border
    
    // Clamp Y
    const maxY = windowHeight.value - size - gap
    playerY.value = Math.max(gap, Math.min(newPos.y, maxY))
    
    // Clamp X
    const maxX = windowWidthReactive.value - size - gap
    playerX.value = Math.max(gap, Math.min(newPos.x, maxX))
}, { deep: true })

const setHeight = () => {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
}

// Update the physical body class based on our reactive state
const applyBodyClass = () => {
  if (currentBodyClass.value) {
    document.body.className = currentBodyClass.value
  } else {
    document.body.className = ''
  }
}

onMounted(() => {
   setHeight()
   window.addEventListener('resize', setHeight)
   window.addEventListener('resize', updateWindowWidth)
   // Initial body class set
   currentBodyClass.value = route.meta.bodyClass
   applyBodyClass()

   Fancybox.bind("[data-fancybox]", {
      // Your custom options
   });
   
   // Init animations directly
   setTimeout(() => {
     initAnimations()
     appStore.setLoading(false)
     appStore.setTransitioning(false) // Safety reset
   }, 100)
})

onUnmounted(() => {
    window.removeEventListener('resize', setHeight)
    window.removeEventListener('resize', updateWindowWidth)
    Fancybox.destroy();
})

// --- Transition Hooks with GSAP ---

const onEnter = (el, done) => {
  // 1. Add entering class for initial state
  el.classList.add('mil-page-entering')
  el.style.zIndex = '1'
  
  // 2. Determine if right sidebar needs to enter
  const isEnteringHalfPage = currentBodyClass.value === 'mil-half-page'
  const wasFullWidth = previousBodyClass.value === 'mil-fw-page'
  const rightPart = document.querySelector('.mil-right-part')
  
  // 3. Setup right sidebar for entrance ONLY if transitioning from Full → Half
  // If Half → Half, sidebar stays visible without animation
  const shouldAnimateSidebar = isEnteringHalfPage && wasFullWidth
  
  if (shouldAnimateSidebar && rightPart) {
    // Scenario: Full → Half (sidebar needs to enter)
    rightPart.classList.add('mil-entering')
    rightPart.classList.remove('mil-leaving', 'mil-ready')
  }
  
  // 4. Wait for the old page to fade out (approx 400ms) before starting the new page entrance
  setTimeout(() => {
    // Scroll to top when the new page is about to fade in (while black screen is solid)
    window.scrollTo(0, 0)
    
    // Remove entering class to trigger CSS transition
    el.classList.remove('mil-page-entering')
    
    // Animate right sidebar to ready state if entering
    if (shouldAnimateSidebar && rightPart) {
      rightPart.classList.remove('mil-entering')
      rightPart.classList.add('mil-ready')
    }
    
    // 5. Briefly keep the black screen solid, then fade it out
    setTimeout(() => {
       appStore.setTransitioning(false)
    }, 150)

    // 6. Cleanup after everything is settled
    setTimeout(() => {
      document.documentElement.classList.remove('is-animating')
      el.classList.remove('mil-page-leaving')
      
      if (rightPart) {
        rightPart.classList.remove('mil-leaving', 'mil-entering')
      }
      
      initAnimations()
      done()
    }, 500)
  }, 400) // Match this with onLeave duration
}

const onLeave = (el, done) => {
  // Kill old animations to prevent interference
  killAnimations()
  
  // 0. Save current body class as previous for next transition
  previousBodyClass.value = currentBodyClass.value
  
  // 1. Add is-animating class to trigger CSS animations
  document.documentElement.classList.add('is-animating')
  // transitioning is already set to true in router.beforeEach
  
  // 2. Determine transition type
  const isLeavingHalfPage = currentBodyClass.value === 'mil-half-page'
  const isGoingToFullWidth = route.meta.bodyClass === 'mil-fw-page'
  const isGoingToHalfPage = route.meta.bodyClass === 'mil-half-page'
  const rightPart = document.querySelector('.mil-right-part')
  
  // 3. Handle right sidebar based on transition type
  if (rightPart) {
    // Scenario: Half → Full (sidebar needs to leave)
    if (isLeavingHalfPage && isGoingToFullWidth) {
      rightPart.classList.add('mil-leaving')
      rightPart.classList.remove('mil-ready', 'mil-entering')
    }
    // Scenario: Keep sidebar visible (Half → Half)
    // No action needed, sidebar stays
  }
  
  // 4. Update body class EARLY for synchronized layout transitions
  if (route.meta.bodyClass !== currentBodyClass.value) {
    currentBodyClass.value = route.meta.bodyClass
    applyBodyClass()
  }
  
  // 5. Setup leaving element positioning
  gsap.set(el, { 
    position: 'absolute', 
    width: '100%',
    top: 0,
    left: 0,
    zIndex: 0 
  })
  
  // 6. Add CSS class to trigger leave animation
  el.classList.add('mil-page-leaving')
  
  // 7. Wait for leave animation to finish
  setTimeout(() => {
    done()
  }, 400)
}

const onAfterLeave = () => {
  // Body class update is now handled in onLeave for synchronized transitions
  // This hook can be used for any cleanup if needed in the future
}

</script>

<template>
  <div class="mil-frame-wrapper">
      <GlobalAudio />
      
      <!-- Global Floating Music Player -->
      <div 
        ref="floatingPlayerRef"
        class="mil-floating-player"
        :class="{ 'is-dragging': isDragging }"
        :style="{ top: `${playerY}px`, left: `${playerX}px` }"
      >
        <div class="player-drag-handle">
           <CompactMusicPlayer />
        </div>
      </div>
      <!-- Preloader removed -->
    <div class="mil-frame">
      <TheSidebar />
      
      <div class="mil-content">
        <div class="mil-overlay" :class="{ 'mil-active': appStore.isMenuOpen }" @click="appStore.closeMenu"></div>
        
        <div class="mil-left-part">
          <router-view v-slot="{ Component }">
            <transition 
              mode="default" 
              :css="false" 
              @enter="onEnter" 
              @leave="onLeave" 
              @after-leave="onAfterLeave"
            >
              <component :is="Component" :key="route.path" />
            </transition>
          </router-view>
          
          <!-- Page Transition Loader -->
          <div class="mil-transition-loader" :class="{ 'mil-active': appStore.transitioning }">
              <div class="mil-loader-content">
                  <div class="mil-loader-circle"></div>
                  <div class="mil-loader-text">Loading</div>
              </div>
          </div>

          <!-- Mobile RightBar (Visible only on mobile via CSS) -->
          <div v-if="isDesktop" class="mil-mobile-right-bar" :class="{ 'mil-hidden-trigger': !shouldShowRightBar }">
             <TheRightBar />
          </div>
        </div>
        
        <!-- Desktop RightBar - Only render on desktop (>= 1200px) -->
        <div v-if="isDesktop" class="mil-right-part" :class="{ 'mil-hidden-trigger': !shouldShowRightBar }">
           <TheRightBar />
        </div>
        
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Floating Music Player */
.mil-floating-player {
  position: fixed;
  z-index: 2147483647; /* Maximum possible z-index to stay above absolutely everything */
  background: rgba(44, 44, 44, 0.4); /* Transparent glass look */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 8px;
  border-radius: 50%;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.05);
  cursor: grab;
  touch-action: none; /* Prevent scrolling when dragging */
}

/* Hover and active visual states */
.mil-floating-player:active,
.mil-floating-player.is-dragging {
  cursor: grabbing;
  transform: scale(1.05);
}

.mil-floating-player:hover {
  background: rgba(44, 44, 44, 0.8);
  border-color: rgba(255, 255, 255, 0.1);
}

.player-drag-handle {
  pointer-events: none; /* Let the wrapper handle drag and allow clicks to pass to player */
}
.player-drag-handle :deep(*) {
   pointer-events: auto;
}

@media (max-width: 1200px) {
  .mil-floating-player {
    padding: 6px;
  }
}

/* Mobile RightBar logic */
.mil-mobile-right-bar {
  display: block;
  margin-top: 30px;
  transition: all 0.8s ease; 
}


/* Trigger class to fade out sidebar when navigating to full-width page */
/* This now reacts to currentBodyClass, so it stays visible until afterLeave */
.mil-hidden-trigger {
    opacity: 0;
    transform: translateY(20px);
    filter: blur(5px);
    pointer-events: none;
    transition: all 0.4s ease; /* Faster exit for sidebar */
}

@media (min-width: 1200px) {
  .mil-mobile-right-bar {
    display: none;
  }
}

</style>
