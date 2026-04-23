import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth & Protection
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute"; // 1. Import the new bouncer
import Login from "./pages/Login";

// Layout
import Layout from "./components/Layout";

// Pages
import Home from "./pages/Home";
import Calendar from "./pages/Calendar";
import RoomAssignment from "./pages/RoomAssignment";
import OrganizationalChart from "./pages/OrganizationalChart";
import Students from "./pages/StudentLists";
import Tutorials from "./pages/Tutorials";
import Forms from "./pages/Forms";
import FormView from "./pages/FormView";
import AddUser from "./pages/AddUser";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTE: Wrapped in the Reverse Bouncer */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* PROTECTED ROUTES: Wrapped in the regular Bouncer */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="room-assignment" element={<RoomAssignment />} />
          <Route
            path="organizational-chart"
            element={<OrganizationalChart />}
          />
          <Route path="students" element={<Students />} />
          <Route path="tutorials" element={<Tutorials />} />
          <Route path="forms" element={<Forms />} />
          <Route path="forms/:id" element={<FormView />} />
          <Route path="add-user" element={<AddUser />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
