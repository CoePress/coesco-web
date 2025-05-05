import useAppContext from "@/hooks/context/use-app";
import { ReactNode, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  ChevronRight,
  DoorOpen,
  Moon,
  Sun,
  X,
  LucideIcon,
  Menu,
} from "lucide-react";
import useLogout from "@/hooks/auth/use-logout";
import useAuth from "@/hooks/context/use-auth";

import useTheme from "@/hooks/context/use-theme";
import { routes } from "@/lib/config";
import Loader from "../shared/loader";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";

type LayoutProps = {
  children: ReactNode;
};

type SidebarItemProps = {
  label: string;
  path: string;
  icon: LucideIcon;
  alert?: boolean;
};

type SidebarProps = {
  sidebarExpanded: boolean;
  toggleSidebar: () => void;
};

type NavLink = {
  label: string;
  path: string;
  icon: LucideIcon;
};

const getNavigationLinks = (userRole?: string): NavLink[] => {
  const baseLinks = routes.protected.filter((route) => route.sidebar);
  const adminLinks = routes.admin.filter((route) => route.sidebar);

  if (userRole === "admin") {
    return [...baseLinks, ...adminLinks];
  }

  return baseLinks;
};

const SIDEBAR_ITEM_BASE_STYLES =
  "relative flex items-center py-2 px-3 font-medium rounded-md cursor-pointer transition-colors group";
const TOOLTIP_STYLES =
  "absolute left-full rounded-md px-2 py-1 ml-6 bg-primary text-primary-foreground text-sm invisible opacity-20 -translate-x-3 transition-all ease-in-out group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 z-20 whitespace-nowrap";

const SidebarTooltip = ({ label, show }: { label: string; show: boolean }) => {
  if (show) return null;
  return <div className={TOOLTIP_STYLES}>{label}</div>;
};

const SidebarItem = ({ label, path, icon: Icon, alert }: SidebarItemProps) => {
  const { sidebarExpanded } = useAppContext();

  return (
    <NavLink
      to={path}
      end
      className={({ isActive }) =>
        `${SIDEBAR_ITEM_BASE_STYLES} ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`
      }>
      <div className="flex items-center justify-center">
        <Icon
          size={22}
          strokeWidth={1.75}
        />
      </div>
      <span
        className={`overflow-hidden transition-all whitespace-nowrap text-sm ${sidebarExpanded ? "w-52 ml-3" : "w-0"}`}>
        {label}
      </span>
      {alert && (
        <div
          className={`absolute right-2 w-2 h-2 rounded bg-primary ${!sidebarExpanded ? "top-2" : ""}`}
        />
      )}
      <SidebarTooltip
        label={label}
        show={sidebarExpanded}
      />
    </NavLink>
  );
};

