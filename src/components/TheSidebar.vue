<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'

const appStore = useAppStore()
const route = useRoute()
</script>

<template>
  <div class="mil-menu-part mil-sidebar-flex">
    <router-link to="/" class="mil-logo">
      <!-- text logo -->
      <span>wa</span>
    </router-link>
    <div class="mil-menu-panel mil-relative-panel" >

      <nav class="mil-main-menu" :class="{ 'mil-active': appStore.isMenuOpen }">
        
        <ul id="swupMenu" style="gap: 5px;">
          <!-- Home -->
          <router-link to="/" custom v-slot="{ href, navigate, isExactActive }">
            <li :class="{ 'mil-current': isExactActive }" @click="appStore.closeMenu">
              <a :href="href" @click="navigate" :class="{ 'mil-active': isExactActive }">
                <i class="fal fa-home"></i>
                <span>Home</span>
              </a>
            </li>
          </router-link>

          <!-- Blog -->
          <router-link to="/blog" custom v-slot="{ href, navigate, isExactActive }">
            <li :class="{ 'mil-current': isExactActive || route.name === 'blog-detail' }" @click="appStore.closeMenu">
              <a :href="href" @click="navigate" :class="{ 'mil-active': isExactActive || route.name === 'blog-detail' }">
                <i class="fal fa-book"></i>
                <span>{{ route.name === 'blog-detail' ? 'Back to Blog' : 'Blog' }}</span>
              </a>
            </li>
          </router-link>

          <!-- Journal -->
          <router-link to="/journal" custom v-slot="{ href, navigate, isExactActive }">
            <li :class="{ 'mil-current': isExactActive || route.name === 'journal-detail' }" @click="appStore.closeMenu">
              <a :href="href" @click="navigate" :class="{ 'mil-active': isExactActive || route.name === 'journal-detail' }">
                <i class="fal fa-pen-nib"></i>
                <span>{{ route.name === 'journal-detail' ? 'Back to Journal' : 'Journal' }}</span>
              </a>
            </li>
          </router-link>

          <!-- Galaxy -->
          <router-link to="/galaxy" custom v-slot="{ href, navigate, isExactActive }">
            <li :class="{ 'mil-current': isExactActive }" @click="appStore.closeMenu" class="mil-lab-item">
              <a :href="href" @click="navigate" :class="{ 'mil-active': isExactActive }">
                <i class="fal fa-atom"></i>
                <span>Galaxy</span>
              </a>
            </li>
          </router-link>
          
          <!-- Contact -->
          <router-link to="/contact" custom v-slot="{ href, navigate, isExactActive }">
            <li :class="{ 'mil-current': isExactActive }" @click="appStore.closeMenu">
              <a :href="href" @click="navigate" :class="{ 'mil-active': isExactActive }">
                <i class="fal fa-envelope"></i>
                <span>Contact</span>
              </a>
            </li>
          </router-link>

        </ul>
      </nav>



      <div class="mil-menu-btn" :class="{ 'mil-active': appStore.isMenuOpen }" @click="appStore.toggleMenu"><span></span></div>
    </div>

  </div>
</template>

<style scoped>
/* Premium Main Menu Styling */
.mil-main-menu ul {
    display: flex;
    flex-direction: column;
    padding: 0 1rem; /* Container padding */
}

/* Base item spacing */
.mil-main-menu ul li {
    margin-bottom: 0.8rem;
    position: relative; /* For absolutely positioned pseudo-elements */
}

/* Modern Pill-Shaped Links */
.mil-main-menu ul li a {
    display: flex;
    align-items: center;
    padding: 10px 15px;
    border-radius: 12px;
    color: #A5A5A5;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

/* Hover State - Soft Glassmorphism Pill */
.mil-main-menu ul li:not(.mil-current):hover a {
    background: rgba(255, 255, 255, 0.05); /* Very subtle white wash */
    color: #E0E0E0;
    transform: translateX(4px); /* Micro-animation: gentle nudge */
}

/* Icon Styling and Micro-animations */
.mil-main-menu ul li a i {
    width: 2.5rem;
    text-align: center;
    font-size: 1.4rem;
    transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55), color 0.3s ease;
}

.mil-main-menu ul li:hover a i {
    transform: scale(1.15); /* Icon pop on hover */
    color: #DBA91C; /* Accent color on hover */
}

