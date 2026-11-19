import { Closing } from "./components/closing";
import { Day } from "./components/day";
import { Hero } from "./components/hero";
import { Houses } from "./components/houses";
import { Offers } from "./components/offers";
import { Treatments } from "./components/treatments";

export default function BrandHomeSixPage() {
  return (
    <main>
      <Hero />
      <Treatments />
      <Day />
      <Houses />
      <Offers />
      <Closing />
    </main>
  );
}
