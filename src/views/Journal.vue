<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useMarkdown } from '@/composables/useMarkdown' // Ensure this path is correct
import { useScrollAnimations } from '@/composables/useScrollAnimations'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'
import JournalCalendar from '@/components/JournalCalendar.vue' // Will create in Phase 3

const { getPosts } = useMarkdown()
const { initAnimations } = useScrollAnimations()
const appStore = useAppStore()
const { currentLang, isFullScreen } = storeToRefs(appStore)

const isActionMenuOpen = ref(false)
// const isFullScreen = ref(false) // Removed local ref

const toggleActionMenu = () => {
    isActionMenuOpen.value = !isActionMenuOpen.value
}

const toggleLang = () => {
    appStore.toggleLang()
}

const toggleFullScreen = () => {
    appStore.toggleFullScreen()
}

const allJournalPosts = getPosts('journal')
const activeDates = computed(() => {
    // Return set of date strings 'YYYY-MM-DD'
    // Ensure we handle both Date objects and strings cleanly
    return new Set(allJournalPosts.value
        .filter(p => p.lang === currentLang.value)
        .map(p => {
            // Frontmatter might parse date as Date object or string
            const d = new Date(p.date)
            // robust YYYY-MM-DD generation
            const year = d.getFullYear()
            const month = (d.getMonth() + 1).toString().padStart(2, '0')
            const day = d.getDate().toString().padStart(2, '0')
            return `${year}-${month}-${day}`
        })
    )
})

// Group posts by Month
const groupedPosts = computed(() => {
    const groups = {}
    const posts = allJournalPosts.value.filter(p => p.lang === currentLang.value)
    
    posts.forEach(post => {
        const date = new Date(post.date)
        const yearBase = date.getFullYear()
        // Month is 0-indexed in JS
        const monthBase = date.getMonth() + 1 
        const monthKey = `${yearBase}-${monthBase.toString().padStart(2, '0')}`
        
        if (!groups[monthKey]) {
            groups[monthKey] = []
        }
        groups[monthKey].push(post)
    })
    
    // Sort keys descending (newest months first)
    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a))
    
    let globalIndex = 0
    
    return sortedKeys.map(key => {
        const [year, month] = key.split('-')
        const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long' })
        
        // Map posts to include layout info
        const enhancedPosts = groups[key].map(post => {
            const side = globalIndex % 2 === 0 ? 'left' : 'right'
            globalIndex++
            return {
                ...post,
                layoutSide: side
            }
        })
        
        return {
            key, // YYYY-MM
            label: `${monthName} ${year}`,
            posts: enhancedPosts
        }
    })
})

const currentVisibleMonth = ref('')
const isCalendarOpen = ref(false)

const isListView = ref(false)
const toggleLayout = () => {
    isListView.value = !isListView.value
}

const displayedJournalPosts = computed(() => {
    return allJournalPosts.value.filter(p => p.lang === currentLang.value)
})

const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const isMobile = ref(false)
const checkMobile = () => {
    isMobile.value = window.innerWidth <= 1200
}

// Observer logic
const observer = ref(null)
const monthRefs = ref([])

const setMonthRef = (el, key) => {
    if (el) {
        el.dataset.monthKey = key
        monthRefs.value.push(el)
    }
}

onMounted(() => {
    initAnimations()
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // Set initial visible month
    if (groupedPosts.value.length > 0) {
        currentVisibleMonth.value = groupedPosts.value[0].label
    }

    // Intersection Observer for Scroll Spy
    observer.value = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                 const key = entry.target.dataset.monthKey
                 const group = groupedPosts.value.find(g => g.key === key)
                 if (group) {
                     currentVisibleMonth.value = group.label
                 }
            }
        })
    }, {
        rootMargin: '-40% 0px -40% 0px', // Activate when element is in center 20%
        threshold: 0
    })

    nextTick(() => {
        monthRefs.value.forEach(el => observer.value.observe(el))
    })
})

onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
})

const toggleCalendar = () => {
    isCalendarOpen.value = !isCalendarOpen.value
}

const formatDateDay = (date) => {
    return new Date(date).getDate()
}

const formatDateWeekday = (date) => {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
}