const Sidebar = ({ sidebarExpanded, toggleSidebar }: SidebarProps) => {
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { logout, loading: logoutLoading, error: logoutError } = useLogout();
  const navigationLinks = getNavigationLinks(user?.role);

  return (
    <aside className="max-w-60 h-full hidden md:flex">
      <nav className="border-r border-border shadow-xs flex flex-col h-full px-2 pt-2 relative w-full">
        <div className="flex items-center justify-between z-20">
          <div
            className={`overflow-hidden whitespace-nowrap transition-all ease-in-out ${
              sidebarExpanded ? "w-32" : "w-0"
            }`}>
            OEE Dashboard
          </div>

          <button
            onClick={toggleSidebar}
            className="py-2 px-3 rounded-lg hover:bg-muted focus:outline-hidden">
            <ChevronRight
              size={22}
              className={`transition-all ease-in-out ${
                sidebarExpanded ? "-rotate-180" : ""
              }`}
            />
          </button>
        </div>

        <hr className="mt-2" />

        <div className="flex-1 flex flex-col gap-2 mt-2 justify-between">
          <div className="flex flex-col gap-2">
            {navigationLinks.map((link) => (
              <SidebarItem
                key={link.label}
                label={link.label}
                path={link.path}
                icon={link.icon}
              />
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={toggleTheme}
              className={`relative justify-end flex text-left items-center py-2 hover:bg-muted px-3 font-medium rounded-md cursor-pointer transition-colors group select-none`}>
              <div className={`flex items-center justify-center w-6 h-6`}>
                {logoutLoading ? (
                  <Loader size="sm" />
                ) : theme === "dark" ? (
                  <Sun size={22} />
                ) : (
                  <Moon size={22} />
                )}
              </div>

              <span
                className={`overflow-hidden transition-all whitespace-nowrap text-sm ${
                  sidebarExpanded ? "w-52 ml-3" : "w-0"
                }`}>
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>

              {!sidebarExpanded && (
                <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-primary text-primary-foreground text-sm invisible opacity-20 -translate-x-3 transition-all ease-in-out group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 z-20 whitespace-nowrap">
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </div>
              )}
            </button>

            <Dialog
              open={logoutModalOpen}
              onOpenChange={setLogoutModalOpen}>
              <DialogTrigger asChild>
                <button
                  className={`relative justify-end flex text-left items-center py-2 hover:bg-muted px-3 font-medium rounded-md cursor-pointer transition-colors group`}>
                  <div className={`flex items-center justify-center w-6 h-6`}>
                    {logoutLoading ? (
                      <Loader size="sm" />
                    ) : (
                      <DoorOpen size={22} />
                    )}
                  </div>

                  <span
                    className={`overflow-hidden transition-all whitespace-nowrap text-sm ${
                      sidebarExpanded ? "w-52 ml-3" : "w-0"
                    }`}>
                    Logout
                  </span>

                  {!sidebarExpanded && (
                    <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-primary text-primary-foreground text-sm invisible opacity-20 -translate-x-3 transition-all ease-in-out group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 z-20 whitespace-nowrap">
                      Logout
                    </div>
                  )}
                </button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100%-2rem)] mx-auto">
                <DialogHeader>
                  <DialogTitle>Logout</DialogTitle>
                  <DialogDescription className="hidden"></DialogDescription>
                </DialogHeader>

                {logoutError && (
                  <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                    {logoutError}
                  </div>
                )}

                <p>Are you sure you want to logout?</p>

                <div className="flex gap-2">
                  <Button
                    onClick={logout}
                    className="w-full"
                    variant="destructive">
                    Confirm
                  </Button>
                  <Button
                    onClick={() => setLogoutModalOpen(false)}
                    className="w-full">
                    Cancel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <UserAvatar
              user={user}
              expanded={sidebarExpanded}
            />
          </div>
        </div>
      </nav>
    </aside>
  );
};

const UserAvatar = ({ user, expanded }: { user: any; expanded: boolean }) => (
  <div className="border-t flex py-2 z-20">
    <div className="w-12 h-12 rounded-lg overflow-clip border text-sm shrink-0 flex items-center justify-center">
      {`${user?.name?.split(" ")[0]?.[0]}${user?.name?.split(" ")[1]?.[0]}`}
    </div>
    <div
      className={`flex justify-between items-center overflow-hidden transition-all ${expanded ? "w-32 ml-3" : "w-0"}`}>
      <div className="leading-none">
        <h4 className="font-medium text-sm">{`${user?.name?.split(" ")[0]} ${user?.name?.split(" ")[1]?.[0]}.`}</h4>
        <span className="text-xs text-gray-600">{user?.email}</span>
      </div>
    </div>
  </div>
);

const MobileNav = () => {
  const { sidebarExpanded, toggleSidebar } = useAppContext();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { logout, loading: logoutLoading, error: logoutError } = useLogout();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const navigationLinks = getNavigationLinks(user?.role);

  return (
    <>
      <div
        className={`fixed inset-0 bg-background/80 backdrop-blur-xs transition-all md:hidden z-80 ${
          sidebarExpanded ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={toggleSidebar}
      />

      <aside
        className={`fixed inset-y-0 left-0 w-60 md:hidden transition-transform duration-300 z-81 ${
          sidebarExpanded ? "translate-x-0" : "-translate-x-full"
        }`}>
        <nav className="bg-neutral-100 dark:bg-neutral-900 border-r border-border shadow-lg h-full flex flex-col">
          <div className="flex items-center justify-between p-2">
            <div>OEE Dashboard</div>

            <button
              onClick={toggleSidebar}
              className="py-2 px-3 rounded-lg hover:bg-muted focus:outline-hidden">
              <X size={22} />
            </button>
          </div>

          <hr />

          <div className="flex-1 flex flex-col gap-2 p-2">
            <div className="flex flex-col gap-2">
              {navigationLinks.map((link) => (
                <SidebarItem
                  key={link.label}
                  label={link.label}
                  path={link.path}
                  icon={link.icon}
                />
              ))}
            </div>

            <div className="mt-auto flex flex-col gap-2">
              <button
                onClick={toggleTheme}
                className={`relative justify-end flex text-left items-center py-2 hover:bg-muted px-3 font-medium rounded-md cursor-pointer transition-colors group select-none`}>
                <div className={`flex items-center justify-center w-6 h-6`}>
                  {logoutLoading ? (
                    <Loader size="sm" />
                  ) : theme === "dark" ? (
                    <Sun size={22} />
                  ) : (
                    <Moon size={22} />
                  )}
                </div>

                <span
                  className={`overflow-hidden transition-all whitespace-nowrap text-sm ${
                    sidebarExpanded ? "w-52 ml-3" : "w-0"
                  }`}>
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </span>

                {!sidebarExpanded && (
                  <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-primary text-primary-foreground text-sm invisible opacity-20 -translate-x-3 transition-all ease-in-out group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 z-20 whitespace-nowrap">
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </div>
                )}
              </button>

              <Dialog
                open={logoutModalOpen}
                onOpenChange={setLogoutModalOpen}>
                <DialogTrigger asChild>
                  <button
                    className={`relative justify-end flex text-left items-center py-2 hover:bg-muted px-3 font-medium rounded-md cursor-pointer transition-colors group`}>
                    <div className={`flex items-center justify-center w-6 h-6`}>
                      {logoutLoading ? (
                        <Loader size="sm" />
                      ) : (
                        <DoorOpen size={22} />
                      )}
                    </div>

                    <span
                      className={`overflow-hidden transition-all whitespace-nowrap text-sm ${
                        sidebarExpanded ? "w-52 ml-3" : "w-0"
                      }`}>
                      Logout
                    </span>

                    {!sidebarExpanded && (
                      <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-primary text-primary-foreground text-sm invisible opacity-20 -translate-x-3 transition-all ease-in-out group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 z-20 whitespace-nowrap">
                        Logout
                      </div>
                    )}
                  </button>
                </DialogTrigger>
                <DialogContent className="w-[calc(100%-2rem)] mx-auto">
                  <DialogHeader>
                    <DialogTitle>Logout</DialogTitle>
                    <DialogDescription className="hidden"></DialogDescription>
                  </DialogHeader>

                  {logoutError && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                      {logoutError}
                    </div>
                  )}

                  <p>Are you sure you want to logout?</p>

                  <div className="flex gap-2">
                    <Button
                      onClick={logout}
                      className="w-full"
                      variant="destructive">
                      Confirm
                    </Button>
                    <Button
                      onClick={() => setLogoutModalOpen(false)}
                      className="w-full">
                      Cancel
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <UserAvatar
              user={user}
              expanded={sidebarExpanded}
            />
          </div>
        </nav>
      </aside>
    </>
  );
};

const Layout = ({ children }: LayoutProps) => {
  const { sidebarExpanded, toggleSidebar } = useAppContext();

  const handleKeyDown = (event: KeyboardEvent) => {
    const inputFocus =
      document.activeElement && document.activeElement.tagName === "INPUT";

    if (event.key === "[" && !inputFocus) {
      event.preventDefault();
      toggleSidebar();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="h-screen overflow-hidden flex">
      <Sidebar
        toggleSidebar={toggleSidebar}
        sidebarExpanded={sidebarExpanded}
      />

      <div className="flex-1 flex flex-col overflow-auto">
        <MobileNav />

        <nav className="p-2 md:hidden border-b">
          <button
            onClick={toggleSidebar}
            className="py-2 px-3 rounded-lg hover:bg-muted focus:outline-hidden">
            <Menu size={18} />
          </button>
        </nav>

        <main className="flex-1 bg-background">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
