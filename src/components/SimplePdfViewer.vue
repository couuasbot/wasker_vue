
<script setup>
import { ref, onMounted } from 'vue';

import VuePdfEmbed from 'vue-pdf-embed';


const props = defineProps({
  src: {
    type: String,
    required: true
  }
});

const page = ref(1);
const pageCount = ref(1);
const isVisible = ref(false);
const pdfContainer = ref(null);

onMounted(() => {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            isVisible.value = true;
            observer.disconnect();
        }
    }, { rootMargin: '200px' });

    if (pdfContainer.value) {
        observer.observe(pdfContainer.value);
    }
});


function handleDocumentLoad(doc) {
  pageCount.value = doc.numPages;
}

function prevPage() {
  if (page.value > 1) {
    page.value--;
  }
}

function nextPage() {
  if (page.value < pageCount.value) {
    page.value++;
  }
}
</script>

<template>
  <div class="simple-pdf-viewer">
    <div class="pdf-wrapper" ref="pdfContainer">
        <div v-if="!isVisible" class="pdf-placeholder">
            <div class="loading-spinner"></div>
            <span>Loading PDF...</span>
        </div>
        <VuePdfEmbed 
            v-else
            :source="src" 
            :page="page"
            @loaded="handleDocumentLoad" 
        />
    </div>


    <!-- Navigation Controls -->
    <div class="pdf-controls" v-if="pageCount > 1">
        <button 
            class="control-btn" 
            @click="prevPage" 
            :disabled="page <= 1"
            title="Previous Page">
            <i class="fas fa-chevron-left"></i>
        </button>
        
        <span class="page-info">{{ page }} / {{ pageCount }}</span>

        <button 
            class="control-btn" 
            @click="nextPage" 
            :disabled="page >= pageCount"
            title="Next Page">
            <i class="fas fa-chevron-right"></i>
        </button>
    </div>
  </div>
</template>

<style scoped>
.simple-pdf-viewer {
  width: 100%;
  max-width: 100%;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px;
  box-sizing: border-box;
}

.pdf-wrapper {
    width: 100%;
    margin-bottom: 20px;
    box-shadow: 0 5px 20px rgba(0,0,0,0.2);
    border-radius: 4px;
    overflow: hidden;
}

/* Ensure image scales properly */
:deep(.vue-pdf-embed canvas) {
    width: 100% !important;
    height: auto !important;
    display: block;
}

.pdf-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
}

.control-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
}

.control-btn:hover:not(:disabled) {
    background: #DBA91C;
    border-color: #DBA91C;
    color: #000;
}

.control-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.page-info {
    font-size: 14px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
    min-width: 60px;
    text-align: center;
}

.pdf-placeholder {
    height: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.5);
    gap: 15px;
}

.loading-spinner {
    width: 30px;
    height: 30px;
    border: 3px solid rgba(255,255,255,0.1);
    border-top-color: #DBA91C;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

</style>
