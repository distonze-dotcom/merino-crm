import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60_000,        // data is "fresh" for 5 min → no refetch on navigation
      gcTime: 30 * 60_000,          // keep cached data 30 min after unused
      refetchOnWindowFocus: false,  // don't re-query every time the tab regains focus
      refetchOnReconnect: false,    // don't re-query on network reconnect
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