/* Text Styling */
.mil-main-menu ul li a span {
    font-weight: 500;
    letter-spacing: 0.5px;
    font-size: 1.1rem;
    transition: color 0.3s ease;
}

/* Active/Current State - Glowing Accent */
.mil-main-menu ul li.mil-current a {
    color: #DBA91C;
    background: transparent; /* Keeping it clean, relying on indicator */
}

.mil-main-menu ul li.mil-current a i {
    color: #DBA91C;
}

.mil-main-menu ul li.mil-current a span {
    font-weight: 700;
    text-shadow: 0 0 10px rgba(219, 169, 28, 0.3); /* Subtle text glow */
}

/* Elegant Growing Line Indicator for Active State */
.mil-main-menu ul li::before {
    content: '';
    position: absolute;
    left: -1rem; /* Aligned to the edge of the container */
    top: 50%;
    transform: translateY(-50%) scaleY(0);
    height: 60%;
    width: 3px;
    background: #DBA91C;
    border-radius: 4px;
    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    box-shadow: 0 0 8px rgba(219, 169, 28, 0.5);
    z-index: 2;
}

.mil-main-menu ul li.mil-current::before {
    transform: translateY(-50%) scaleY(1);
}

/* Logo Premium Touch */
.mil-logo span {
    background: linear-gradient(135deg, #FFF, #DBA91C);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 800;
    letter-spacing: -1px;
    text-shadow: 0 4px 20px rgba(219, 169, 28, 0.15);
}

/* Lab Badge Styles */
.mil-lab-item a {
    justify-content: flex-start;
}

.mil-lab-badge {
    background: #DBA91C;
    color: #121212;
    font-size: 8px;
    font-weight: 900;
    padding: 2px 6px;
    border-radius: 6px;
    margin-left: auto; /* Push badge to the right */
    line-height: 1.2;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 8px rgba(219, 169, 28, 0.4);
    transition: all 0.3s ease;
}

.mil-current .mil-lab-badge {
    background: #fff;
    color: #121212;
    box-shadow: 0 2px 8px rgba(255, 255, 255, 0.4);
}

/* Separator */
.mil-sidebar-separator {
    border-top: 1px solid rgba(255, 255, 255, 0.05); /* Modern solid thin line instead of dotted */
    margin: 1.5rem 0; 
    list-style: none;
    width: 80%; /* Wider for modern look */
    margin-left: auto;
    margin-right: auto;
}

/* --- MOBILE RESPONSIVENESS OVERRIDES --- */
@media (max-width: 1200px) {
    /* Reset layout for horizontal mobile menu */
    .mil-main-menu ul {
        flex-direction: row;
        padding: 0;
        gap: 0 !important;
        justify-content: space-around; /* Distribute evenly */
        width: 100%;
    }

    .mil-main-menu ul li {
        margin-bottom: 0;
        flex: 1; /* Equal space distribution */
    }

    .mil-main-menu ul li a {
        padding: 8px 5px;
        flex-direction: column; /* Stack icon and text */
        border-radius: 8px;
        justify-content: center;
    }

    /* Reset desktop hover translates for mobile */
    .mil-main-menu ul li:not(.mil-current):hover a {
        transform: none; 
        background: transparent;
    }
    
    .mil-main-menu ul li:hover a i {
        transform: scale(1.1); /* Keep slight pop but reduce scale */
    }

    /* Ensure icons ARE VISIBLE on mobile, overriding legacy hide rule */
    .mil-main-menu ul li a i {
        display: block !important;
        margin-bottom: 4px;
        font-size: 1.2rem;
        width: auto;
    }

    .mil-main-menu ul li a span {
        font-size: 9px;
        letter-spacing: 0;
        text-align: center;
    }

    /* Redesign active indicator for mobile (bottom border instead of left line) */
    .mil-main-menu ul li::before {
        left: 50%;
        top: auto;
        bottom: -2px;
        height: 2px;
        width: 20px;
        transform: translateX(-50%) scaleX(0);
        margin: 0;
    }

    .mil-main-menu ul li.mil-current::before {
        transform: translateX(-50%) scaleX(1);
    }
    
    /* Hide separator on mobile horizontal nav */
    .mil-sidebar-separator {
        display: none;
    }
    
    /* Lab badge mobile adjustments */
    .mil-lab-badge {
        position: absolute;
        top: 2px;
        right: 15%;
        margin: 0;
        padding: 1px 4px;
        font-size: 7px;
    }
}
</style>
