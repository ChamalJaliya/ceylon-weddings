import Link from "next/link";
import { Button } from "@ceylonweddings/ui/components/button";

export default function NotFound() {
  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Subtle background element */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
        <div className="w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="text-center space-y-6 max-w-xl mx-auto z-10">
        <h1 className="font-serif text-8xl md:text-9xl text-primary font-medium">
          404
        </h1>
        
        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-serif text-foreground">
            This page does not exist
          </h2>
          <p className="text-lg text-muted-foreground">
            The page you are looking for may have moved, or the URL may be incorrect.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Button asChild size="lg" shape="pill">
            <Link href="/">
              Back to home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" shape="pill">
            <Link href="/vendors">
              Browse vendors
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
