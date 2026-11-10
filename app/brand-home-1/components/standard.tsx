import s from "./standard.module.css";
import ui from "./ui.module.css";

const POINTS = [
  {
    title: "A conversation first",
    body: "Your specialist asks what you would like, what you have tried and how much time you have today.",
  },
  {
    title: "The price before the chair",
    body: "Every service shows its duration and its price, with GST noted, before you book.",
  },
  {
    title: "Your hour, held",
    body: "Times come live from each house, and you settle the bill there, after your visit.",
  },
] as const;

const REVEALS = [ui.reveal, ui.reveal2, ui.reveal3];

/**
 * The standard all four houses keep: one statement that lights up word by word as it
 * scrolls through (motion.tsx; it reads fully lit without script), then three short points.
 */
export function Standard() {
  return (
    <section id="standard" className={`${ui.section} ${ui.band} ${s.root}`} aria-labelledby="standard-title">
      <div className={ui.container}>
        <h2 id="standard-title" className={ui.srOnly}>
          The Maison Élan standard
        </h2>
        <p className={s.statement} data-mx-words="">
          We listen before we begin, show every price before you book, and keep <em>your hour</em> for you alone.
        </p>
        <ol className={s.points}>
          {POINTS.map((point, index) => (
            <li key={point.title} className={`${s.point} ${REVEALS[index]}`}>
              <span className={`${s.numeral} ${ui.num}`} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className={s.title}>{point.title}</h3>
              <p className={s.body}>{point.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
