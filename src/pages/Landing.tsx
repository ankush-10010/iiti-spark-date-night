import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Users, Shield, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-dating.jpg";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient opacity-90"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: `url(${heroImage})` }}
        ></div>
        
        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-card-enter">
              <span className="gradient-text">Find Your Perfect</span>
              <br />
              <span className="text-foreground">Campus Connection</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 animate-card-enter" style={{ animationDelay: '0.2s' }}>
              The exclusive dating platform for IIT Indore students. 
              Connect, chat, and create meaningful relationships within your campus community.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-card-enter" style={{ animationDelay: '0.4s' }}>
              <Button variant="hero" size="lg" className="text-lg px-8 py-4 animate-pulse-glow" asChild>
                <Link to="/register">Start Your Journey</Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4" asChild>
                <Link to="/login">Already a Member?</Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Floating hearts animation */}
        <div className="absolute top-20 left-10 text-primary/20 animate-float">
          <Heart size={32} />
        </div>
        <div className="absolute top-40 right-20 text-accent/20 animate-float" style={{ animationDelay: '1s' }}>
          <Heart size={24} />
        </div>
        <div className="absolute bottom-40 left-20 text-primary/20 animate-float" style={{ animationDelay: '2s' }}>
          <Heart size={28} />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 gradient-text">Why Choose Campus Connect?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built specifically for the IIT Indore community, ensuring genuine connections with your peers.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="card-gradient p-8 text-center hover:scale-105 smooth-transition">
              <Shield className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Verified Students</h3>
              <p className="text-muted-foreground">Only @iiti.ac.in emails allowed. Your safety is our priority.</p>
            </Card>
            
            <Card className="card-gradient p-8 text-center hover:scale-105 smooth-transition">
              <Users className="w-16 h-16 mx-auto mb-4 text-accent" />
              <h3 className="text-xl font-semibold mb-2">Campus Community</h3>
              <p className="text-muted-foreground">Connect with students from your own college and department.</p>
            </Card>
            
            <Card className="card-gradient p-8 text-center hover:scale-105 smooth-transition">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Smart Matching</h3>
              <p className="text-muted-foreground">Advanced algorithm matches you based on interests and preferences.</p>
            </Card>
            
            <Card className="card-gradient p-8 text-center hover:scale-105 smooth-transition">
              <Heart className="w-16 h-16 mx-auto mb-4 text-accent" />
              <h3 className="text-xl font-semibold mb-2">Meaningful Connections</h3>
              <p className="text-muted-foreground">Find friendship, dating partners, or networking opportunities.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10"></div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Find Your Match?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of IIT Indore students who have already found their perfect campus connection.
          </p>
          <Button variant="hero" size="lg" className="text-lg px-12 py-4 animate-pulse-glow" asChild>
            <Link to="/register">Get Started Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Landing;