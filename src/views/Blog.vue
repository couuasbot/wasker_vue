<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useMarkdown } from '@/composables/useMarkdown'
import { useScrollAnimations } from '@/composables/useScrollAnimations'
import { useAppStore } from '@/stores/app'
import ToastNotification from '@/components/ToastNotification.vue'
import { storeToRefs } from 'pinia'

const { getPosts, getCategories } = useMarkdown()
const { initAnimations } = useScrollAnimations()
const appStore = useAppStore()
const { currentLang, isFullScreen } = storeToRefs(appStore)

const allPosts = getPosts('blog')
const categories = getCategories('blog', currentLang)

const activeCategory = ref('All')
const isExpanded = ref(false)
const toggledSlug = ref(null)

const filteredPosts = computed(() => {
    let posts = allPosts.value.filter(p => p.lang === currentLang.value)
    if (activeCategory.value !== 'All') {
        posts = posts.filter(p => p.category === activeCategory.value)
    }
    return posts
})

const toggleLang = () => {
    appStore.toggleLang()
}

const displayedPosts = computed(() => {
    if (isExpanded.value) {
        return filteredPosts.value
    }
    return filteredPosts.value.slice(0, 6)
})

const showViewMore = computed(() => {
    return !isExpanded.value && filteredPosts.value.length > 6
})

const switchCategory = (cat) => {
    activeCategory.value = cat
    isExpanded.value = false // Reset expansion on category change
}

const switchToFullWidth = () => {
    isExpanded.value = true
    document.body.classList.remove('mil-half-page')
    document.body.classList.add('mil-fw-page')
}

const toggleCard = (slug) => {
    if (window.innerWidth <= 768) {
        toggledSlug.value = toggledSlug.value === slug ? null : slug
    }
}

// Watch for changes in displayed posts to trigger animations
watch(displayedPosts, async () => {
    await nextTick()
    initAnimations()
}, { deep: true })

// Overflow Detection
const filterContainer = ref(null)
const isOverflowing = ref(false)

const checkOverflow = () => {
    if (filterContainer.value) {
        const el = filterContainer.value
        isOverflowing.value = el.scrollWidth > el.clientWidth
    }
}

// Check on mount, resize, and data change
const isMobile = ref(false)
const checkMobile = () => {
    isMobile.value = window.innerWidth <= 1200
}

onMounted(() => {
    checkOverflow()
    checkMobile()
    window.addEventListener('resize', checkOverflow)
    window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
    window.removeEventListener('resize', checkOverflow)
    window.removeEventListener('resize', checkMobile)
})

watch([categories, currentLang], async () => {
   await nextTick()
   checkOverflow()
})

// Action Menu State
const isActionMenuOpen = ref(false)
// const isFullScreen = ref(false) // Removed local state
const isListView = ref(false)

const toggleActionMenu = () => {
    isActionMenuOpen.value = !isActionMenuOpen.value
}

const toggleFullScreen = () => {
    appStore.toggleFullScreen()
}

const toggleLayout = () => {
    isListView.value = !isListView.value
}

watch(isListView, async () => {
    await nextTick()
    initAnimations()
})

const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Share Logic
const copied = ref(false)
const toastRef = ref(null)

const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    copied.value = true
    if (toastRef.value) {
        toastRef.value.show('Link copied to clipboard', 'success')
    }
    setTimeout(() => { copied.value = false }, 2000)
}
// Drag to Scroll Logic
const scrollContainer = ref(null)
const isDragging = ref(false)
const startX = ref(0)
const scrollLeft = ref(0)
const isDragClick = ref(false) // Distinguish drag from click

const startDrag = (e) => {
    isDragging.value = true
    isDragClick.value = false
    startX.value = e.pageX - scrollContainer.value.offsetLeft
    scrollLeft.value = scrollContainer.value.scrollLeft
}

const stopDrag = () => {
    isDragging.value = false
}

const doDrag = (e) => {
    if (!isDragging.value) return;
    e.preventDefault();
    isDragClick.value = true // If moved, it's a drag
    const x = e.pageX - scrollContainer.value.offsetLeft;
    const walk = (x - startX.value) * 2; // Scroll-fast
    scrollContainer.value.scrollLeft = scrollLeft.value - walk;
}

const handleWheel = (e) => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollLeft += e.deltaY;
  }
}
</script>

