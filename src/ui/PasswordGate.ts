import { assetUrl } from "../utils/assets";
import { hasRememberedAccess, isAccessPhraseCorrect, rememberAccess } from "../utils/access";

export class PasswordGate {
  private readonly host: HTMLElement;
  private readonly onUnlock: () => void;

  public constructor(host: HTMLElement, onUnlock: () => void) {
    this.host = host;
    this.onUnlock = onUnlock;
  }

  public show(): void {
    if (hasRememberedAccess()) {
      this.onUnlock();
      return;
    }
    this.host.innerHTML = `
      <main class="gate-screen">
        <div class="gate-orbit gate-orbit-one"></div>
        <div class="gate-orbit gate-orbit-two"></div>
        <section class="gate-card" aria-labelledby="gate-title">
          <div class="gate-stamp" aria-hidden="true"><span>✦</span><span>for you</span></div>
          <img id="gate-title" class="gate-logo" src="${assetUrl("logo.svg")}" alt="My Little World" />
          <p class="gate-subtitle">A little place made just for you.</p>
          <form class="gate-form">
            <label class="sr-only" for="access-phrase">Password</label>
            <input id="access-phrase" name="access-phrase" type="password" autocomplete="current-password" placeholder="A secret little word" required />
            <label class="remember-row"><input id="remember-device" type="checkbox" checked /><span class="check-mark" aria-hidden="true"></span><span>Remember this device</span></label>
            <button class="primary-button gate-submit" type="submit">Enter <span aria-hidden="true">→</span></button>
            <p class="gate-error" aria-live="polite"></p>
          </form>
          <p class="gate-footnote">A quiet corner for making things.</p>
        </section>
      </main>
    `;
    const form = this.host.querySelector<HTMLFormElement>(".gate-form");
    const input = this.host.querySelector<HTMLInputElement>("#access-phrase");
    const remember = this.host.querySelector<HTMLInputElement>("#remember-device");
    const error = this.host.querySelector<HTMLElement>(".gate-error");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!input || !error || !remember) {
        return;
      }
      const submit = this.host.querySelector<HTMLButtonElement>(".gate-submit");
      if (submit) {
        submit.disabled = true;
        submit.classList.add("is-busy");
      }
      const correct = await isAccessPhraseCorrect(input.value);
      if (correct) {
        rememberAccess(remember.checked);
        this.onUnlock();
        return;
      }
      error.textContent = "That little door did not recognise the word.";
      input.select();
      input.classList.add("input-shake");
      window.setTimeout(() => input.classList.remove("input-shake"), 420);
      if (submit) {
        submit.disabled = false;
        submit.classList.remove("is-busy");
      }
    });
    input?.focus();
  }
}
