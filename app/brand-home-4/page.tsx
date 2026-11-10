import { BackCover } from "./components/back-cover";
import { Circle } from "./components/circle";
import { Cover } from "./components/cover";
import { Edit } from "./components/edit";
import { Gifts } from "./components/gifts";
import { Interlude, Ticker } from "./components/marquee";
import { Method } from "./components/method";
import { Note } from "./components/note";
import { PointOfView } from "./components/point-of-view";
import { InertScope } from "./components/provider";
import { Sets } from "./components/sets";
import { Studios } from "./components/studios";
import styles from "./layout.module.css";

export default function BrandHomeFourPage() {
  return (
    <InertScope as="main" id="main" className={styles.main}>
      <Cover />
      <Ticker />
      <PointOfView />
      <Edit />
      <Circle />
      <Sets />
      <Gifts />
      <Method />
      <Interlude />
      <Studios />
      <Note />
      <BackCover />
    </InertScope>
  );
}
