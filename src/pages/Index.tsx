
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Smartphone, Shield, Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { cn } from "@/lib/utils";

export default function Index() {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const features = [
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Real-time Processing",
      description: "Submit and track outpass requests in real-time with instant notifications",
    },
    {
      icon: <Smartphone className="h-5 w-5" />,
      title: "Digital Access",
      description: "Generate secure QR codes that replace traditional paper passes",
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Secure Verification",
      description: "One-time scan system ensures security and prevents unauthorized access",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
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
      
      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold">Key Features</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              AmiPass simplifies the campus exit approval process with modern technology and security features
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-card p-6"
              >
                <div className="w-12 h-12 rounded-full bg-amiblue-100 flex items-center justify-center text-amiblue-600 mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-display font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold">How It Works</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Simple, streamlined, and secure process for campus exit approvals
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
            {[
              {
                step: "1",
                title: "Student Request",
                description: "Student submits an outpass request with exit details and reason",
              },
              {
                step: "2",
                title: "Mentor Review",
                description: "Assigned mentor reviews and approves or denies the request",
              },
              {
                step: "3",
                title: "QR Generation",
                description: "Approved requests generate a secure time-limited QR code",
              },
              {
                step: "4",
                title: "Security Verification",
                description: "QR code is scanned by security for verified campus exit",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="relative p-6 rounded-lg border bg-card text-card-foreground"
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-amiblue-500 text-white flex items-center justify-center font-semibold text-sm">
                  {item.step}
                </div>
                <h3 className="text-lg font-display font-semibold mt-3 mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-amiblue-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-display font-bold mb-6">
              Ready to Modernize Your Campus Exit System?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join educational institutions using AmiPass for seamless campus exit management
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/register">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/login">Login</Link>
              </Button>
            </div>
            
            <div className="mt-12 flex flex-wrap justify-center gap-6">
              {["Students", "Mentors", "Security", "Administration"].map((user, i) => (
                <div key={i} className="flex items-center">
                  <Check className="h-5 w-5 text-amiblue-500 mr-2" />
                  <span className="text-muted-foreground">{user}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-10 border-t mt-auto">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amiblue-400 to-amiblue-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">A</span>
              </div>
              <span className="font-display font-semibold">AmiPass</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AmiPass. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
