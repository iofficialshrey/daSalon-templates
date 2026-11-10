import layout from "../layout.module.css";
import { Orb } from "./orb";
import styles from "./intro.module.css";
import ui from "./ui.module.css";

/*
 * Section 2: the breath after the film (spec §4.2). It names the brand's idea:
 * a dictionary entry for "serein", the h2 over a breath orb that exhales once
 * on view, and "Our approach" as a quiet note in its own grid row.
 */
export function Intro() {
  return (
    <section
      id="serein"
      className={`${layout.section} ${layout.frame} ${styles.intro}`}
      data-tone="paper"
      aria-labelledby="serein-title"
    >
      <div className={styles.column}>
        <Orb variant="breath" className={styles.orb} />
        <p className={styles.entry}>
          <span aria-hidden="true" className={styles.word}>
            se·rein
          </span>
          <span className={ui.srOnly}>serein</span>
          <span className={`${ui.small} ${ui.muted}`}> noun, from French</span>
        </p>
        <p className={`${ui.lead} ${ui.muted} ${styles.definition}`}>
          A fine rain that falls from a clear sky, just after sunset.
        </p>
        <h2 id="serein-title" className={`${ui.displayL} ${styles.title}`}>
          <span className={ui.line}>The quiet that arrives</span> <span className={ui.line}><em>after rain.</em></span>
        </h2>
        <p className={`${ui.lead} ${styles.lead}`}>
          We made a house where the body can soften. Treatments unfold slowly, touch is considered, and nothing asks
          you to hurry.
        </p>
      </div>
      <div className={styles.note}>
        <p className={ui.label}>Our approach</p>
        <p className={`${ui.body} ${styles.noteText}`}>Ancient bodywork. Modern skin intelligence. Time, protected.</p>
      </div>
    </section>
  );
}
