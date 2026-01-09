<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import { useMarkdown } from '@/composables/useMarkdown'
import { useScrollAnimations } from '@/composables/useScrollAnimations'
import { useAppStore } from '@/stores/app'
import ToastNotification from '@/components/ToastNotification.vue'
import { storeToRefs } from 'pinia'

const { getPosts, getCategories } = useMarkdown()
const { initAnimations } = useScrollAnimations()
const appStore = useAppStore()
const { currentLang } = storeToRefs(appStore)

const allWorks = getPosts('portfolio')
const categories = getCategories('portfolio')

const activeCategory = ref('All')
const isExpanded = ref(false)
const toggledSlug = ref(null)

const filteredWorks = computed(() => {
    let works = allWorks.value.filter(p => p.lang === currentLang.value)
    if (activeCategory.value !== 'All') {
        works = works.filter(p => p.category === activeCategory.value)
    }
    return works
})

const toggleLang = () => {
    appStore.toggleLang()
}

const displayedWorks = computed(() => {
    if (isExpanded.value) {
        return filteredWorks.value
    }
    return filteredWorks.value.slice(0, 6)
})

const showViewMore = computed(() => {
    return !isExpanded.value && filteredWorks.value.length > 6
})

const switchCategory = (cat) => {
    activeCategory.value = cat
    isExpanded.value = false
}

const switchToFullWidth = () => {
    isExpanded.value = true
}

const toggleCard = (slug) => {
    if (window.innerWidth <= 768) {
        toggledSlug.value = toggledSlug.value === slug ? null : slug
    }
}

// Watch for changes in displayed works to trigger animations
watch(displayedWorks, async () => {
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
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
    checkOverflow()
    window.addEventListener('resize', checkOverflow)
})

onUnmounted(() => {
    window.removeEventListener('resize', checkOverflow)
})

watch([categories, currentLang], async () => {
   await nextTick()
   checkOverflow()
})

// Action Menu State
const isActionMenuOpen = ref(false)
const isFullScreen = ref(false)
const isListView = ref(false)

const toggleActionMenu = () => {
    isActionMenuOpen.value = !isActionMenuOpen.value
}

