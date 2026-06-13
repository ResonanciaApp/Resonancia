import { ClerkProvider, SignIn, useUser, useClerk, useAuth } from "@clerk/react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import {
  Switch,
  Route,
  Redirect,
  Link,
  useLocation,
  Router as WouterRouter,
} from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ListMusic,
  FolderTree,
  LogOut,
  PlusCircle,
  Music2,
  Hexagon,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { queryClient } from "@/lib/queryClient";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";
import DashboardPage from "@/pages/dashboard";
import UsuariosPage from "@/pages/usuarios";
import ModeracionPage from "@/pages/moderacion";
import MezclasPage from "@/pages/mezclas";
import CategoriasPage from "@/pages/categorias";
import SesionesPage from "@/pages/sesiones";
import SonidosPage from "@/pages/sonidos";
import GeometrixPage from "@/pages/geometrix";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#BE9650",
    colorForeground: "#EDE1D3",
    colorMutedForeground: "#7A8FA8",
    colorDanger: "#ef4444",
    colorBackground: "#0B0F14",
    colorInput: "#131820",
    colorInputForeground: "#EDE1D3",
    colorNeutral: "#1E2733",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card border border-border rounded-2xl w-[420px] max-w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground",
    formFieldLabel: "text-foreground",
    footerActionLink: "text-primary hover:text-accent",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-foreground",
    alertText: "text-foreground",
  },
};

function Spinner() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

function SignInScreen() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-primary tracking-tight">
            RESONANCIA
          </h1>
          <p className="text-sm text-muted-foreground">
            Panel de administración
          </p>
        </div>
        <SignIn
          routing="path"
          path={`${basePath}/sign-in`}
          fallbackRedirectUrl={basePath || "/"}
        />
      </div>
    </div>
  );
}

function AccessDenied() {
  const { signOut } = useClerk();
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background px-4">
      <div className="text-center p-8 bg-card border border-border rounded-2xl max-w-md space-y-4">
        <ShieldCheck className="w-10 h-10 mx-auto text-muted-foreground" />
        <h1 className="text-xl font-bold text-foreground">Acceso restringido</h1>
        <p className="text-sm text-muted-foreground">
          Tu cuenta no tiene permisos de administración para entrar a este
          panel.
        </p>
        <button
          type="button"
          onClick={() => signOut({ redirectUrl: `${basePath}/sign-in` })}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

const NAV = [
  { href: "/", label: "Panel", icon: LayoutDashboard },
  { href: "/usuarios", label: "Usuarios", icon: Users },
  { href: "/moderacion", label: "Moderación", icon: ShieldCheck },
  { href: "/mezclas", label: "Mezclas", icon: ListMusic },
  { href: "/categorias", label: "Categorías", icon: FolderTree },
  { href: "/sesiones/nueva", label: "Nueva sesión", icon: PlusCircle },
  { href: "/sonidos", label: "Sonidos Mixer", icon: Music2 },
  { href: "/geometrix", label: "Geometrix", icon: Hexagon },
];

function isActive(location: string, href: string) {
  return href === "/" ? location === "/" : location.startsWith(href);
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 border-r border-border bg-card flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <img src={`${basePath}/logo.svg`} alt="Resonancia" className="w-8 h-8" />
          <span className="font-bold text-lg text-primary tracking-tight">
            RESONANCIA
          </span>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-2">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
                isActive(location, href)
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs">{user?.firstName?.charAt(0) ?? "A"}</span>
              )}
            </div>
            <div className="text-sm truncate">
              <p className="font-medium truncate">{user?.fullName || "Admin"}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: `${basePath}/sign-in` })}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border bg-card flex items-center px-6 md:hidden">
          <span className="font-bold text-lg text-primary tracking-tight">
            RESONANCIA ADMIN
          </span>
        </header>
        <div className="flex-1 overflow-auto p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

function AdminGate() {
  const { isLoaded, isSignedIn } = useUser();
  const {
    data: me,
    isLoading: isLoadingMe,
  } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: isLoaded && isSignedIn,
      retry: false,
    },
  });

  if (!isLoaded || (isSignedIn && isLoadingMe)) {
    return <Spinner />;
  }

  if (!isSignedIn) {
    return <Redirect to="/sign-in" />;
  }

  if (me?.role !== "admin") {
    return <AccessDenied />;
  }

  return (
    <DashboardShell>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/usuarios" component={UsuariosPage} />
        <Route path="/moderacion" component={ModeracionPage} />
        <Route path="/mezclas" component={MezclasPage} />
        <Route path="/categorias" component={CategoriasPage} />
        <Route path="/sesiones/nueva" component={SesionesPage} />
        <Route path="/sonidos" component={SonidosPage} />
        <Route path="/geometrix" component={GeometrixPage} />
        <Route component={NotFound} />
      </Switch>
    </DashboardShell>
  );
}

function ClerkTokenSync() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => { setAuthTokenGetter(null); };
  }, [getToken]);
  return null;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkTokenSync />
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/sign-in/*?" component={SignInScreen} />
          <Route component={AdminGate} />
        </Switch>
        <Toaster />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}
