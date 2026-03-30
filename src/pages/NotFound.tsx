import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur border-border/60 shadow-lg">
        <CardHeader>
          <CardTitle className="text-4xl">404</CardTitle>
          <CardDescription>
            Page not found: <span className="font-mono text-xs">{location.pathname}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button asChild>
            <Link to="/">Return to Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