const toggleFullScreen = () => {
    isFullScreen.value = !isFullScreen.value
    if (isFullScreen.value) {
        document.body.classList.remove('mil-half-page')
        document.body.classList.add('mil-fw-page')
    } else {
        document.body.classList.remove('mil-fw-page')
        document.body.classList.add('mil-half-page')
    }
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
</script>

<template>
    <div class="mil-content-frame">
        <ToastNotification ref="toastRef" />
        <div class="mil-scroll mil-bp-fix mil-half-1">
            <div class="mil-row-fix">
                
                <!-- Grid View -->
                <div class="row" v-if="!isListView">
                    <div v-for="(work, index) in displayedWorks" :key="work.slug" :class="(displayedWorks.length % 2 !== 0 && index === 0) ? 'col-lg-12' : 'col-lg-6'">
                        <div 
                            class="mil-blog-card mil-mb-15 mil-up"
                            :class="{ 'mil-active': toggledSlug === work.slug }"
                            @click="toggleCard(work.slug)"
                        >
                            <img :src="work.image" :alt="work.title" v-if="work.image">
                            <div class="mil-descr">
                                <div class="mil-post-text">
                                    <div class="mil-left">
                                        <h3 class="mil-line-height mil-mb-20">{{ work.title }}</h3>
                                        <router-link :to="'/portfolio/' + work.slug" class="mil-link mil-hover-link mil-accent">read more</router-link>
                                        <router-link v-if="work.pdf" :to="'/presentation/' + work.slug" class="mil-link mil-hover-link mil-accent" style="margin-left: 30px;">Read PPT</router-link>
                                    </div>
                                    <div class="mil-right">
                                        <p>{{ work.description }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- List View (Table Style) -->
                <div class="mil-list-container" v-else>
                    <router-link 
                        v-for="work in displayedWorks" 
                        :key="work.slug" 
                        :to="'/portfolio/' + work.slug"
                        class="mil-list-row mil-up"
                    >
                        <div class="mil-list-col mil-list-date">{{ formatDate(work.date) }}</div>
                        <div class="mil-list-col mil-list-cat"><span class="mil-cat-pill">{{ work.category }}</span></div>
                        <div class="mil-list-col mil-list-title">
                            <h6>{{ work.title }}</h6>
                            <p class="mil-list-desc" v-if="work.description">{{ work.description }}</p>
                        </div>
                        <div class="mil-list-col mil-list-arrow"><i class="fas fa-arrow-right"></i></div>
                    </router-link>
                </div>

                <div v-if="filteredWorks.length === 0" class="col-12 mil-mb-15">
                    <p>No projects found in this category.</p>
                </div>
            </div>

            <div class="mil-bottom-panel mil-up-instant">
                <div class="mil-w-100 mil-list-footer">
                    
                    <!-- Left: Share Button -->
                    <div class="mil-fixed-icon mil-left-icon" @click="copyLink" style="cursor: pointer;" title="Copy Link">
                        <i :class="['fas', copied ? 'fa-check' : 'fa-share-alt']"></i>
                    </div>

                    <!-- Center: Filter Categories -->
                    <div class="mil-filter-container" :class="{ 'mil-has-overflow': isOverflowing }">
                        <div class="mil-filter" ref="filterContainer">
                            <a v-for="cat in categories" :key="cat" 
                                @click.prevent="switchCategory(cat)"
                                href="#" 
                                :class="['mil-link', 'mil-pill', { 'mil-current': activeCategory === cat }]" 
                                data-no-swup>
                                {{ cat }}
                            </a>
                        </div>
                    </div>
                    
                    <!-- Right: Action Menu (Replaces standalone Language Switch) -->
                    <div class="mil-action-menu-wrapper" :class="{ 'mil-active': isActionMenuOpen }">
                        <div class="mil-action-list">
                            <!-- Layout Toggle -->
                            <div class="mil-action-btn" @click="toggleLayout" :title="isListView ? 'Grid View' : 'List View'">
                                <i :class="['fas', isListView ? 'fa-th-large' : 'fa-list']"></i>
                            </div>
                            <!-- Language Toggle -->
                            <div class="mil-action-btn" @click="toggleLang" title="Switch Language">
                                <i class="fas fa-globe"></i>
                            </div>
                            <!-- Full Screen Toggle -->
                            <div class="mil-action-btn" @click="toggleFullScreen" :title="isFullScreen ? 'Original View' : 'Full Screen View'">
                                <i :class="['fas', isFullScreen ? 'fa-compress-alt' : 'fa-expand-alt']"></i>
                            </div>
                        </div>
                        <div class="mil-action-trigger mil-icon-btn" @click="toggleActionMenu" :class="{ 'mil-active': isActionMenuOpen }">
                            <i :class="['fas', isActionMenuOpen ? 'fa-times' : 'fa-ellipsis-v']"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
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
    background: rgba(255, 255, 255, 0.03);
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

.mil-list-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0 15px;
    gap: 15px;
}

/* Fixed Icons (Left & Right) */


/* Center Container */
.mil-filter-container {
    flex: 1;
    display: flex;
    justify-content: center;
    overflow: hidden;
    padding: 8px;
    /* Removed heavy container styling */
    background: transparent;
    border-radius: 0;
    border: none;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
}

/* Active Overflow State */
.mil-filter-container.mil-has-overflow {
    justify-content: flex-start;
    /* Add subtle cue for overflow if needed, or keep clean */
    mask-image: linear-gradient(to right, transparent, black 20px, black 95%, transparent);
    -webkit-mask-image: linear-gradient(to right, transparent, black 20px, black 95%, transparent);
}

.mil-filter {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    overflow-x: auto;
    white-space: nowrap;
    gap: 20px; /* Increased gap for cleaner look */
    -ms-overflow-style: none;
    scrollbar-width: none;
    padding: 6px;
    width: 100%;
}

/* If not overflowing, let content be natural width to center properly */
.mil-filter-container:not(.mil-has-overflow) .mil-filter {
    width: auto;
    justify-content: center;
}

.mil-filter::-webkit-scrollbar {
    display: none;
}

/* Pill Styling - Simplified to Minimal Text */
.mil-link.mil-pill {
    padding: 8px 0; /* Removing horizontal padding for text-only look */
    background: transparent;
    border-radius: 0;
    border: none; /* Removed border */
    font-size: 11px;
    letter-spacing: 2px;
    font-weight: 500;
    transition: all 0.3s ease;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.5); /* Dimmed default state */
    text-decoration: none;
    white-space: nowrap;
    position: relative;
    backdrop-filter: none;
}

.mil-link.mil-pill:hover {
    background: transparent;
    color: #fff;
    transform: translateY(0);
    border-color: transparent;
    box-shadow: none;
}

.mil-link.mil-pill.mil-current {
    background: transparent;
    color: #fff; /* Active is bright white */
    border-color: transparent;
    box-shadow: none;
    font-weight: 700;
    transform: translateY(0);
}

/* Optional: Add a small dot for the active item */
.mil-link.mil-pill.mil-current::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    background-color: #DBA91C; /* Gold accent */
    border-radius: 50%;
    box-shadow: 0 0 10px #DBA91C;
}

.mil-link.mil-pill.mil-current::before {
    display: none;
}


</style>