<template>
    <div class="mil-content-frame mil-page">
        <ToastNotification ref="toastRef" />
        <div class="mil-scroll mil-half-1 mil-bp-fix">
            <div class="mil-row-fix">
                
                <!-- Grid View -->
                <div class="row" v-if="!isListView">
                    <!-- Posts Loop -->
                    <div v-for="(post, index) in displayedPosts" :key="post.slug" :class="(displayedPosts.length % 2 !== 0 && index === 0) ? 'col-lg-12' : 'col-lg-6'">
                        <div 
                            class="mil-blog-card mil-mb-15 mil-up"
                            :class="{ 'mil-active': toggledSlug === post.slug }"
                            @click="toggleCard(post.slug)"
                        >
                            <img :src="post.image" :alt="post.title" v-if="post.image">
                            <div class="mil-descr">
                                <div class="mil-post-text">
                                    <div class="mil-left">
                                        <h3 class="mil-line-height mil-mb-30">{{ post.title }}</h3>
                                        <router-link :to="'/blog/' + post.slug" class="mil-link mil-hover-link mil-accent">read more</router-link>
                                    </div>
                                    <div class="mil-right">
                                        <p>{{ post.description }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- List View (Table Style) -->
                <div class="mil-list-container" v-else>
                    <router-link 
                        v-for="post in displayedPosts" 
                        :key="post.slug" 
                        :to="'/blog/' + post.slug"
                        class="mil-list-row mil-up"
                    >
                        <div class="mil-list-col mil-list-date">{{ formatDate(post.date) }}</div>
                        <div class="mil-list-col mil-list-cat"><span class="mil-cat-pill">{{ post.category }}</span></div>
                        <div class="mil-list-col mil-list-title">
                            <h6>{{ post.title }}</h6>
                            <p class="mil-list-desc" v-if="post.description">{{ post.description }}</p>
                        </div>
                        <div class="mil-list-col mil-list-arrow"><i class="fas fa-arrow-right"></i></div>
                    </router-link>
                </div>

                <div v-if="filteredPosts.length === 0" class="col-12 mil-mb-15">
                    <p>No posts found in this category.</p>
                </div>

                <!-- Show All / Show Less Button -->
                <div v-if="filteredPosts.length > 6" class="col-12" style="display: flex; justify-content: center; margin-top: 20px; margin-bottom: 50px;">
                    <button @click="isExpanded = !isExpanded" class="mil-show-all-btn" :class="{ 'expanded': isExpanded }">
                        <span>{{ isExpanded ? (currentLang === 'zh' ? '收起' : 'Show Less') : (currentLang === 'zh' ? '显示全部' : 'Show All') }}</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>

            </div>
        </div>

        <!-- Integrated Bottom Panel (Teleported to body on mobile to avoid transition-fade bugs) -->
        <Teleport to="body" :disabled="!isMobile">
            <div class="mil-bottom-panel">
                    <div class="mil-jcc mil-space-15 mil-w-100">
                        <div class="mil-jcb mil-w-100 mil-p-30-0" :class="{ 'mil-actions-open': isActionMenuOpen }" style="position: relative;">
                            
                            <!-- Fixed Left Action -->
                            <div class="mil-bar-left-action">
                                <div class="mil-action-trigger mil-icon-btn" @click="copyLink" title="Copy Link">
                                    <i :class="['fas', copied ? 'fa-check' : 'fa-share-alt']"></i>
                                </div>
                            </div>

                            <!-- Default Bar Content -->
                            <div class="mil-bar-default">

                                <!-- Center: Categories Filter (Scrollable) -->
                                <div class="mil-bottom-centered" style="display: flex; justify-content: center; flex: 1; overflow: hidden;">
                                    <ul 
                                        class="mil-bottom-menu"
                                        ref="scrollContainer"
                                        @mousedown="startDrag"
                                        @mouseleave="stopDrag"
                                        @mouseup="stopDrag"
                                        @mousemove="doDrag"
                                        @wheel.prevent="handleWheel"
                                    >
                                        <li 
                                            v-for="cat in categories" 
                                            :key="cat" 
                                            :class="{ 'mil-active': activeCategory === cat }"
                                            @click="switchCategory(cat)"
                                        >
                                            {{ cat }}
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <!-- Action Buttons (slide in from right) -->
                            <div class="mil-bar-actions">
                                <div class="mil-action-list">
                                    <div class="mil-action-btn" @click="toggleLayout" :title="isListView ? 'Grid View' : 'List View'">
                                        <i :class="['fas', isListView ? 'fa-th-large' : 'fa-list']"></i>
                                    </div>
                                    <div class="mil-action-btn" @click="toggleLang" title="Switch Language">
                                        <i class="fas fa-globe"></i>
                                    </div>
                                    <div class="mil-action-btn" @click="toggleFullScreen" :title="isFullScreen ? 'Original View' : 'Full Screen View'">
                                        <i :class="['fas', isFullScreen ? 'fa-compress-alt' : 'fa-expand-alt']"></i>
                                    </div>
                                </div>
                            </div>

                            <!-- Fixed Trigger (never moves) -->
                            <div class="mil-bar-trigger">
                                <div class="mil-action-trigger mil-icon-btn" :class="{ 'mil-active': isActionMenuOpen }" @click="toggleActionMenu">
                                    <i :class="['fas', isActionMenuOpen ? 'fa-times' : 'fa-ellipsis-v']"></i>
                                </div>
                            </div>
                            
                        </div>
                    </div>
            </div>
        </Teleport>
    </div>
</template>

<style scoped>
.mil-page {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #121212;
  border-radius: 1rem;
  border: solid 0.1rem rgba(44, 44, 44, 0.2);
  overflow: hidden;
}

.cursor-pointer {
    cursor: pointer;
}

.mil-list-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 30px;
}

