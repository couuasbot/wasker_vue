<script setup>
import { ref } from 'vue';

const isVisible = ref(false);
const message = ref('');
const type = ref('success'); // 'success' or 'error'

const show = (msg, msgType = 'success') => {
    message.value = msg;
    type.value = msgType;
    isVisible.value = true;

    // Auto hide after 5 seconds
    setTimeout(() => {
        isVisible.value = false;
    }, 5000);
};

const close = () => {
    isVisible.value = false;
};

defineExpose({ show });
</script>

<template>
    <Transition name="toast">
        <div v-if="isVisible" class="mil-toast" :class="type">
            <div class="mil-toast-icon">
                <i v-if="type === 'success'" class="fal fa-check-circle"></i>
                <i v-else class="fal fa-exclamation-circle"></i>
            </div>
            <div class="mil-toast-content">
                <div class="mil-toast-title">{{ type === 'success' ? 'Success' : 'Error' }}</div>
                <div class="mil-toast-message" v-html="message"></div>
            </div>
            <div class="mil-toast-close" @click="close">
                <i class="fal fa-times"></i>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.mil-toast {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100px; /* Reduced specific height to cover bottom bar area */
    background: linear-gradient(135deg, rgba(18, 18, 18, 0.98), rgba(18, 18, 18, 0.95));
    backdrop-filter: blur(20px);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: center; /* Center content horizontally */
    align-items: center;
    gap: 20px;
    z-index: 9999;
    padding: 0 30px;
    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5);
}

.mil-toast.success {
    border-top: 1px solid rgba(85, 230, 165, 0.3);
    background: linear-gradient(135deg, rgba(18, 18, 18, 0.98), rgba(85, 230, 165, 0.05));
}

.mil-toast.error {
    border-top: 1px solid rgba(255, 77, 77, 0.3);
    background: linear-gradient(135deg, rgba(18, 18, 18, 0.98), rgba(255, 77, 77, 0.05));
}

.mil-toast-icon {
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
}

.mil-toast.success .mil-toast-icon {
    color: #55e6a5;
    background: rgba(85, 230, 165, 0.1);
    box-shadow: 0 0 15px rgba(85, 230, 165, 0.2);
}

.mil-toast.error .mil-toast-icon {
    color: #ff4d4d;
    background: rgba(255, 77, 77, 0.1);
}

.mil-toast-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.mil-toast-title {
    font-weight: 700;
    color: #fff;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 2px;
}

.mil-toast-message {
    color: rgba(255, 255, 255, 0.6);
    font-size: 13px;
}

.mil-toast-close {
    cursor: pointer;
    color: rgba(255, 255, 255, 0.4);
    transition: 0.3s;
    width: 40px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    border: 1px solid transparent;
    margin-left: auto; /* Push close button to far right if not centered */
    position: absolute; /* Absolute position to ensure centering of content doesn't shift */
    right: 30px;
}

.mil-toast-close:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
}

/* Animations */
.toast-enter-active,
.toast-leave-active {
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from,
.toast-leave-to {
    transform: translateY(100%);
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .mil-toast {
        padding: 0 20px;
        height: 90px;
    }
    
    .mil-toast-title {
        font-size: 13px;
    }
    
    .mil-toast-message {
        font-size: 12px;
    }

    .mil-toast-close {
        right: 20px;
        width: 36px;
        height: 36px;
    }
}
</style>
