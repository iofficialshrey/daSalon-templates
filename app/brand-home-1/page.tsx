import MaisonElan from "./maison-elan";
import CinematicScroll from "./cinematic-scroll";

export default function BrandHomeOnePage() {
  return (
    <div className="me-scroll-lab-shell">
      <CinematicScroll />
      <div className="me-scroll-lab-content">
        <MaisonElan />
      </div>
    </div>
  );
}
