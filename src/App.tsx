import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import MyLogbook from "./pages/MyLogbook";
import CreateLogEntry from "./pages/CreateLogEntry";
import LogEntryDetail from "./pages/LogEntryDetail";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminReports from "./pages/AdminReports";

function ProtectedRoutes() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const role = user?.role;

  return (
    <Layout>
      <Switch>
        {/* Student routes */}
        {role === "student" && (
          <>
            <Route path="/dashboard" component={StudentDashboard} />
            <Route path="/logbook" component={MyLogbook} />
            <Route path="/log/new" component={CreateLogEntry} />
            <Route path="/log/:id/edit">
              {(params) => <LogEntryDetail entryId={params.id} editMode />}
            </Route>
            <Route path="/log/:id">
              {(params) => <LogEntryDetail entryId={params.id} />}
            </Route>
          </>
        )}

        {/* Supervisor routes */}
        {role === "supervisor" && (
          <>
            <Route path="/dashboard" component={SupervisorDashboard} />
            <Route path="/students" component={SupervisorDashboard} />
            <Route path="/log/:id">
              {(params) => <LogEntryDetail entryId={params.id} />}
            </Route>
          </>
        )}

        {/* Admin routes */}
        {role === "admin" && (
          <>
            <Route path="/dashboard" component={AdminDashboard} />
            <Route path="/admin/users" component={AdminUsers} />
            <Route path="/admin/reports" component={AdminReports} />
          </>
        )}

        {/* Fallback */}
        <Route>
          <div className="text-center py-16">
            <p className="text-muted-foreground">Page not found.</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-3 text-primary hover:underline text-sm"
            >
              Go to dashboard
            </button>
          </div>
        </Route>
      </Switch>
    </Layout>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && (location === "/login" || location === "/register" || location === "/")) {
    navigate("/dashboard");
    return null;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/">
        {() => {
          navigate("/login");
          return null;
        }}
      </Route>
      <Route>
        <ProtectedRoutes />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRoutes />
        </WouterRouter>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
