import "./styles.css";
import { GameApp } from "./ui/GameApp";
import { PasswordGate } from "./ui/PasswordGate";

const appHost = document.querySelector<HTMLElement>("#app");

if (!appHost) {
  throw new Error("My Little World could not find its app host.");
}

const launchGame = (): void => {
  new GameApp(appHost);
};

new PasswordGate(appHost, launchGame).show();
