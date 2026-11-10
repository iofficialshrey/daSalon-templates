"use client";

import { useId, type FormEvent } from "react";
import type { GiftDraft } from "../data/gifts";
import styles from "./offer-sheet.module.css";
import ui from "./ui.module.css";

/*
 * Gift-card personalisation inside the offer sheet (adapted from Atelier's).
 * Controlled by the sheet, which draws the live card face. Every field is
 * optional and length-capped, so there is no error state. Nothing typed here is
 * sent, stored or logged; the draft goes when the sheet closes. No email,
 * phone, address or card fields.
 */

export const EMPTY_DRAFT: GiftDraft = { mode: "gift", recipient: "", message: "", from: "", self: "" };
export const NAME_MAX = 40;
export const MESSAGE_MAX = 160;

type GiftFormProps = {
  /** The footer's Buy button submits this form through `form={formId}`. */
  formId: string;
  draft: GiftDraft;
  onChange: (draft: GiftDraft) => void;
  onSubmit: () => void;
};

export function GiftForm({ formId, draft, onChange, onSubmit }: GiftFormProps) {
  const uid = useId();
  const ids = {
    recipient: `${uid}-recipient`,
    message: `${uid}-message`,
    counter: `${uid}-counter`,
    from: `${uid}-from`,
    self: `${uid}-self`,
  };

  const update = (patch: Partial<GiftDraft>) => onChange({ ...draft, ...patch });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  // Nothing typed here leaves the tab: no autofill history, no spellcheck service.
  const text = { autoComplete: "off", spellCheck: false, className: ui.input, type: "text" } as const;

  return (
    <form id={formId} className={styles.form} noValidate autoComplete="off" onSubmit={submit}>
      <fieldset className={styles.fieldset}>
        <legend className={`${ui.label} ${styles.legend}`}>Who is it for?</legend>
        <div className={styles.segmented}>
          <label className={styles.segment}>
            <input
              type="radio"
              name={`${uid}-mode`}
              value="gift"
              checked={draft.mode === "gift"}
              onChange={() => update({ mode: "gift" })}
            />
            <span>Someone else</span>
          </label>
          <label className={styles.segment}>
            <input
              type="radio"
              name={`${uid}-mode`}
              value="self"
              checked={draft.mode === "self"}
              onChange={() => update({ mode: "self" })}
            />
            <span>Myself</span>
          </label>
        </div>
      </fieldset>

      {draft.mode === "gift" ? (
        <>
          <div className={ui.field}>
            <label htmlFor={ids.recipient} className={ui.fieldLabel}>
              Their name (optional)
            </label>
            <input
              {...text}
              id={ids.recipient}
              value={draft.recipient}
              maxLength={NAME_MAX}
              placeholder="e.g. Mei Ling"
              onChange={(event) => update({ recipient: event.target.value })}
            />
          </div>

          <div className={ui.field}>
            <label htmlFor={ids.message} className={ui.fieldLabel}>
              A few words (optional)
            </label>
            <textarea
              id={ids.message}
              className={ui.textarea}
              value={draft.message}
              maxLength={MESSAGE_MAX}
              rows={3}
              placeholder="The afternoon at Serenity is on me."
              autoComplete="off"
              aria-describedby={ids.counter}
              // Focus reveals only a textarea's caret; bring the whole field clear of the sheet's sticky bars.
              onFocus={(event) => event.currentTarget.scrollIntoView({ block: "nearest" })}
              onChange={(event) => update({ message: event.target.value })}
            />
            <p id={ids.counter} className={`${ui.small} ${ui.num} ${ui.muted} ${styles.counter}`} aria-live="off">
              {draft.message.length} / {MESSAGE_MAX}
            </p>
          </div>

          <div className={ui.field}>
            <label htmlFor={ids.from} className={ui.fieldLabel}>
              From (optional)
            </label>
            <input
              {...text}
              id={ids.from}
              value={draft.from}
              maxLength={NAME_MAX}
              placeholder="Your name"
              onChange={(event) => update({ from: event.target.value })}
            />
          </div>
        </>
      ) : (
        <div className={ui.field}>
          <label htmlFor={ids.self} className={ui.fieldLabel}>
            Name on the card (optional)
          </label>
          <input
            {...text}
            id={ids.self}
            value={draft.self}
            maxLength={NAME_MAX}
            onChange={(event) => update({ self: event.target.value })}
          />
        </div>
      )}
    </form>
  );
}
