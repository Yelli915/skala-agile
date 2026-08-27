<template>
  <svg
    class="net-bg"
    :viewBox="`0 0 ${W} ${H}`"
    preserveAspectRatio="xMidYMid slice"
    fill="none"
    role="img"
    aria-label="전국 지자체를 잇는 공동물류 네트워크를 형상화한 배경 일러스트"
  >
    <defs>
      <radialGradient id="nb-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#5aa0ff" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#5aa0ff" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="nb-node" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#e6f0ff" stop-opacity="0.95" />
        <stop offset="45%" stop-color="#93c0ff" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#5a92e8" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="nb-gold" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffe6a8" stop-opacity="0.95" />
        <stop offset="50%" stop-color="#ffca5c" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#ffca5c" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- 중앙부 은은한 발광 -->
    <ellipse :cx="W * 0.62" :cy="H * 0.58" :rx="W * 0.5" :ry="H * 0.42" fill="url(#nb-glow)" />

    <!-- 하단 원근 지도 타일 -->
    <g class="nb-tiles">
      <polygon
        v-for="(t, i) in tiles"
        :key="i"
        :points="t"
      />
    </g>

    <!-- 네트워크 연결선 -->
    <g class="nb-links">
      <line
        v-for="(e, i) in edges"
        :key="i"
        :x1="nodes[e[0]].x" :y1="nodes[e[0]].y"
        :x2="nodes[e[1]].x" :y2="nodes[e[1]].y"
      />
    </g>

    <!-- 노드 -->
    <g class="nb-nodes">
      <g v-for="(n, i) in nodes" :key="i" :transform="`translate(${n.x} ${n.y})`">
        <circle v-if="n.halo" :r="n.halo" fill="url(#nb-node)" />
        <circle class="nb-core" :r="n.r" />
      </g>
    </g>

    <!-- 위치 핀 -->
    <g class="nb-pins">
      <g
        v-for="(p, i) in pins"
        :key="i"
        :transform="`translate(${p.x} ${p.y}) scale(${p.s})`"
        :class="{ dim: p.dim }"
      >
        <ellipse class="nb-pin-shadow" cx="0" cy="15" rx="9" ry="3" />
        <circle v-if="!p.dim" class="nb-pin-pulse" cx="0" cy="15" r="6" :style="{ animationDelay: `${i * 0.8}s` }" />
        <circle :r="26" :fill="p.gold ? 'url(#nb-gold)' : 'url(#nb-node)'" cx="0" cy="-6" />
        <path
          class="nb-pin-body"
          :class="{ gold: p.gold }"
          d="M0 -20 C-8 -20 -13 -13 -13 -6 C-13 3 0 16 0 16 C0 16 13 3 13 -6 C13 -13 8 -20 0 -20 Z"
        />
        <circle class="nb-pin-hole" cx="0" cy="-7" r="4.2" />
      </g>
    </g>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

/**
 * 로그인 화면 좌측 브랜딩 패널의 전체 배경 일러스트.
 * 전국 지자체를 잇는 공동물류 네트워크 — 원근감 있는 노드 메시 + 지도 타일 + 위치 핀.
 * 텍스트(좌상단)는 위에 얹히므로 좌상단은 성기게, 우/하단으로 갈수록 촘촘하게 배치한다.
 * 전부 SVG 도형 — 외부 이미지 자산 없음.
 */
const W = 600
const H = 760

// 좌상단 성김 → 우·하단 촘촘함. r/halo 로 밝기·크기 변주.
const rawNodes = [
  [70, 90], [190, 58], [300, 120], [432, 70], [524, 150], [578, 64],
  [40, 236], [150, 214], [252, 282], [360, 228], [452, 300], [540, 258], [592, 344],
  [92, 380], [204, 356], [300, 420], [382, 378], [470, 440], [560, 418], [430, 520],
  [50, 520], [150, 560], [262, 540], [342, 602], [452, 580], [542, 558], [592, 626],
  [82, 660], [182, 700], [280, 658], [372, 722], [462, 678], [560, 700], [600, 648],
  [122, 742], [332, 758],
]

const nodes = computed(() =>
  rawNodes.map(([x, y], i) => {
    const big = i % 5 === 0
    return {
      x, y,
      r: big ? 2.8 : 1.6 + (i % 3) * 0.3,
      halo: big ? 12 + (i % 3) * 4 : 0,
    }
  })
)

// 근접 노드끼리 연결 (삼각망 느낌), 노드당 최대 4개.
const edges = computed(() => {
  const ns = rawNodes
  const out = []
  const deg = new Array(ns.length).fill(0)
  const pairs = []
  for (let i = 0; i < ns.length; i++) {
    for (let j = i + 1; j < ns.length; j++) {
      const dx = ns[i][0] - ns[j][0]
      const dy = ns[i][1] - ns[j][1]
      const d = Math.hypot(dx, dy)
      if (d < 165) pairs.push([d, i, j])
    }
  }
  pairs.sort((a, b) => a[0] - b[0])
  for (const [, i, j] of pairs) {
    if (deg[i] >= 4 || deg[j] >= 4) continue
    out.push([i, j])
    deg[i]++
    deg[j]++
  }
  return out
})

// 하단 원근 지도 타일 (평행사변형).
const tiles = [
  '20,690 150,660 190,720 55,754',
  '150,660 270,636 320,690 190,720',
  '430,700 560,668 610,724 480,758',
  '540,636 640,612 690,660 590,686',
  '300,730 410,706 452,760 340,772',
]

// 위치 핀 — gold(강조) / 일반 / dim(흐림).
const pins = [
  { x: 512, y: 150, s: 1.05, gold: true },
  { x: 62, y: 578, s: 1.1, gold: true },
  { x: 374, y: 456, s: 0.95 },
  { x: 470, y: 250, s: 0.72, dim: true },
  { x: 300, y: 132, s: 0.6, dim: true },
  { x: 470, y: 688, s: 0.72, dim: true },
  { x: 184, y: 692, s: 0.66, dim: true },
]
</script>

<style scoped>
.net-bg {
  width: 100%;
  height: 100%;
  display: block;
}

.nb-tiles polygon {
  fill: rgba(255, 255, 255, 0.055);
  stroke: rgba(180, 210, 255, 0.2);
  stroke-width: 1;
}

.nb-links line {
  stroke: rgba(160, 198, 255, 0.1);
  stroke-width: 1;
}

.nb-core {
  fill: rgba(224, 236, 255, 0.8);
}

/* 위치 핀 */
.nb-pins .dim {
  opacity: 0.3;
}
.nb-pin-shadow {
  fill: rgba(150, 195, 255, 0.22);
}
.nb-pin-body {
  fill: rgba(223, 236, 255, 0.72);
  stroke: rgba(255, 255, 255, 0.45);
  stroke-width: 1;
}
.nb-pin-body.gold {
  fill: rgba(255, 208, 110, 0.82);
  stroke: rgba(255, 245, 214, 0.6);
}
.nb-pin-hole {
  fill: #12448a;
}
.nb-pin-pulse {
  fill: none;
  stroke: rgba(210, 230, 255, 0.7);
  stroke-width: 1.4;
  transform-box: fill-box;
  transform-origin: center;
  animation: nb-pulse 3.4s ease-out infinite;
}

@keyframes nb-pulse {
  0%   { transform: scale(0.5); opacity: 0.85; }
  70%  { transform: scale(2.6); opacity: 0; }
  100% { transform: scale(2.6); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .nb-pin-pulse { animation: none; opacity: 0; }
}
</style>
