import { Ateliers } from "./components/ateliers";
import { Closing } from "./components/closing";
import { Collection } from "./components/collection";
import { Cover } from "./components/cover";
import { Privileges } from "./components/privileges";
import { InertScope } from "./components/provider";
import { Ritual } from "./components/ritual";
import { Walk } from "./components/walk";
import styles from "./layout.module.css";

export default function BrandHomeTwoPage() {
  return (
    <InertScope as="main" id="main" className={styles.main}>
      <Cover />
      <Walk />
      <Ritual />
      <Ateliers />
      <Collection />
      <Privileges />
      <Closing />
    </InertScope>
  );
}
