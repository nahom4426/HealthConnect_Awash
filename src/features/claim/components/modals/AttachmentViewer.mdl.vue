<template>
  <div class="overflow-y-auto fixed inset-0 z-50">
    <div class="flex justify-center items-center p-4 min-h-screen">
      <!-- Overlay -->
      <div class="fixed inset-0 bg-black/50" @click="closeModal()"></div>
      
      <!-- Modal -->
      <div class="overflow-hidden relative z-10 w-full max-w-4xl bg-white rounded-xl shadow-2xl">
        <!-- Header -->
        <div class="flex justify-between items-center p-4 border-b">
          <div class="flex gap-4 items-center">
            <h3 class="text-lg font-semibold text-gray-900">{{ modalTitle }}</h3>
            <span v-if="attachments.length > 1" class="text-sm text-gray-500">
              {{ currentIndex + 1 }} of {{ attachments.length }}
            </span>
          </div>
          <div class="flex gap-2 items-center">
            <button 
              v-if="attachments.length > 1"
              @click="prevAttachment" 
              :disabled="currentIndex === 0"
              class="p-1 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
              aria-label="Previous"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              v-if="attachments.length > 1"
              @click="nextAttachment"
              :disabled="currentIndex === attachments.length - 1"
              class="p-1 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
              aria-label="Next"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button 
              @click="closeModal()" 
              class="p-1 text-gray-400 transition-colors hover:text-gray-600"
              aria-label="Close"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Loading State -->
        <div v-if="isLoading" class="flex flex-col justify-center items-center p-8 h-96">
          <div class="mb-4 w-12 h-12 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div>
          <p class="text-gray-600">Loading attachment...</p>
        </div>
        
        <!-- Error State -->
        <div v-else-if="error" class="flex flex-col justify-center items-center p-8 h-96 text-center">
          <div class="p-4 mb-4 bg-red-50 rounded-full">
            <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h4 class="mb-2 text-lg font-medium text-gray-900">Unable to load attachment</h4>
          <p class="mb-6 text-gray-600">{{ error }}</p>
          <button 
            @click="closeModal()" 
            class="px-4 py-2 text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700"
          >
            Close
          </button>
        </div>
        
        <!-- Content -->
        <div v-else class="flex flex-col h-[80vh]">
          <!-- Image Viewer -->
          <div class="flex overflow-auto flex-1 justify-center items-center p-4 bg-gray-100">
            <img 
              v-if="currentAttachment && canPreviewImage(currentAttachment)" 
              :src="getImageSource(currentAttachment)" 
              :alt="`Attachment ${currentIndex + 1}`" 
              class="max-w-full max-h-[70vh] object-contain"
              @load="handleImageLoad"
              @error="handleImageError"
            />
            
            <!-- PDF Viewer -->
            <iframe 
              v-else-if="currentAttachment && isPdf(currentAttachment)" 
              :src="getImageSource(currentAttachment)" 
              class="w-full h-[70vh] border-0"
              @load="handleImageLoad"
              @error="handleImageError"
            ></iframe>
            
            <!-- Unsupported file type -->
            <div v-else class="p-8 text-center">
              <div class="inline-block p-4 mb-4 bg-gray-100 rounded-full">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 class="text-lg font-medium text-gray-900">Unsupported File Type</h4>
              <p class="mb-6 text-gray-600">This file type cannot be previewed.</p>
              <button 
                @click="downloadCurrentAttachment" 
                class="px-4 py-2 text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700"
              >
                Download File
              </button>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="flex justify-between items-center p-4 border-t">
            <div class="text-sm text-gray-500">
              {{ getFileName(currentAttachment) }}
            </div>
            <div class="flex gap-2">
              <button 
                @click="downloadCurrentAttachment" 
                class="flex gap-2 items-center px-3 py-1.5 text-sm text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { closeModal } from '@customizer/modal-x';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});

// Debug logging
console.log('Props data:', props.data);
console.log('Data attachments:', props.data?.attachments);
console.log('First attachment data:', props.data?.attachments?.[0]);
console.log('First attachment base64 preview:', props.data?.attachments?.[0]?.attachment?.substring(0, 100) + '...');

// Get modal title
const modalTitle = computed(() => {
  return props.data?.title || 'Attachment Viewer';
});

// Get attachments from data object
const attachments = computed(() => {
  if (props.data && props.data.attachments) {
    return Array.isArray(props.data.attachments) ? props.data.attachments : [props.data.attachments];
  }
  return [];
});

