import Link from "next/link";

export default function NotFound() {
  return (
    <main className="site-fallback">
      <p>404 · da Salon Brand Home</p>
      <h1>This Brand Home could not be found.</h1>
      <span>The address may have changed, or the template is no longer in the collection.</span>
      <Link className="site-fallback-primary" href="/">Return to the collection</Link>
    </main>
  );
}
