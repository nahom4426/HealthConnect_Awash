<script setup>
import { onMounted, ref, toRefs } from 'vue';
import { useClaimStore } from '@stores/claimStore';
import api from '@/scripts/api';
import { Icon } from '@iconify/vue';
import { v3ImgPreviewFn } from 'v3-img-preview';
import { useBlobToUrl } from '@/composables/useBlobToUrl';

const claimFromStore = useClaimStore();
const claim = claimFromStore.claimDetail;
const loading = ref(false);
const attachments = ref([]);

const props = defineProps({
  claimUuid: {
    type: String,
    default: '',
    required: true,
  },
});

const { claimUuid } = toRefs(props);

const imageUrl = ref('');

onMounted(async () => {
  await fetchAttachments(claimUuid.value);
});

const fetchAttachments = async (claimUuid) => {
  loading.value = true;
  await api.get(`/claimattachments/${claimUuid}`,
  ).then((data) => {
    loading.value = false;
    console.log('Attachments are ', data);
    attachments.value = data;
  });
};

const handlePreview = (imgUrl) => {
  console.log('@handle preview');
  imgUrl = returnUrl(imgUrl);
  console.log(imgUrl);
  v3ImgPreviewFn(imgUrl);
};

const returnUrl = async (attachmentId) => {
  loading.value = true;
  await api.get(`/claimattachments/open?claimAttachmentUuid=${attachmentId}`).then(async (data) => {
    const { url, createUrl, base64, createBase64 } = useBlobToUrl(data);
    createUrl();
    createBase64();

    await new Promise((resolve) => {
      const intervalId = setInterval(() => {
        if (base64.value !== '') {
          clearInterval(intervalId);
          resolve();
        }
      }, 100);
    });

    imageUrl.value = url.value;

    loading.value = false;
  });

  return imageUrl.value;
};
</script>

<template>
  <div v-if="attachments.length == 0">
    <div class="text-sm text-primary/50 bg">no attachments provided</div>
  </div>
  <ul role="list" v-if="attachments.length > 0"
    class="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
    <li v-for="attachment in attachments" :key="attachment.claimAttachmentUuid" class="relative">
      <div @click.stop="handlePreview(attachment.claimAttachmentUuid)"
        class="group aspect-h-7 aspect-w-10 block w-full overflow-hidden rounded-lg bg-gray-100 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-100">
        <img :src="returnUrl(attachment.claimAttachmentUuid)" alt=""
          class="pointer-events-none object-cover group-hover:opacity-75 h-36" />
        <button type="button" class="absolute inset-0 focus:outline-none">
          <span class="sr-only">View details for {{ attachment.fileName }}</span>
        </button>
      </div>
      <p class="pointer-events-none mt-2 block truncate text-sm font-medium text-gray-900">
        {{ attachment.fileName }}
      </p>
    </li>
  </ul>
</template>
