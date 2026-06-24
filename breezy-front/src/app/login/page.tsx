"use client";

import { useRouter } from "next/navigation";

import LoginScreen from "../../screens/LoginScreen";
import { useBreezyApp } from "../BreezyAppProvider";

export default function LoginPage() {
  const router = useRouter();
  const { handleLogin, handleRegister, triggerToast, isLightTheme, setIsLightTheme } = useBreezyApp();

  return (
    <LoginScreen
      onLogin={async (...args) => {
        await handleLogin(...args);
        router.replace("/feed");
      }}
      onRegister={async (...args) => {
        await handleRegister(...args);
        router.replace("/feed");
      }}
      triggerToast={triggerToast}
      isLightTheme={isLightTheme}
      onToggleTheme={() => setIsLightTheme(!isLightTheme)}
    />
  );
}
