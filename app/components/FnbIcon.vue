<template lang="pug">
i.fnb-icon(aria-hidden='true')
  slot
</template>

<style lang="scss">
.fnb-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-style: normal;
  width: 1em;
  height: 1em;
  color: inherit;

  > svg,
  > img {
    width: 1em;
    height: 1em;
    color: inherit;
    fill: currentColor;
    stroke: currentColor;
  }

  // tabler icons use stroke, not fill
  > .tabler-icon {
    fill: none;
  }
}
</style>
