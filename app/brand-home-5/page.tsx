import { Closing } from "./components/closing";
import { Hero } from "./components/hero";
import { House } from "./components/house";
import { Offers } from "./components/offers";
import { Rooms } from "./components/rooms";
import { Treatments } from "./components/treatments";
import styles from "./page.module.css";

export default function BrandHomeFivePage() {
  return (
    <main>
      <Hero />
      <div className={styles.sheet}>
        <Treatments />
        <House />
        <Rooms />
        <Offers />
        <Closing />
      </div>
    </main>
  );
}
