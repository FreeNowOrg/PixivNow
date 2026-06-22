export interface SearchContentOption {
  label: string
  value: string
}

// Search content types — shared by the search page tabs and the header scope selector.
export const contentOptions: SearchContentOption[] = [
  { label: '综合', value: 'artworks' },
  { label: '插画', value: 'illustrations' },
  { label: '动图', value: 'ugoira' },
  { label: '漫画', value: 'manga' },
  { label: '小说', value: 'novels' },
]