const currentIndex = ref(0);
const isLoading = ref(true);
const error = ref(null);

const currentAttachment = computed(() => {
  return attachments.value[currentIndex.value] || null;
});

// Check if we can preview this as an image
const canPreviewImage = (attachment) => {
  if (!attachment) return false;
  
  // Check if it has base64 data that starts with image signature
  if (attachment.attachment && typeof attachment.attachment === 'string') {
    const base64Str = attachment.attachment.trim();
    // PNG starts with iVBOR, JPEG starts with /9j/, GIF starts with R0lGOD
    return base64Str.startsWith('iVBOR') || 
           base64Str.startsWith('/9j/') || 
           base64Str.startsWith('R0lGOD') ||
           base64Str.startsWith('data:image/');
  }
  
  // Check file extension from attachmentName
  if (attachment.attachmentName) {
    const name = attachment.attachmentName.toLowerCase();
    return name.endsWith('.png') || 
           name.endsWith('.jpg') || 
           name.endsWith('.jpeg') || 
           name.endsWith('.gif') || 
           name.endsWith('.webp') || 
           name.endsWith('.bmp') || 
           name.endsWith('.svg');
  }
  
  return false;
};

// Check if attachment is PDF
const isPdf = (attachment) => {
  if (!attachment) return false;
  
  // Check base64 string for PDF signature
  if (attachment.attachment && typeof attachment.attachment === 'string') {
    const str = attachment.attachment.trim();
    return str.startsWith('JVBER') || str.startsWith('%PDF') || str.startsWith('data:application/pdf');
  }
  
  // Check attachment name for .pdf extension
  if (attachment.attachmentName) {
    const name = attachment.attachmentName.toLowerCase();
    return name.endsWith('.pdf');
  }
  
  return false;
};

// Get file name
const getFileName = (attachment) => {
  if (!attachment) return '';
  
  // Use attachmentName if available
  if (attachment.attachmentName) {
    return attachment.attachmentName;
  }
  
  return 'attachment';
};

// Get image source URL - ALWAYS use base64 data, not filePath
const getImageSource = (attachment) => {
  if (!attachment) return '';
  
  console.log('Processing attachment:', attachment);
  
  // Always use the base64 data from attachment property
  if (attachment.attachment && typeof attachment.attachment === 'string') {
    const base64Str = attachment.attachment.trim();
    console.log('Base64 string length:', base64Str.length);
    console.log('Base64 preview (first 100 chars):', base64Str.substring(0, 100));
    
    if (!base64Str || base64Str === 'undefined' || base64Str === 'null') {
      console.error('Empty or invalid base64 string');
      return '';
    }
    
    // If it already has data: prefix, return as is
    if (base64Str.startsWith('data:')) {
      console.log('Already a data URL');
      return base64Str;
    }
    
    // Determine MIME type based on base64 signature or file extension
    let mimeType = 'application/octet-stream';
    
    // Check base64 signatures
    if (base64Str.startsWith('iVBOR')) {
      mimeType = 'image/png';
      console.log('Detected PNG from base64 signature');
    } else if (base64Str.startsWith('/9j/')) {
      mimeType = 'image/jpeg';
      console.log('Detected JPEG from base64 signature');
    } else if (base64Str.startsWith('R0lGOD') || base64Str.startsWith('GIF8')) {
      mimeType = 'image/gif';
      console.log('Detected GIF from base64 signature');
    } else if (base64Str.startsWith('JVBER') || base64Str.startsWith('%PDF')) {
      mimeType = 'application/pdf';
      console.log('Detected PDF from base64 signature');
    } else if (base64Str.startsWith('UEs')) {
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      console.log('Detected DOCX from base64 signature');
    } else if (base64Str.startsWith('0M8R')) {
      mimeType = 'application/vnd.ms-excel';
      console.log('Detected XLS from base64 signature');
    } else {
      // Fallback: check file extension
      if (attachment.attachmentName) {
        const ext = attachment.attachmentName.toLowerCase().split('.').pop();
        switch (ext) {
          case 'png':
            mimeType = 'image/png';
            console.log('Detected PNG from file extension');
            break;
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg';
            console.log('Detected JPEG from file extension');
            break;
          case 'gif':
            mimeType = 'image/gif';
            console.log('Detected GIF from file extension');
            break;
          case 'pdf':
            mimeType = 'application/pdf';
            console.log('Detected PDF from file extension');
            break;
          case 'webp':
            mimeType = 'image/webp';
            console.log('Detected WebP from file extension');
            break;
          case 'bmp':
            mimeType = 'image/bmp';
            console.log('Detected BMP from file extension');
            break;
          case 'svg':
            mimeType = 'image/svg+xml';
            console.log('Detected SVG from file extension');
            break;
          default:
            console.log('Unknown file extension:', ext, 'using octet-stream');
        }
      }
    }
    
    // Create data URL
    try {
      const dataUrl = `data:${mimeType};base64,${base64Str}`;
      console.log('Created data URL with mime type:', mimeType);
      console.log('Data URL preview (first 150 chars):', dataUrl.substring(0, 150) + '...');
      return dataUrl;
    } catch (err) {
      console.error('Error creating data URL:', err);
      return '';
    }
  }
  
  console.error('No attachment data found');
  return '';
};

