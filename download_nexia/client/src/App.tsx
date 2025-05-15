import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Patients from "@/pages/Patients";
import Consultation from "@/pages/Consultation";
import History from "@/pages/History";
import { useAuthState } from "@/hooks/use-auth";
import { AnimatePresence } from "framer-motion";

// Protected route wrapper
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuthState();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }
  
  return user ? <Component /> : <Login />;
}

function Router() {
  return (
    <AnimatePresence mode="wait">
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        
        {/* Protected Routes */}
        <Route path="/dashboard">
          {() => <ProtectedRoute component={Dashboard} />}
        </Route>
        <Route path="/patients">
          {() => <ProtectedRoute component={Patients} />}
        </Route>
        <Route path="/consultation/new">
          {() => <ProtectedRoute component={Consultation} />}
        </Route>
        <Route path="/consultation/:id">
          {(params) => {
            const ConsultationWithParams = () => <Consultation id={params.id} />;
            return <ProtectedRoute component={ConsultationWithParams} />;
          }}
        </Route>
        <Route path="/history">
          {() => <ProtectedRoute component={History} />}
        </Route>
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

export default App;
