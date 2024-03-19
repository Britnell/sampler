<script setup lang="ts"></script>
<template>
  <details class="my-4">
    <summary>
      <h2 class="inline text-xl font-bold">find music</h2>
    </summary>
    <ul class="list-disc ml-6">
      <li>
        Play rhythm roulette & get a random song from the LOC records :
        <a
          href="/api/random"
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Random
        </a>
      </li>
      <li>
        Dig in the Archive's
        <a
          href="https://archive.org/details/78rpm"
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          78 RPMs collection
        </a>
      </li>
      <li>
        here are some
        <a
          href="https://rhythm-lab.com/breakbeats/"
          class="underline"
          target="_blank"
          rel="noopener noreferrer"
          >drumbreaks</a
        >&nbsp; to get you started
      </li>
    </ul>
  </details>
</template>