const formatDateKey = (dateStr) => {
    const d = new Date(dateStr)
    const year = d.getFullYear()
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
}

const handleDateSelect = (dateKey) => {
    // Scroll to element
    const el = document.getElementById('date-' + dateKey)
    if (el) {
        // Toggle calendar closed
        isCalendarOpen.value = false
        // Smooth scroll
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
}

// Watch for data changes to re-init animations
watch(groupedPosts, async () => {
    await nextTick()
    initAnimations()
    // Re-observe month refs for scroll spy
    monthRefs.value = [] // Reset refs logic handled by template ref, but need to ensure observer picks them up
    // Actually the template ref function setMonthRef pushes to array.
    // When v-for updates, refs are updated. We just need to ensure observer observes them.
    // Ideally we disconnect and reconnect, or just observe new ones.
    // For simplicity in this setup, we can re-run the observer logic if needed, 
    // but initAnimations handles the visual 'mil-up' parts.
    
    // Re-attach observer for scroll spy if timeline view active
    if (observer.value && !isListView.value) {
        observer.value.disconnect()
        nextTick(() => {
             monthRefs.value.forEach(el => observer.value.observe(el))
        })
    }
})

watch(isListView, async () => {
    await nextTick()
    initAnimations()
    if (!isListView.value && observer.value) {
        monthRefs.value.forEach(el => observer.value.observe(el))
    }
})

</script>

<template>
    <div class="mil-content-frame">

            <div class="mil-scroll mil-half-1 mil-bp-fix">
            
            <div class="mil-journal-container" v-if="!isListView">
                 <!-- Main Timeline Spine -->
                 <div class="mil-timeline-spine"></div>

                 <!-- Group Loop -->
                 <div 
                    v-for="group in groupedPosts" 
                    :key="group.key" 
                    class="mil-month-group"
                    :ref="(el) => setMonthRef(el, group.key)"
                >
                    <!-- Month Divider/Label in Flow -->
                    <div class="mil-month-marker mil-up">
                        <span>{{ group.label }}</span>
                    </div>

                    <div class="mil-entries-wrapper">
                        <router-link 
                            v-for="(post, index) in group.posts" 
                            :key="post.slug"
                            :to="'/journal/' + post.slug"
                            :id="'date-' + formatDateKey(post.date)"
                            class="mil-journal-entry mil-up"
                            :class="post.layoutSide === 'left' ? 'mil-left-entry' : 'mil-right-entry'"
                        >
                            <div class="mil-entry-content">
                                <div class="mil-entry-date">
                                    <span class="mil-day">{{ formatDateDay(post.date) }}</span>
                                    <span class="mil-weekday">{{ formatDateWeekday(post.date) }}</span>
                                </div>
                                <div class="mil-entry-info">
                                    <h4>{{ post.title }}</h4>
                                    <div class="mil-entry-meta" v-if="post.weather || post.mood">
                                        <span v-if="post.weather"><i class="fas fa-cloud"></i> {{ post.weather }}</span>
                                        <span v-if="post.mood"><i class="fas fa-smile"></i> {{ post.mood }}</span>
                                    </div>
                                    <p v-if="post.description">{{ post.description }}</p>
                                </div>
                            </div>
                            <!-- Dot on spine -->
                            <div class="mil-timeline-dot"></div>
                        </router-link>
                    </div>
                 </div>
                 
                 <!-- Empty State -->
                 <div v-if="groupedPosts.length === 0" class="mil-p-90-75">
                     <p>No journal entries found.</p>
                 </div>
            </div>

            <!-- List View (Table Style) -->
            <div class="mil-list-container" v-else>
                <router-link 
                    v-for="post in displayedJournalPosts" 
                    :key="post.slug" 
                    :to="'/journal/' + post.slug"
                    class="mil-list-row mil-up"
                >
                    <div class="mil-list-col mil-list-date">{{ formatDate(post.date) }}</div>
                    <div class="mil-list-col mil-list-cat" v-if="post.weather || post.mood">
                        <span class="mil-cat-pill" v-if="post.weather"><i class="fas fa-cloud"></i> {{ post.weather }}</span>
                        <span class="mil-cat-pill" v-if="post.mood" :style="post.weather ? 'margin-left: 5px;' : ''"><i class="fas fa-smile"></i> {{ post.mood }}</span>
                    </div>
                    <div class="mil-list-col mil-list-title">
                        <h6>{{ post.title }}</h6>
                        <p class="mil-list-desc" v-if="post.description">{{ post.description }}</p>
                    </div>
                    <div class="mil-list-col mil-list-arrow"><i class="fas fa-arrow-right"></i></div>
                </router-link>
            </div>
        </div>

        <!-- Integrated Bottom Panel (Teleported to body on mobile) -->
        <Teleport to="body" :disabled="!isMobile">
            <div class="mil-bottom-panel">
                    <div class="mil-jcc mil-space-15 mil-w-100">
                        <div class="mil-jcb mil-w-100 mil-p-30-0" style="display: flex; align-items: center; justify-content: space-between;">
                            
                            <!-- Left: Calendar Toggle -->
                            <div class="mil-action-trigger mil-icon-btn" @click="toggleCalendar" title="Open Calendar" style="margin-right: 20px; order: 1;">
                                <i class="fas fa-calendar-alt"></i>
                            </div>

                            <!-- Center: Current Month Display -->
                            <div class="mil-bottom-centered" style="display: flex; justify-content: center; flex: 1; overflow: hidden; order: 2;">
                                <div class="mil-current-month-display">
                                    {{ currentVisibleMonth }}
                                </div>
                            </div>

                            <!-- Right: Action Menu (Unified style) -->
                            <div class="mil-action-menu-wrapper" :class="{ 'mil-active': isActionMenuOpen }" style="order: 3;">
                                <div class="mil-action-list">
                                    <!-- Layout Toggle -->
                                    <div class="mil-action-btn" @click="toggleLayout" :title="isListView ? 'Timeline View' : 'List View'">
                                        <i :class="['fas', isListView ? 'fa-stream' : 'fa-list']"></i>
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
        </Teleport>

            <!-- Calendar Overlay -->
            <div class="mil-calendar-overlay" :class="{ 'mil-active': isCalendarOpen }">
                     <div class="mil-calendar-modal">
                         <div class="mil-modal-header">
                             <h5>Journal Calendar</h5>
                             <span class="mil-close-btn" @click="toggleCalendar"><i class="fas fa-times"></i></span>
                         </div>
                         <div class="mil-modal-body">
                             <JournalCalendar :activeDates="activeDates" @select="handleDateSelect" />
                         </div>
                     </div>
                     <div class="mil-calendar-backdrop" @click="toggleCalendar"></div>
            </div>
    </div>
</template>

<style scoped>
.mil-journal-container {
    padding: 60px 0 120px;
    position: relative;
    max-width: 1000px;
    margin: 0 auto;
    width: 100%;
}

.mil-timeline-spine {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 2px;
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(-50%);
}

.mil-month-group {
    margin-bottom: 60px;
    position: relative;
}

.mil-month-marker {
    text-align: center;
    margin-bottom: 40px;
    position: relative;
    z-index: 2;
}

.mil-month-marker span {
    background: #121212; /* Match bg */
    padding: 5px 15px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    font-size: 12px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.6);
}

