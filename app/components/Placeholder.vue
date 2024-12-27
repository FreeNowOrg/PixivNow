<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    version="1.1"
    class="svgspinner"
    width="400"
    height="300"
  >
    <g class="spingroup" transform="matrix(1,0,0,1,200,150)">
      <circle
        class="spincircle"
        r="36"
        stroke-width="5"
        stroke="#3697e7"
        fill="none"
        stroke-linecap="round"
      />
    </g>
  </svg>
</template>

<style scoped lang="sass">

.svgspinner
  max-width: 100%

.svgspinner .spincircle
  animation: loading-round 1.2s infinite linear, loading-dash 2s infinite linear alternate
  stroke-dasharray: 236

@keyframes loading-round
  0%
    transform: rotate(0deg)

  100%
    transform: rotate(720deg)

@keyframes loading-dash
  0%
    stroke-dashoffset: 236

  100%
    stroke-dashoffset: 0
</style>
