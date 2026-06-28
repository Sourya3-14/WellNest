import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { wagmiConfig, queryClient } from "./config/wagmi";

import LandingPage from "./pages/dashboards/LandingPage";
import SignUp from "./pages/users/SignUp";
import SignIn from "./pages/users/SignIn";
import Dashboard from "./pages/dashboards/Dashboard";
import DoctorsPage from "./pages/doctors/DoctorsPage";
import PendingAppointmentsPage from "./pages/PendingAppointmentsPage";
import ScheduledAppointmentsPage from "./pages/ScheduledAppointmentsPage";
import PatientAppointmentsPage from "./pages/patients/PatientAppointmentsPage";
import NGOsPage from "./pages/ngo/NGOsPage";
import HealthWorkersPage from "./pages/health_workers/HealthWorkersPage";
import ProfilePage from "./pages/users/ProfilePage";
import BlogsPage from "./pages/blogs/BlogsPage";
import OutbreakPage from "./pages/outbreak/OutBreakPage";
import EventsMainPage from "./pages/events/EventsMainPage";
import EventsListPage from "./pages/events/EventsListPage";
import OrganizeEventForm from "./pages/events/OrganizeEventForm";
import EventParticipantsPage from "./pages/events/EventParticipantsPage";
import ParticipantRegistration from "./pages/events/ParticipantRegistration";
import AIChatPage from "./pages/medical_agent/AiChatPage";

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/doctors" element={<DoctorsPage />} />
              <Route
                path="/pending-appointments"
                element={<PendingAppointmentsPage />}
              />
              <Route
                path="/scheduled-appointments"
                element={<ScheduledAppointmentsPage />}
              />
              <Route
                path="/my-appointments"
                element={<PatientAppointmentsPage />}
              />
              <Route path="/ngos" element={<NGOsPage />} />
              <Route path="/healthworkers" element={<HealthWorkersPage />} />
              <Route path="/outbreak" element={<OutbreakPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/blogs" element={<BlogsPage />} />
              <Route path="/assistant" element={<AIChatPage />} />
              <Route path="/events" element={<EventsMainPage />} />
              <Route path="/events/:eventType" element={<EventsListPage />} />
              <Route
                path="/events/organize/:eventType"
                element={<OrganizeEventForm />}
              />
              <Route
                path="/events/participants/:eventId"
                element={<EventParticipantsPage />}
              />
              <Route
                path="/events/register/:eventId"
                element={<ParticipantRegistration />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