.mil-entries-wrapper {
    position: relative;
    width: 100%;
}

.mil-journal-entry {
    display: flex;
    justify-content: flex-end; /* Default for left side entries */
    position: relative;
    margin-bottom: 40px;
    width: 50%;
    padding-right: 40px;
    text-decoration: none;
    color: inherit;
    transition: transform 0.3s ease;
}

.mil-journal-entry.mil-right-entry {
    margin-left: 50%;
    justify-content: flex-start;
    padding-right: 0;
    padding-left: 40px;
}

.mil-journal-entry:hover {
    transform: translateY(-5px);
}

.mil-entry-content {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 25px;
    width: 100%;
    max-width: 400px;
    position: relative;
    display: flex;
    gap: 20px;
    transition: all 0.3s ease;
}

.mil-journal-entry:hover .mil-entry-content {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 5px 20px rgba(0,0,0,0.2);
}

/* Timeline Dot */
.mil-timeline-dot {
    position: absolute;
    top: 30px; /* Align with top of card */
    width: 10px;
    height: 10px;
    background: #DBA91C;
    border-radius: 50%;
    box-shadow: 0 0 0 5px #121212; /* Spacing from spine */
    z-index: 2;
}

.mil-left-entry .mil-timeline-dot {
    right: -5px; /* Half of width to center on spine */
}

