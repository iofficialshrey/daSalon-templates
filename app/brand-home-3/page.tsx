import { Film } from "./components/film";
import { Gifts } from "./components/gifts";
import { Intro } from "./components/intro";
import { Invitation } from "./components/invitation";
import { Journey } from "./components/journey";
import { Membership } from "./components/membership";
import { Packages } from "./components/packages";
import { Places } from "./components/places";
import { InertScope } from "./components/provider";
import { Rituals } from "./components/rituals";
import { SlowHours } from "./components/slow-hours";
import styles from "./layout.module.css";

/** One native, statically prerendered page: the film, then nine sections on one grid. */
export default function BrandHomeThreePage() {
  return (
    <InertScope as="main" id="main" className={styles.main}>
      <Film />
      <Intro />
      <Rituals />
      <Journey />
      <Places />
      <SlowHours />
      <Membership />
      <Packages />
      <Gifts />
      <Invitation />
    </InertScope>
  );
}
