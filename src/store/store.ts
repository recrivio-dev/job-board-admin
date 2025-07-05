import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./features/uiSlice";
import UserReducer from "./features/userSlice";
import jobReducer from "./features/jobSlice";
import candidateReducer from "./features/candidatesSlice";
import organisationReducer from "./features/organisationSlice";
import DashboardReducer from "./features/dashboardSlice";

const store = configureStore({
  reducer: {
    ui: uiReducer,
    user: UserReducer,
    jobs: jobReducer,
    candidates: candidateReducer,
    organisation: organisationReducer,
    dashboard: DashboardReducer,
    // Add other reducers here as they are created
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          "user/initializeAuth/fulfilled",
          "user/loginUser/fulfilled",
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: ["meta.arg", "payload.timestamp", "payload.user"],
        // Ignore these paths in the state
        ignoredPaths: ["items.dates", "user.user"],
      },
    }),
});

// Add a global reset action
export const resetStore = () => {
  store.dispatch({ type: "RESET_STORE" });
};

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
