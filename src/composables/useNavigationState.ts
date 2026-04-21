import { ref } from 'vue';

// Global state for navigation context
const navigationState = ref({
  showActionButtons: true,
});

export function useNavigationState() {
  const setShowActionButtons = (show: boolean) => {
    navigationState.value.showActionButtons = show;
  };

  const getShowActionButtons = () => {
    return navigationState.value.showActionButtons;
  };

  const resetNavigationState = () => {
    navigationState.value.showActionButtons = true;
  };

  return {
    navigationState,
    setShowActionButtons,
    getShowActionButtons,
    resetNavigationState,
  };
}
