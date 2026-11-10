import { BookBar } from "./components/book-bar";
import { Closing } from "./components/closing";
import { Film } from "./components/film";
import { Footer } from "./components/footer";
import { Header } from "./components/header";
import { Houses } from "./components/houses";
import { Menu } from "./components/menu";
import { MaisonMotion } from "./components/motion";
import { Notes } from "./components/notes";
import { Privileges } from "./components/privileges";
import { InertScope, MaisonProvider } from "./components/provider";
import { Standard } from "./components/standard";
import { Visit } from "./components/visit";
import styles from "./page.module.css";

export default function BrandHomeOnePage() {
  return (
    <div className={styles.page} id="top">
      <MaisonProvider>
        <InertScope>
          <a id="mx-skip" className={styles.skip} href="#houses">Skip to content</a>
        </InertScope>
        <Header />
        <InertScope as="main" id="main" className={styles.main}>
          <Film />
          <Houses />
          <Standard />
          <Menu />
          <Privileges />
          <Notes />
          <Visit />
          <Closing />
        </InertScope>
        <Footer />
        <BookBar />
      </MaisonProvider>
      <MaisonMotion />
    </div>
  );
}
