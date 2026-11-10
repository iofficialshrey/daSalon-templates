"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import styles from "./fitting-room.module.css";
import { Alert } from "./icons";
import ui from "./ui.module.css";

/*
 * Gift-card personalisation for the fitting room. Controlled by the fitting
 * room (which draws the live preview); nothing typed here is sent, stored or
 * logged, and the draft is discarded when the overlay closes.
 */

export type GiftDraft = {
  mode: "gift" | "self";
  recipient: string;
  message: string;
  from: string;
  /** "Name on the card" when buying for yourself. */
  self: string;
};

export const EMPTY_DRAFT: GiftDraft = { mode: "gift", recipient: "", message: "", from: "", self: "" };

export const NAME_MAX = 40;
export const MESSAGE_MAX = 160;

type Field = "recipient" | "self";
type Errors = Partial<Record<Field, string>>;

function validate(draft: GiftDraft): Errors {
  const errors: Errors = {};
  if (draft.mode === "gift" && draft.recipient.trim().length < 2) errors.recipient = "Add the recipient's name.";
  if (draft.mode === "self" && draft.self.trim().length < 2) errors.self = "Add the name for the card.";
  return errors;
}

const COUNT_WORDS = ["no", "one", "two", "three"];

type GiftFormProps = {
  /** The footer's Buy button submits this form through `form={id}`. */
  id: string;
  draft: GiftDraft;
  onChange: (draft: GiftDraft) => void;
  /** Called on Buy once the fields are valid. */
  onValid: () => void;
  busy: boolean;
};

/**
 * "Who is it for?" (As a gift | For myself), then the fields. Validation runs
 * on Buy and, after that, on blur. Buy moves focus to the first invalid field
 * and a role=alert summary counts the fields to check.
 */
export function GiftForm({ id, draft, onChange, onValid, busy }: GiftFormProps) {
  const uid = useId();
  const [errors, setErrors] = useState<Errors>({});
  const [attempts, setAttempts] = useState(0);
  const recipientRef = useRef<HTMLInputElement>(null);
  const selfRef = useRef<HTMLInputElement>(null);
  const count = Object.keys(errors).length;

  const update = (patch: Partial<GiftDraft>) => onChange({ ...draft, ...patch });

  const setMode = (mode: GiftDraft["mode"]) => {
    update({ mode });
    setErrors({});
  };

  const recheck = () => {
    if (attempts > 0) setErrors(validate(draft));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const next = validate(draft);
    setErrors(next);
    if (next.recipient || next.self) {
      setAttempts((value) => value + 1);
      (next.recipient ? recipientRef : selfRef).current?.focus();
      return;
    }
    onValid();
  };

  const ids = {
    title: `${uid}-title`,
    recipient: `${uid}-recipient`,
    recipientError: `${uid}-recipient-error`,
    message: `${uid}-message`,
    counter: `${uid}-counter`,
    from: `${uid}-from`,
    self: `${uid}-self`,
    selfError: `${uid}-self-error`,
  };

  return (
    <form id={id} className={styles.form} noValidate autoComplete="off" onSubmit={submit} aria-labelledby={ids.title}>
      <h3 id={ids.title} className={styles.subhead}>Personalise the card</h3>
      <p className={ui.srOnly}>The card preview updates as you type.</p>

      <div role="alert" className={styles.summary}>
        {attempts > 0 && count > 0 ? (
          <p key={attempts} className={styles.summaryText}>
            <Alert size={16} />
            Please check {COUNT_WORDS[count] ?? count} {count === 1 ? "field" : "fields"}.
          </p>
        ) : null}
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={`${ui.fieldLabel} ${styles.legend}`}>Who is it for?</legend>
        <div className={ui.segmented}>
          <label className={ui.segment}>
            <input
              type="radio"
              name={`${uid}-mode`}
              value="gift"
              checked={draft.mode === "gift"}
              onChange={() => setMode("gift")}
            />
            As a gift
          </label>
          <label className={ui.segment}>
            <input
              type="radio"
              name={`${uid}-mode`}
              value="self"
              checked={draft.mode === "self"}
              onChange={() => setMode("self")}
            />
            For myself
          </label>
        </div>
      </fieldset>

      {draft.mode === "gift" ? (
        <>
          <div className={ui.field}>
            <label htmlFor={ids.recipient} className={ui.fieldLabel}>Recipient&apos;s name</label>
            <input
              ref={recipientRef}
              id={ids.recipient}
              className={ui.input}
              type="text"
              value={draft.recipient}
              onChange={(event) => update({ recipient: event.target.value })}
              onBlur={recheck}
              required
              maxLength={NAME_MAX}
              placeholder="e.g. Mei Ling"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={Boolean(errors.recipient)}
              aria-describedby={errors.recipient ? ids.recipientError : undefined}
            />
            {errors.recipient ? (
              <p id={ids.recipientError} className={ui.fieldError}>
                <Alert size={16} />
                {errors.recipient}
              </p>
            ) : null}
          </div>

          <div className={ui.field}>
            <label htmlFor={ids.message} className={ui.fieldLabel}>Message (optional)</label>
            <textarea
              id={ids.message}
              className={ui.textarea}
              value={draft.message}
              onChange={(event) => update({ message: event.target.value })}
              maxLength={MESSAGE_MAX}
              rows={4}
              placeholder="Happy birthday. The afternoon at Serenity is on me."
              autoComplete="off"
              aria-describedby={ids.counter}
            />
            <p id={ids.counter} className={ui.counter}>
              {draft.message.length} / {MESSAGE_MAX}
            </p>
          </div>

          <div className={ui.field}>
            <label htmlFor={ids.from} className={ui.fieldLabel}>From (optional)</label>
            <input
              id={ids.from}
              className={ui.input}
              type="text"
              value={draft.from}
              onChange={(event) => update({ from: event.target.value })}
              maxLength={NAME_MAX}
              placeholder="Your name"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </>
      ) : (
        <div className={ui.field}>
          <label htmlFor={ids.self} className={ui.fieldLabel}>Name on the card</label>
          <input
            ref={selfRef}
            id={ids.self}
            className={ui.input}
            type="text"
            value={draft.self}
            onChange={(event) => update({ self: event.target.value })}
            onBlur={recheck}
            required
            maxLength={NAME_MAX}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(errors.self)}
            aria-describedby={errors.self ? ids.selfError : undefined}
          />
          {errors.self ? (
            <p id={ids.selfError} className={ui.fieldError}>
              <Alert size={16} />
              {errors.self}
            </p>
          ) : null}
        </div>
      )}
    </form>
  );
}
