<template>
  <div class="skeleton-card">
    <!-- Image Skeleton with Sketching Animation -->
    <div class="skeleton-image">
      <div class="sketching-overlay">
        <svg
          class="sketch-pencil"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- Animated pencil stroke path -->
          <path
            d="M 10,10 Q 50,50 90,90"
            stroke="rgba(99, 102, 241, 0.2)"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
            class="sketch-path"
          />
          <path
            d="M 90,10 Q 50,50 10,90"
            stroke="rgba(99, 102, 241, 0.2)"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
            class="sketch-path"
            style="animation-delay: 0.5s"
          />
        </svg>
        <PenTool class="pencil-icon" />
      </div>
    </div>

    <!-- Content Skeleton -->
    <div class="skeleton-content">
      <!-- Target Word Placeholder -->
      <div class="skeleton-target">
        <div class="skeleton-line skeleton-word"></div>
        <div class="skeleton-line skeleton-reading"></div>
      </div>

      <!-- Field Placeholders -->
      <div class="skeleton-field">
        <div class="skeleton-label"></div>
        <div class="skeleton-line skeleton-short"></div>
      </div>

      <div class="skeleton-field">
        <div class="skeleton-label"></div>
        <div class="skeleton-line skeleton-long"></div>
        <div class="skeleton-line skeleton-medium"></div>
      </div>

      <div class="skeleton-field">
        <div class="skeleton-label"></div>
        <div class="skeleton-line skeleton-medium"></div>
      </div>
    </div>

    <!-- Footer Skeleton -->
    <div class="skeleton-footer">
      <div class="skeleton-button"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PenTool } from 'lucide-vue-next'
</script>

<style scoped>
.skeleton-card {
  width: 100%;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
}

/* Image Skeleton with Sketching Animation */
.skeleton-image {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: linear-gradient(
    90deg,
    #f3f4f6 0%,
    #e5e7eb 50%,
    #f3f4f6 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s ease-in-out infinite;
  position: relative;
  overflow: hidden;
}

.sketching-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sketch-pencil {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0.3;
}

.sketch-path {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: sketch 2s ease-in-out infinite;
}

@keyframes sketch {
  0% {
    stroke-dashoffset: 100;
    opacity: 0;
  }
  50% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
  100% {
    stroke-dashoffset: -100;
    opacity: 0;
  }
}

.pencil-icon {
  width: 32px;
  height: 32px;
  color: #6366f1;
  opacity: 0.4;
  animation: float 2s ease-in-out infinite;
  z-index: 1;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(-45deg);
  }
  50% {
    transform: translateY(-8px) rotate(-45deg);
  }
}

/* Content Skeleton */
.skeleton-content {
  padding: 24px;
}

.skeleton-target {
  text-align: center;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 20px;
}

.skeleton-line {
  height: 12px;
  background: linear-gradient(
    90deg,
    #e5e7eb 0%,
    #d1d5db 50%,
    #e5e7eb 100%
  );
  background-size: 200% 100%;
  border-radius: 6px;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-word {
  height: 32px;
  width: 60%;
  margin: 0 auto 12px;
}

.skeleton-reading {
  width: 40%;
  margin: 0 auto;
}

.skeleton-field {
  margin-bottom: 16px;
}

.skeleton-label {
  width: 60px;
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-short {
  width: 50%;
}

.skeleton-medium {
  width: 75%;
  margin-bottom: 6px;
}

.skeleton-long {
  width: 100%;
  margin-bottom: 6px;
}

/* Footer Skeleton */
.skeleton-footer {
  padding: 16px 24px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
}

.skeleton-button {
  width: 120px;
  height: 32px;
  background: #e5e7eb;
  border-radius: 6px;
  animation: pulse 1.5s ease-in-out infinite;
}

/* Animations */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .skeleton-card {
    background: #18181b;
    border-color: #3f3f46;
  }

  .skeleton-image {
    background: linear-gradient(
      90deg,
      #27272a 0%,
      #3f3f46 50%,
      #27272a 100%
    );
  }

  .skeleton-target {
    border-bottom-color: #3f3f46;
  }

  .skeleton-line {
    background: linear-gradient(
      90deg,
      #3f3f46 0%,
      #52525b 50%,
      #3f3f46 100%
    );
  }

  .skeleton-label {
    background: #27272a;
  }

  .skeleton-footer {
    background: #27272a;
    border-top-color: #3f3f46;
  }

  .skeleton-button {
    background: #3f3f46;
  }
}
</style>
