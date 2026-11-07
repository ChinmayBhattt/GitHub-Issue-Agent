import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-4">
        <span className="font-serif text-5xl font-normal text-charcoal">404</span>
        <h1 className="font-serif text-2xl text-charcoal">Page Not Found</h1>
        <p className="text-xs font-sans text-charcoal-light">
          The requested engineering page or resource does not exist.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="btn-metallic inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-sans font-medium text-cream shadow-subtle hover:shadow-elevation transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-cream" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
