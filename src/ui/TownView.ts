import { GAME_CONFIG } from "../config/gameConfig";
import { FUTURE_BUILDINGS } from "../data/buildingData";
import type { SaveGame } from "../types/game";
import { assetUrl } from "../utils/assets";
import { buildingIcon } from "./buildingIcons";

export type TownViewHandlers = {
  onEnterStudio: () => void;
  onResetSave: () => void;
};

export function renderTownView(host: HTMLElement, save: SaveGame, handlers: TownViewHandlers): void {
  const restored = save.buildings.drawingStudioStage === 1;
  const nextCoins = save.studioLevel === 1 ? GAME_CONFIG.progression.levelTwoCoins : GAME_CONFIG.progression.levelThreeCoins;
  host.innerHTML = `
    <main class="town-screen">
      <header class="topbar town-topbar">
        <div class="topbar-brand"><span class="brand-dot"></span><span>MY LITTLE WORLD</span></div>
        <div class="topbar-actions">
          <div class="coin-pill" aria-label="${save.coins} coins"><img src="${assetUrl("coin.svg")}" alt="" /><strong>${save.coins}</strong></div>
          <button class="icon-button reset-button" type="button" aria-label="Reset save" title="Reset save">↺</button>
        </div>
      </header>
      <section class="town-hero" aria-labelledby="town-title">
        <img class="town-backdrop" src="${assetUrl("town.svg")}" alt="A little town in a sunny valley" />
        <div class="town-heading">
          <p class="eyebrow">A small beginning</p>
          <h1 id="town-title">Your little world</h1>
          <p>There is always something waiting to be made.</p>
          <div class="village-progress"><strong>Village level ${save.studioLevel}</strong><span>${save.studioLevel === 3 ? "The little world is glowing." : `${Math.min(save.lifetimeCoins, nextCoins)} / ${nextCoins} lifetime coins`}</span></div>
        </div>
        <div class="studio-town-card ${restored ? "is-restored" : ""}">
          <div class="building-status"><span class="status-dot"></span> OPEN</div>
          <img src="${assetUrl(restored ? "studio-restored.svg" : "studio-ruined.svg")}" alt="${restored ? "The restored Drawing Studio" : "The neglected Drawing Studio"}" />
          <div class="studio-town-copy">
            <div><p class="eyebrow">The only open door</p><h2>The Drawing Studio</h2><p>${restored ? "The windows are bright again." : "A little dusty, but full of possibility."}</p></div>
            <button class="primary-button enter-studio" type="button">${restored ? "Make something" : "Step inside"} <span aria-hidden="true">→</span></button>
          </div>
        </div>
        <div class="mystery-building" aria-label="A boarded-up building marked with a moon and question marks">
          <div class="mystery-moon">☾</div><div class="mystery-board"></div><span>???</span>
        </div>
      </section>
      <section class="village-growth stage-${save.studioLevel}"><span>✦</span><div><p class="eyebrow">Village growth</p><h2>${save.studioLevel === 1 ? "A quiet beginning" : save.studioLevel === 2 ? "The paper garden is blooming" : "The gallery lane is alive"}</h2><p>${save.studioLevel === 1 ? "Deliver requests to invite more colour into town." : save.studioLevel === 2 ? "New cut-paper bunting and gardens have appeared." : "Prints, lanterns and a little gallery now brighten the lane."}</p></div></section>
      <section class="future-section" aria-labelledby="future-title">
        <div class="section-heading"><div><p class="eyebrow">The town is growing</p><h2 id="future-title">More little places</h2></div><span class="town-map-mark">01</span></div>
        <div class="future-grid">${FUTURE_BUILDINGS.map((building) => renderBuildingTease(building)).join("")}</div>
      </section>
      <p class="town-footer-note">The best things start small.</p>
    </main>
  `;
  host.querySelector<HTMLButtonElement>(".enter-studio")?.addEventListener("click", handlers.onEnterStudio);
  host.querySelector<HTMLButtonElement>(".reset-button")?.addEventListener("click", handlers.onResetSave);
}

function renderBuildingTease(building: (typeof FUTURE_BUILDINGS)[number]): string {
  const coming = building.status === "coming";
  return `
    <article class="future-card ${coming ? "is-coming" : "is-locked"}">
      <div class="future-icon ${coming ? "" : "muted"}">${buildingIcon(building.icon)}</div>
      <div class="future-copy"><h3>${building.name}</h3><p>${building.detail}</p></div>
      ${coming ? "" : `<img class="future-lock" src="${assetUrl("lock.svg")}" alt="" />`}
    </article>
  `;
}
