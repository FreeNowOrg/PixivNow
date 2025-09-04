<template lang="pug">
section.responsive
  NH1 ZipDownloader

  NFlex(direction='column')
    NInputGroup
      NInput(v-model:value='urlInput')
      NButton(@click='getCentralDirectory' type='primary') Fetch Information
    NInputGroup
      NInputNumber(
        :max='10 * 1024 * 1024',
        :min='1024',
        :step='1024'
        v-model:value='chunkSize'
      )
        template(#prefix) Chunk Size:
        template(#suffix) B

  NUl
    NLi
      strong Current URL:&nbsp;
      span {{ currentUrl }}
    NLi
      strong ZIP File Size:&nbsp;
      span {{ formatFileSize(data?.contentLength || 0) }}
    NLi
      strong Central Directory Size:&nbsp;
      span {{ formatFileSize(data?.centralDirectorySize || 0) }}
    NLi
      strong Download Chunk Size:&nbsp;
      span {{ formatFileSize(chunkSize) }}

  NDataTable(:columns='columns', :data='entries || []', :scroll-x='1200')

  details
    pre {{ data }}
</template>

<script setup lang="ts">
import {
  NH1,
  NInputGroup,
  NP,
  NDataTable,
  NInputNumber,
  NIcon,
  NButton,
} from 'naive-ui'
import {
  ZipDownloader,
  type ZipOverview,
  type ZipEntry,
} from '@/utils/ZipDownloader'
import { IconDownload } from '@tabler/icons-vue'
import { type TableColumn } from 'naive-ui/es/data-table/src/interface'

const downloader = new ZipDownloader('')

const data = ref<ZipOverview>()
const entries = computed(() => data.value?.entries)

const columns = ref<TableColumn<ZipEntry>[]>([
  {
    title: '',
    key: 'actions',
    width: 60,
    render: (row) => {
      return h(
        NButton,
        {
          circle: true,
          size: 'small',
          type: 'primary',
          onClick: () => downloadByIndex(row.index),
        },
        {
          icon: () => h(NIcon, null, { default: () => h(IconDownload) }),
        }
      )
    },
  },
  {
    title: '#',
    key: 'index',
    render: (row) => h('div', { style: { whiteSpace: 'nowrap' } }, row.index),
  },
  {
    title: 'File Name',
    key: 'fileName',
    width: 200,
  },
  {
    title: 'MIME Type',
    key: 'mimeType',
    width: 120,
    render: (row) => row.mimeType || 'unknown',
  },
  {
    title: 'Compressed Size',
    key: 'compressedSize',
    width: 120,
    render: (row) => formatFileSize(row.compressedSize),
  },
  {
    title: 'Uncompressed Size',
    key: 'uncompressedSize',
    width: 120,
    render: (row) => formatFileSize(row.uncompressedSize),
  },
  {
    title: 'CRC32',
    key: 'crc32',
    width: 100,
  },
  {
    title: 'Compression Method',
    key: 'compressionMethod',
    width: 120,
  },
  {
    title: 'General Purpose Bit Flag',
    key: 'generalPurposeBitFlag',
    width: 150,
  },
  {
    title: 'Local Header Offset',
    key: 'localHeaderOffset',
    width: 120,
  },
  {
    title: 'Central Header Offset',
    key: 'centralHeaderOffset',
    width: 120,
  },
  {
    title: 'Requires Zip64',
    key: 'requiresZip64',
    width: 100,
  },
])

const urlInput = ref(
  'https://i.pixiv.re/img-zip-ugoira/img/2024/10/16/12/50/03/123379890_ugoira600x600.zip'
)
const currentUrl = ref('')
const chunkSize = ref(512 * 1024)

watch(
  chunkSize,
  (newVal) => {
    downloader.setOptions({ chunkSize: newVal })
  },
  { immediate: true }
)

function setUrl(url: string) {
  currentUrl.value = url
  downloader.setUrl(url)
  if (currentUrl.value !== url) {
    data.value = undefined
  }
}

function getCentralDirectory() {
  setUrl(urlInput.value)
  downloader.getCentralDirectory().then((overview) => {
    data.value = overview
  })
}

function downloadByIndex(index: number) {
  setUrl(urlInput.value)
  downloader.downloadByIndex(index).then((result) => {
    const blob = new Blob([result.bytes as Uint8Array<ArrayBuffer>], {
      type: result.mimeType,
    })
    console.log('下载结果:', result, blob)

    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    URL.revokeObjectURL(url)
  })
}

const formatFileSize = (size: number) => {
  size = parseFloat(size as any)
  if (isNaN(size) || size < 0) {
    return '0.00 B'
  }
  let unit = 'B'
  while (size > 1024) {
    size /= 1024
    if (unit === 'B') unit = 'KB'
    else if (unit === 'KB') unit = 'MB'
    else if (unit === 'MB') unit = 'GB'
    else if (unit === 'GB') unit = 'TB'
    else break
  }
  return `${size.toFixed(2)} ${unit}`
}
</script>

<style scoped lang="sass"></style>
