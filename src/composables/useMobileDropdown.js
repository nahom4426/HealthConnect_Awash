// ...new file...
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

/**
 * Enhanced Mobile Dropdown Composable
 * Provides modern, animated mobile dropdown functionality with smart positioning
 * @param {number} width - Dropdown width in pixels
 * @param {object} options - Configuration options
 */
export function useMobileDropdown(width = 208, options = {}) {
  const {
    offset = 8,
    animationDuration = 200,
    backdrop = true,
    closeOnScroll = false
  } = options;

  const activeId = ref(null);
  const activeRow = ref(null);
  const style = ref({});
  const buttonRef = ref(null);
  const isAnimating = ref(false);
  const isVisible = ref(false);

  /**
   * Smart positioning algorithm that avoids screen edges
   */
  function calculatePosition() {
    if (!buttonRef.value) return { left: 0, top: 0 };
    
    const rect = buttonRef.value.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    // Calculate optimal horizontal position
    let left = rect.right - width;
    if (left < offset) {
      left = rect.left; // Align to left edge if not enough space on right
    }
    if (left + width > viewport.width - offset) {
      left = viewport.width - width - offset; // Ensure it fits in viewport
    }
    
    // Calculate optimal vertical position
    let top = rect.bottom + offset;
    const dropdownHeight = 200; // Estimated dropdown height
    
    // If dropdown would go below viewport, show above button
    if (top + dropdownHeight > viewport.height - offset) {
      top = rect.top - dropdownHeight - offset;
      // If still doesn't fit, position at bottom of viewport
      if (top < offset) {
        top = viewport.height - dropdownHeight - offset;
      }
    }
    
    return { left: Math.max(offset, left), top: Math.max(offset, top) };
  }

  /**
   * Update dropdown position with smooth animation
   */
  async function update() {
    if (!activeId.value || !buttonRef.value) return;
    
    const position = calculatePosition();
    
    style.value = {
      position: 'fixed',
      left: `${position.left}px`,
      top: `${position.top}px`,
      zIndex: 99999,
      minWidth: `${width}px`,
      maxWidth: `${Math.min(width * 1.5, window.innerWidth - 32)}px`,
      transform: isVisible.value ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-10px)',
      opacity: isVisible.value ? '1' : '0',
      transition: `all ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      transformOrigin: 'top right',
      backdropFilter: backdrop ? 'blur(8px)' : 'none',
      WebkitBackdropFilter: backdrop ? 'blur(8px)' : 'none'
    };
  }

  /**
   * Toggle dropdown with smooth animation
   */
  async function toggle(event, id, row) {
    event.stopPropagation();
    
    // If same dropdown, close it
    if (activeId.value === id) {
      await close();
      return;
    }
    
    // Close any existing dropdown first
    if (activeId.value) {
      await close();
    }
    
    // Open new dropdown
    isAnimating.value = true;
    buttonRef.value = event.currentTarget || event.target;
    activeId.value = id;
    activeRow.value = row;
    
    // Initial position (hidden)
    isVisible.value = false;
    await update();
    
    // Animate in
    await nextTick();
    isVisible.value = true;
    await update();
    
    // Animation complete
    setTimeout(() => {
      isAnimating.value = false;
    }, animationDuration);
  }

  /**
   * Close dropdown with animation
   */
  async function close() {
    if (!activeId.value) return;
    
    isAnimating.value = true;
    isVisible.value = false;
    await update();
    
    // Wait for animation to complete
    setTimeout(() => {
      activeId.value = null;
      activeRow.value = null;
      buttonRef.value = null;
      isAnimating.value = false;
    }, animationDuration);
  }

  /**
   * Handle outside click
   */
  function handleOutsideClick(event) {
    if (!activeId.value) return;
    
    // Don't close if clicking on the dropdown itself
    const dropdown = document.querySelector('[data-mobile-dropdown="true"]');
    if (dropdown && dropdown.contains(event.target)) return;
    
    // Don't close if clicking on the button that opened it
    if (buttonRef.value && buttonRef.value.contains(event.target)) return;
    
    close();
  }

  /**
   * Handle scroll (optional close on scroll)
   */
  function handleScroll() {
    if (closeOnScroll) {
      close();
    } else {
      update();
    }
  }

  onMounted(() => {
    window.addEventListener('resize', update);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && activeId.value) {
        close();
      }
    });
  });

  onUnmounted(() => {
    window.removeEventListener('resize', update);
    window.removeEventListener('scroll', handleScroll, true);
    window.removeEventListener('click', handleOutsideClick);
  });

  return {
    activeId,
    activeRow,
    style,
    isVisible,
    isAnimating,
    toggle,
    close,
    update
  };
}
// ...new file...