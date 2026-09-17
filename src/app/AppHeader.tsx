"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { withBasePath } from "./_lib/constants";

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const showLogout =
    pathname === "/dashboard" || pathname === withBasePath("/dashboard");

  function handleLogout() {
    sessionStorage.removeItem("fr-admin-authenticated");
    sessionStorage.removeItem("fr-admin-username");
    router.replace("/");
  }

  return (
    <header className="appHeader">
      <div className="appHeaderInner">
        <Image
          src={withBasePath("/logo.svg")}
          alt="Company logo"
          width={859}
          height={427}
          className="appLogo"
        />

        {showLogout && (
          <button
            type="button"
            className="logoutButton"
            onClick={handleLogout}
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
}
