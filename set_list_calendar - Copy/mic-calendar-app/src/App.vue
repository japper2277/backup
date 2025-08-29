<template>
  <div id="app">
    <!-- App Header -->
    <header class="app-header">
      <div class="header-left">
        <div class="app-logo">
          <i class="fas fa-calendar-alt"></i>
          Mic Calendar
        </div>
        <div class="nav-toggle">
          <button 
            class="nav-toggle-btn" 
            :class="{ active: $route.path === '/' }"
            @click="$router.push('/')"
          >
            <i class="fas fa-calendar"></i>
            Calendar
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
      <div 
        class="bottom-nav-item" 
        :class="{ active: $route.path === '/' }"
        @click="$router.push('/')"
      >
        <i class="fas fa-calendar-alt"></i>
        <span>Calendar</span>
      </div>
      <div 
        class="bottom-nav-item" 
        :class="{ active: $route.path === '/library' }"
        @click="$router.push('/library')"
      >
        <i class="fas fa-lightbulb"></i>
        <span>Library</span>
      </div>
      <div 
        class="bottom-nav-item" 
        :class="{ active: $route.path === '/stats' }"
        @click="$router.push('/stats')"
      >
        <i class="fas fa-chart-bar"></i>
        <span>Stats</span>
      </div>
    </nav>
  </div>
</template>

<script setup>
// Component logic will be here
</script>

<style>
/* Global styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #f8fafc;
  color: #1e293b;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.app-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #3b82f6;
}

.nav-toggle-btn {
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #64748b;
}

.nav-toggle-btn.active {
  background: #3b82f6;
  color: white;
}

.main-content {
  flex: 1;
  padding: 1.5rem;
}

.bottom-nav {
  background: white;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-around;
  padding: 0.75rem 0;
  position: sticky;
  bottom: 0;
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #64748b;
}

.bottom-nav-item.active {
  color: #3b82f6;
}

.bottom-nav-item i {
  font-size: 1.25rem;
}

.bottom-nav-item span {
  font-size: 0.75rem;
  font-weight: 500;
}
</style>
