import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, BookOpen, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-semibold text-neutral-800">Youth Empowerment Hub</h1>
            </div>
            <Button onClick={() => navigate("/login")}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-neutral-900 mb-6">
            Empowering Youth Through Support & Connection
          </h2>
          <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
            A comprehensive platform connecting young people with counsellors, 
            CBT resources, and peer support to build resilience and prevent violence.
          </p>
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={() => navigate("/login")}
          >
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-neutral-900 mb-12">
            How We Support You
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-neutral-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <BookOpen className="h-12 w-12 text-secondary mb-4" />
                <CardTitle className="text-xl">CBT Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600">
                  Access evidence-based cognitive behavioral therapy worksheets, 
                  videos, and interactive tools designed for young people.
                </p>
              </CardContent>
            </Card>

            <Card className="border-neutral-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Professional Counselling</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600">
                  Connect with qualified counsellors who specialize in youth 
                  mental health and violence prevention.
                </p>
              </CardContent>
            </Card>

            <Card className="border-neutral-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <MessageSquare className="h-12 w-12 text-accent mb-4" />
                <CardTitle className="text-xl">Peer Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600">
                  Engage with a supportive community and communicate directly 
                  with counsellors through our secure messaging system.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h3>
          <p className="text-xl text-primary-foreground mb-8">
            Join thousands of young people who are building resilience and 
            creating positive change in their communities.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="bg-white text-primary hover:bg-neutral-100"
            onClick={() => window.location.href = '/api/login'}
          >
            Sign Up Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-800 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <Heart className="h-8 w-8 text-primary mr-3" />
            <h4 className="text-xl font-semibold">Youth Empowerment Hub</h4>
          </div>
          <p className="text-neutral-400 mb-6">
            Supporting young people in building resilience and preventing violence 
            through evidence-based interventions and community connection.
          </p>
          <div className="text-sm text-neutral-500">
            © 2024 Youth Empowerment Hub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
