import layout from "../layout.module.css";
import { RitualBrowser } from "./ritual-browser";
import ui from "./ui.module.css";
import { WholeMenu } from "./whole-menu";

/*
 * "Choose how you wish to feel." The four Serein states, each made of named
 * live services at a real place (the ritual browser), then "05 · The whole
 * menu": every live service at any of the four places. The head is server
 * rendered; the browser and the menu are client islands. The menu island is
 * only its disclosure header: its body loads on the first open (whole-menu.tsx).
 *
 * The h2 carries data-jump-focus so a jump to #rituals focuses the heading,
 * not the first ritual row's button (jumpTo takes the first match in order).
 */
export function Rituals() {
  return (
    <section id="rituals" className={`${layout.section} ${layout.frame}`} data-tone="paper-soft" aria-labelledby="rituals-title">
      <div className={`${layout.head} ${layout.reveal}`}>
        <div className={layout.headMain}>
          <p className={ui.label}>The ritual menu</p>
          <h2 id="rituals-title" className={ui.displayL} tabIndex={-1} data-jump-focus="">
            <span className={ui.line}>Choose how you</span> <span className={ui.line}>wish to <em>feel.</em></span>
          </h2>
        </div>
        <p className={layout.headNote}>Not a list of services. A collection of states you can return to.</p>
      </div>
      <RitualBrowser />
      <WholeMenu />
    </section>
  );
}
