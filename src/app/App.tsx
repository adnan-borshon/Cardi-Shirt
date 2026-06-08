import { RouterProvider } from "react-router";
import { ThemeProvider } from "./components/ThemeContext";
import { FamilyProvider } from "./components/FamilyContext";
import { router } from "./routes";

export default function App() {
  return (
    <ThemeProvider>
      <FamilyProvider>
        <RouterProvider router={router} />
      </FamilyProvider>
    </ThemeProvider>
  );
}