// Download attachment
const downloadAttachment = (attachment) => {
  try {
    const fileName = getFileName(attachment);
    const source = getImageSource(attachment);
    
    if (!source) {
      error.value = 'No attachment data available to download';
      return;
    }
    
    const link = document.createElement('a');
    link.href = source;
    link.download = fileName;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Download failed:', err);
    error.value = 'Failed to download attachment. Please try again.';
  }
};

const downloadCurrentAttachment = () => {
  if (currentAttachment.value) {
    downloadAttachment(currentAttachment.value);
  }
};

const prevAttachment = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    loadCurrentAttachment();
  }
};

const nextAttachment = () => {
  if (currentIndex.value < attachments.value.length - 1) {
    currentIndex.value++;
    loadCurrentAttachment();
  }
};

const handleImageLoad = () => {
  console.log('Image loaded successfully');
  isLoading.value = false;
  error.value = null;
};

const handleImageError = (e) => {
  console.error('Image load error:', e);
  console.error('Current attachment:', currentAttachment.value);
  console.error('Image source:', getImageSource(currentAttachment.value));
  
  // Try to validate the base64 data
  if (currentAttachment.value?.attachment) {
    const base64Str = currentAttachment.value.attachment.trim();
    console.error('Base64 string length:', base64Str.length);
    console.error('Base64 validation:', validateBase64(base64Str));
  }
  
  error.value = 'Failed to load attachment. The file may be corrupted or in an unsupported format.';
  isLoading.value = false;
};

// Helper function to validate base64
const validateBase64 = (str) => {
  if (!str) return 'Empty string';
  if (str.length % 4 !== 0) return `Invalid length: ${str.length} (not divisible by 4)`;
  try {
    // Try to decode it
    const binary = atob(str);
    return `Valid base64, decoded length: ${binary.length}`;
  } catch (e) {
    return `Invalid base64: ${e.message}`;
  }
};

const loadCurrentAttachment = () => {
  if (!currentAttachment.value) {
    error.value = 'No attachment available';
    isLoading.value = false;
    return;
  }
  
  console.log('=== Loading Attachment ===');
  console.log('Attachment object:', currentAttachment.value);
  console.log('Attachment name:', currentAttachment.value.attachmentName);
  console.log('Has attachment property:', !!currentAttachment.value.attachment);
  console.log('Attachment property type:', typeof currentAttachment.value.attachment);
  
  if (currentAttachment.value.attachment) {
    const base64Str = currentAttachment.value.attachment.trim();
    console.log('Base64 string length:', base64Str.length);
    console.log('Base64 first 50 chars:', base64Str.substring(0, 50));
    console.log('Base64 last 50 chars:', base64Str.substring(base64Str.length - 50));
    console.log('Base64 validation:', validateBase64(base64Str));
  }
  
  console.log('Can preview as image?', canPreviewImage(currentAttachment.value));
  console.log('Is PDF?', isPdf(currentAttachment.value));
  console.log('Image source:', getImageSource(currentAttachment.value));
  
  isLoading.value = true;
  error.value = null;
  
  // Give it a moment to load
  setTimeout(() => {
    if (isLoading.value) {
      console.log('Loading timeout reached');
      const source = getImageSource(currentAttachment.value);
      if (!source) {
        error.value = 'No valid source found for attachment';
      }
      isLoading.value = false;
    }
  }, 3000); // Increased timeout for debugging
};

onMounted(() => {
  console.log('=== Component Mounted ===');
  console.log('Attachments count:', attachments.value.length);
  console.log('All attachments:', attachments.value);
  
  if (attachments.value.length === 0) {
    error.value = 'No attachments provided';
    isLoading.value = false;
  } else {
    loadCurrentAttachment();
  }
});
</script>

<style scoped>
/* Add any custom styles here */
</style>