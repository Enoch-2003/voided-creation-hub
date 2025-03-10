
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";

export function CTASection() {
  const userTypes = ["Students", "Mentors", "Security", "Administration"];

  return (
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
            {userTypes.map((user, i) => (
              <div key={i} className="flex items-center">
                <Check className="h-5 w-5 text-amiblue-500 mr-2" />
                <span className="text-muted-foreground">{user}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