.mil-right-entry .mil-timeline-dot {
    left: -5px;
}

/* Connector Line (visible only on hover maybe, or always) */
.mil-entry-content::after {
    content: '';
    position: absolute;
    top: 34px;
    width: 35px; /* Matches padding-right/left minus gap */
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
}

.mil-left-entry .mil-entry-content::after {
    right: -40px; /* Connect to spine */
}

.mil-right-entry .mil-entry-content::after {
    left: -40px;
}

/* Content Styling */
.mil-entry-date {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 50px;
    padding-right: 15px;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.mil-day {
    font-size: 24px;
    font-weight: 700;
    color: #DBA91C;
    line-height: 1;
}

.mil-weekday {
    font-size: 11px;
    text-transform: uppercase;
    opacity: 0.6;
    margin-top: 5px;
}

.mil-entry-info {
    flex-grow: 1;
}

.mil-entry-info h4 {
    margin: 0 0 10px;
    font-size: 18px;
}

.mil-entry-meta {
    display: flex;
    gap: 15px;
    font-size: 12px;
    opacity: 0.6;
    margin-bottom: 10px;
}

.mil-entry-meta i {
    width: 14px;
    color: #DBA91C;
}

.mil-entry-info p {
    margin: 0;
    font-size: 14px;
    opacity: 0.8;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
    .mil-timeline-spine {
        left: 20px; /* Shift spine to left */
    }

    .mil-journal-entry,
    .mil-journal-entry.mil-right-entry,
    .mil-journal-entry.mil-left-entry {
        width: 100%;
        margin-left: 0;
        justify-content: flex-start;
        padding-left: 50px; /* Spacing from left spine */
        padding-right: 20px;
    }

    .mil-left-entry .mil-timeline-dot,
    .mil-right-entry .mil-timeline-dot {
        right: auto;
        left: 15px; /* Center on spine at 20px */
    }

    .mil-left-entry .mil-entry-content::after,
    .mil-right-entry .mil-entry-content::after {
        left: -30px;
        width: 30px;
        right: auto;
    }
    
    .mil-entry-content {
        max-width: 100%;
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

.mil-current-month-display {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0 10px;
    color: #fff;
    text-align: center;
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

/* Calendar Modal (Restored & Fixed for Half-Page) */
.mil-calendar-overlay {
    position: absolute; /* Changed from fixed to absolute to stay within mil-content-frame */
    top: 0;
    left: 0;
    width: 100%;       /* Fill container, not viewport */
    height: 100%;      /* Fill container */
    z-index: 2000;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    visibility: hidden;
    transition: all 0.4s ease;
    backdrop-filter: blur(10px); /* Move backdrop filter here from override */
}

.mil-calendar-overlay.mil-active {
    opacity: 1;
    visibility: visible;
}

.mil-calendar-backdrop {
    position: absolute;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(5px);
}

.mil-calendar-modal {
    position: relative;
    background: #181818; 
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 24px; 
    width: 90%;
    max-width: 420px; 
    padding: 30px; 
    z-index: 2;
    transform: translateY(30px) scale(0.95); 
    transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1); 
    box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05);
}

.mil-calendar-overlay.mil-active .mil-calendar-modal {
    transform: translateY(0) scale(1);
}

.mil-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
}

.mil-close-btn {
    cursor: pointer;
    width: 30px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    background: rgba(255,255,255,0.05);
}

.mil-close-btn:hover {
    background: rgba(255,255,255,0.1);
    color: #DBA91C;
}

/* List View Styles */
.mil-list-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 30px;
    padding-top: 60px;
    padding-bottom: 120px;
    max-width: 1000px;
    margin: 0 auto;
    width: 100%;
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

.mil-cat-pill {
    font-size: 0.75rem;
    padding: 3px 10px;
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 1px;
    white-space: nowrap;
}
.mil-cat-pill i { color: #DBA91C; }

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
        display: none;
    }
}
</style>
