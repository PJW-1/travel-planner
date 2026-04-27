import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "./shell/AppShell";
import { HomePage } from "@/pages/HomePage";
import { PlannerPage } from "@/pages/PlannerPage";
import { AiLabPage } from "@/pages/AiLabPage";
import { CommunityPage } from "@/pages/CommunityPage";
import { CommunityRoutePage } from "@/pages/CommunityRoutePage";
import { LoginPage } from "@/pages/LoginPage";
import { MyPage } from "@/pages/MyPage";
import { SetupPage } from "@/pages/SetupPage";
import { SignupPage } from "@/pages/SignupPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: "home", element: <HomePage /> },
      { path: "setup", element: <SetupPage /> },
      { path: "planner", element: <PlannerPage /> },
      { path: "ai-lab", element: <AiLabPage /> },
      { path: "community", element: <CommunityPage /> },
      { path: "community/:routeId", element: <CommunityRoutePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      { path: "my", element: <MyPage /> },
    ],
  },
]);
