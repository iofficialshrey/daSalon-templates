"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep production details private while still leaving a useful diagnostic in development.
    if (process.env.NODE_ENV === "development") console.error(error);
  }, [error]);

  return (
    <main className="site-fallback">
      <p>da Salon Brand Home</p>
      <h1>Something interrupted the experience.</h1>
      <span>Please try the page again. Your booking has not been submitted.</span>
      <button type="button" onClick={reset}>Try again</button>
      <Link href="/">Return to the collection</Link>
    </main>
  );
}
