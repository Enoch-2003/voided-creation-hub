
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  return (
    <section className="pt-32 pb-20 px-4 md:px-0">
      <div className="container mx-auto">
        <div className="flex flex-col-reverse lg:flex-row items-center">
          <div className="lg:w-1/2 space-y-6 mt-12 lg:mt-0 text-center lg:text-left animate-fade-up">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight">
                Digital Outpass System
              </h1>
              <p className="mt-4 text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0">
                Streamlined campus exit approvals with real-time processing and secure verification
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-8">
              <Button size="lg" asChild>
                <Link to="/register">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/login">Login</Link>
              </Button>
            </div>
          </div>
          
          <div className="lg:w-1/2 lg:pl-12 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-amiblue-200 rounded-full blur-3xl opacity-20"></div>
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=https://amipass.com"
                alt="AmiPass QR Code"
                className={cn(
                  "w-full max-w-md mx-auto rounded-2xl shadow-xl transition-opacity duration-700",
                  isImageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setIsImageLoaded(true)}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