.mil-list-row {
    display: flex;
    align-items: center;
    padding: 20px 25px;
    background: rgba(255, 255, 255, 0.03); /* Subtle card bg */
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    transition: all 0.3s ease;
    text-decoration: none;
    color: inherit;
    gap: 20px;
}

.mil-list-row:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-3px);
    box-shadow: 0 5px 20px rgba(0,0,0,0.2);
}

.mil-list-date {
    font-size: 0.85rem;
    opacity: 0.6;
    white-space: nowrap;
    min-width: 100px;
}

.mil-list-cat {
    display: flex;
    align-items: center;
}

.mil-cat-pill {
    font-size: 0.75rem;
    padding: 3px 10px;
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 1px;
    white-space: nowrap;
}

.mil-list-title {
    flex-grow: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.mil-list-title h6 {
    margin: 0;
    font-size: 1.1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}



.mil-list-desc {
    margin: 5px 0 0 0;
    font-size: 0.85rem;
    opacity: 0.6;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: normal;
}

.mil-list-arrow {
    display: flex;
    align-items: center;
    opacity: 0.5;
    transition: transform 0.3s ease;
}

.mil-list-row:hover .mil-list-arrow {
    transform: translateX(5px);
    opacity: 1;
    color: var(--mil-accent);
}

/* Mobile Responsiveness for Table */
@media (max-width: 768px) {
    .mil-list-row {
        flex-wrap: wrap;
        gap: 10px;
    }
    .mil-list-date {
        order: 1;
        width: auto;
    }
    .mil-list-cat {
        order: 2;
        margin-left: auto;
    }
    .mil-list-title {
        order: 3;
        width: 100%;
        margin-top: 5px;
    }
    .mil-list-arrow {
        display: none; /* Hide arrow on mobile to save space */
    }
}

/* Bottom Panel Layout Styling */
.mil-bottom-centered {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 15px;
}

.mil-bottom-menu {
    list-style: none;
    padding: 0 10px;
    margin: 0;
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    gap: 5px;
    cursor: grab;
}

.mil-bottom-menu:active {
    cursor: grabbing;
}

.mil-bottom-menu::-webkit-scrollbar {
    display: none;
}

.mil-bottom-menu li {
    padding: 10px 20px;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--mil-text-primary);
    cursor: pointer;
    border-radius: 30px;
    white-space: nowrap;
    transition: all 0.3s ease;
    flex-shrink: 0;
}

.mil-bottom-menu li.mil-active {
    background-color: #FFD700;
    color: #000;
}

/* Action Menu Styles (Integrated) */
.mil-action-menu-wrapper {
    position: relative;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-left: 20px;
}

@media (max-width: 768px) {
    .mil-bottom-panel .mil-jcb {
        padding: 15px 0;
        gap: 10px;
    }
    
    .mil-bottom-left {
        flex: 0 0 auto !important;
    }

    .mil-bottom-right {
        flex: 0 0 auto !important;
    }
    
    .mil-bottom-centered {
        flex: 1 1 auto;
        max-width: none !important;
        min-width: 0;
        justify-content: center !important;
    }

    .mil-action-trigger {
        width: 40px;
        height: 40px;
    }
}

/* Beautiful Show All Button */
.mil-show-all-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 25px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 30px;
    color: var(--mil-text-primary);
    font-size: 14px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.mil-show-all-btn:hover {
    background: rgba(255, 255, 255, 0.08); /* Matches other hovers */
    transform: translateY(-3px); /* Matches list-row hover */
    box-shadow: 0 5px 20px rgba(0,0,0,0.2); /* Matches list-row */
    border-color: rgba(255, 255, 255, 0.2);
    color: var(--mil-accent);
}

.mil-show-all-btn i {
    font-size: 12px;
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.mil-show-all-btn.expanded i {
    transform: rotate(180deg);
}
</style>