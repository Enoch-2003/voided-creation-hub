
import { Clock, Shield, Smartphone } from "lucide-react";

export function FeaturesSection() {
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
  );
}
