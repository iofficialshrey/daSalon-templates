"use client";

import { useEffect, useState, type FormEvent } from "react";

export type BookingService = {
  name: string;
  duration: string;
  price: string;
};

type SalonBookingProps = {
  brand: string;
  services: BookingService[];
  onClose: () => void;
};

const bookingDates = ["Today, 18 Aug", "Tomorrow, 19 Aug", "Thursday, 20 Aug"];
const bookingTimes = ["10:00", "11:30", "14:00", "16:30", "18:00"];

export default function SalonBooking({ brand, services, onClose }: SalonBookingProps) {
  const [step, setStep] = useState(1);
  const [service, setService] = useState(services[0]);
  const [date, setDate] = useState(bookingDates[1]);
  const [time, setTime] = useState(bookingTimes[2]);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep(4);
  }

  return (
    <div className="salon-booking-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="salon-booker" role="dialog" aria-modal="true" aria-label={`Book at ${brand}`}>
        <header className="salon-booker-head">
          <div><small>{brand}</small><h2>{step === 4 ? "Your time is held." : "Choose your appointment."}</h2></div>
          <button type="button" onClick={onClose} aria-label="Close booking">×</button>
        </header>

        {step < 4 && <div className="salon-booker-progress" aria-label={`Step ${step} of 3`}>{[1, 2, 3].map((item) => <i key={item} className={item <= step ? "active" : ""} />)}</div>}

        {step === 1 && <section className="salon-booker-step">
          <p>Select a service</p>
          <div className="salon-booker-services">{services.map((item) => <button type="button" className={service.name === item.name ? "selected" : ""} key={item.name} onClick={() => setService(item)}><span><strong>{item.name}</strong><small>{item.duration}</small></span><b>{item.price}</b></button>)}</div>
          <button className="salon-booker-next" type="button" onClick={() => setStep(2)}>Choose a time <span>→</span></button>
        </section>}

        {step === 2 && <section className="salon-booker-step">
          <button className="salon-booker-back" type="button" onClick={() => setStep(1)}>← Services</button>
          <p>Select a date</p>
          <div className="salon-booker-dates">{bookingDates.map((item) => <button type="button" key={item} className={date === item ? "selected" : ""} onClick={() => setDate(item)}>{item}</button>)}</div>
          <p>Select a time</p>
          <div className="salon-booker-times">{bookingTimes.map((item) => <button type="button" key={item} className={time === item ? "selected" : ""} onClick={() => setTime(item)}>{item}</button>)}</div>
          <button className="salon-booker-next" type="button" onClick={() => setStep(3)}>Your details <span>→</span></button>
        </section>}

        {step === 3 && <form className="salon-booker-step" onSubmit={confirm}>
          <button className="salon-booker-back" type="button" onClick={() => setStep(2)}>← Date and time</button>
          <label><span>First name</span><input required value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label>
          <label><span>Mobile number</span><input required inputMode="tel" /></label>
          <label><span>Email address</span><input required type="email" /></label>
          <div className="salon-booker-summary"><span>{service.name}</span><strong>{date}<br />{time}</strong></div>
          <button className="salon-booker-next" type="submit">Confirm booking <span>→</span></button>
        </form>}

        {step === 4 && <section className="salon-booker-confirmation"><span>{brand.charAt(0)}</span><p>Thank you{firstName ? `, ${firstName}` : ""}.</p><h3>{service.name}</h3><strong>{date} at {time}</strong><small>This Brand Home does not submit personal data. A live salon would connect this action to da Salon.</small><button type="button" onClick={onClose}>Return to the site</button></section>}
      </aside>
    </div>
  );
}
