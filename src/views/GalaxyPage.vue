<script setup>
import { ref, onMounted, onUnmounted, shallowRef, nextTick, computed, watch } from 'vue';
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'
import Galaxy3D from '../components/Galaxy3D.vue';
import GalaxyBottomSheet from '../components/GalaxyBottomSheet.vue';

const appStore = useAppStore()
const { currentLang, isFullScreen } = storeToRefs(appStore)

const selectedNode = shallowRef(null);
const graphData = shallowRef({ nodes: [], links: [] });

const filteredGraphData = computed(() => {
  const nodes = graphData.value.nodes.filter(n => n.lang === currentLang.value);
  const nodeIds = new Set(nodes.map(n => n.id));
  const links = graphData.value.links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));
  return { nodes, links };
});

const galaxy3dRef = ref(null);
const bottomSheetRef = ref(null);
const currentSheetHeight = ref(0);
const windowWidth = ref(window.innerWidth);

let sheetObserver = null;

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(async () => {
  const response = await fetch('/galaxy-data.json');
  graphData.value = await response.json();

  window.addEventListener('resize', handleResize);

  // Measure bottom sheet height
  sheetObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      currentSheetHeight.value = entry.target.offsetHeight;
    }
  });

  await nextTick();
  if (bottomSheetRef.value?.sheetRef) {
    sheetObserver.observe(bottomSheetRef.value.sheetRef);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (sheetObserver) sheetObserver.disconnect();
});

function handleNodeClick(node) {
  if (node) {
      // Sanitize the node object to avoid circular references (Three.js objects) causing Vue reactivity crashes
      selectedNode.value = {
          id: node.id,
          name: node.name,
          desc: node.desc,
          slug: node.slug,
          type: node.type,
          category: node.category,
          val: node.val,
          filePath: node.filePath
      };
  } else {
      selectedNode.value = null;
      currentSheetHeight.value = 0;
  }
}

function handleLocate(nodeId) {
  const node = filteredGraphData.value.nodes.find(n => n.id === nodeId);
  if (node && galaxy3dRef.value) {
    galaxy3dRef.value.focusNode(node);
    selectedNode.value = node;
  }
}

function handleReset() {
    if (galaxy3dRef.value) {
        galaxy3dRef.value.resetView();
        selectedNode.value = null;
        currentSheetHeight.value = 0;
    }
}

watch(currentLang, (newLang) => {
  if (selectedNode.value) {
    const { slug, type } = selectedNode.value;
    // Find equivalent node in the new language
    const newNode = graphData.value.nodes.find(n => n.lang === newLang && n.slug === slug && n.type === type);
    
    if (newNode) {
       // Update selected node with the new language version
       // The 3D view will maintain the camera POV due to persistence logic inside Galaxy3D.vue
       handleNodeClick(newNode);
    } else {
       // If no corresponding node found (e.g. translation missing), close the sheet
       selectedNode.value = null;
    }
  }
});
</script>

<template>
  <div class="mil-content-frame">
    <div class="galaxy-page">
      <div class="ui-overlay">
          <!-- Back Link (optional or removed if we use main nav, but keeping placeholder) -->
      </div>

      <!-- Language Switcher & Reset & Fullscreen -->
      <div class="galaxy-lang-switch">
          <span 
              class="lang-btn" 
              :class="{ 'active': currentLang === 'zh' }" 
              @click="appStore.setLang('zh')">ZH</span>
          <span class="divider">/</span>
          <span 
              class="lang-btn" 
              :class="{ 'active': currentLang === 'en' }" 
              @click="appStore.setLang('en')">EN</span>
          <span class="divider">/</span>
          <span 
              class="lang-btn" 
              @click="handleReset"
              title="Reset View">
              <i class="fal fa-dot-circle"></i>
          </span>
          <span class="divider">/</span>
          <span 
              class="lang-btn" 
              @click="appStore.toggleFullScreen()"
              :title="isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'">
              <i :class="['fal', isFullScreen ? 'fa-compress' : 'fa-expand']"></i>
          </span>
      </div>

      <div 
        class="galaxy-viewport" 
        :class="{ 'detail-open': !!selectedNode }"
        :style="selectedNode && windowWidth <= 1200 ? { height: `calc(100% - ${currentSheetHeight}px)` } : {}"
      >
          <Galaxy3D 
            ref="galaxy3dRef"
            :graphData="filteredGraphData"
            :selectedNodeId="selectedNode?.id"
            :onNodeClick="handleNodeClick" 
          />
      </div>
      
      <GalaxyBottomSheet 
        ref="bottomSheetRef"
        :node="selectedNode" 
        :graphData="filteredGraphData"
        :visible="!!selectedNode" 
        @close="selectedNode = null" 
        @locate="handleLocate"
      />
    </div>
  </div>
</template>

<style scoped>
/* Removed reset-view-btn styles as it is now integrated */

.galaxy-page {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #121212;
  border-radius: 1rem;
  border: solid 0.1rem rgba(44, 44, 44, 0.2);
  overflow: hidden;
}

@media (max-width: 1200px) {
  .galaxy-page {
    height: 100vh;
    height: calc(var(--vh, 1vh) * 100);
  }
}

.ui-overlay {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 20;
}

.back-link {
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.galaxy-viewport {
    width: 100%;
    height: 100%;
    transition: height 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    z-index: 10;
}

@media (max-width: 1200px) {
    /* No hardcoded height here, managed by JS for precision */
}

.galaxy-lang-switch {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 2200;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 8px 18px;
    border-radius: 30px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.galaxy-lang-switch .lang-btn {
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 4px 6px;
    border-radius: 6px;
}

.galaxy-lang-switch .lang-btn.active {
    color: #38bdf8;
    text-shadow: 0 0 12px rgba(56, 189, 248, 0.6);
    background: rgba(56, 189, 248, 0.1);
}

.galaxy-lang-switch .lang-btn:hover:not(.active) {
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.05);
}

@media (max-width: 1200px) {
    .galaxy-lang-switch {
        top: 10.5rem;
    }
}
</style>
