import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";
import { capacityMetricsMiddleware } from "./lib/capacityMetrics";
import { accountDeletionGuard } from "./middlewares/accountDeletionGuard";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(capacityMetricsMiddleware());

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: true }));
app.use(
  express.json({
    verify: (_req, _res, buf) => {
      (_req as unknown as { rawBody: Buffer }).rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use(accountDeletionGuard);
app.use("/api", router);

app.get("/privacidad", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Política de Privacidad — Resonancia</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #1B060F;
      color: #F4DAD5;
      line-height: 1.7;
      padding: 40px 20px 80px;
    }
    .container { max-width: 720px; margin: 0 auto; }
    .logo {
      font-size: 13px;
      letter-spacing: 3px;
      color: #D4AF37;
      text-transform: uppercase;
      margin-bottom: 48px;
      font-weight: 600;
    }
    h1 {
      font-size: 32px;
      font-weight: 700;
      color: #F4DAD5;
      margin-bottom: 8px;
      line-height: 1.2;
    }
    .updated {
      font-size: 13px;
      color: rgba(242,231,228,0.45);
      margin-bottom: 48px;
    }
    h2 {
      font-size: 18px;
      font-weight: 700;
      color: #D4AF37;
      margin: 40px 0 12px;
    }
    p { margin-bottom: 14px; color: rgba(242,231,228,0.85); font-size: 15px; }
    ul { padding-left: 20px; margin-bottom: 14px; }
    li { color: rgba(242,231,228,0.85); font-size: 15px; margin-bottom: 6px; }
    a { color: #D4AF37; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .divider {
      border: none;
      border-top: 1px solid rgba(212,175,55,0.15);
      margin: 48px 0 0;
    }
    .contact {
      margin-top: 32px;
      background: rgba(74,12,12,0.4);
      border: 1px solid rgba(212,175,55,0.15);
      border-radius: 16px;
      padding: 24px;
      font-size: 15px;
      color: rgba(242,231,228,0.85);
    }
    .contact strong { color: #D4AF37; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Resonancia — Casa del Cuenco</div>
    <h1>Política de Privacidad</h1>
    <p class="updated">Última actualización: 16 de junio de 2026</p>

    <p>
      Esta Política de Privacidad describe cómo <strong>Resonancia — Casa del Cuenco</strong>
      ("nosotros", "nuestro" o "la App") recopila, usa y protege la información personal
      de los usuarios de la aplicación móvil Resonancia, disponible en el App Store de Apple.
    </p>

    <h2>1. Información que recopilamos</h2>
    <p>Recopilamos la siguiente información cuando usás la App:</p>
    <ul>
      <li><strong>Información de cuenta:</strong> nombre de usuario, dirección de correo electrónico y contraseña (gestionada de forma segura a través de Clerk).</li>
      <li><strong>Datos de actividad:</strong> sesiones de meditación escuchadas, tiempo de reproducción, sesiones favoritas y progreso personal.</li>
      <li><strong>Contenido generado por el usuario:</strong> entradas del diario personal, intenciones del día y mezclas de sonidos guardadas.</li>
      <li><strong>Datos de uso:</strong> información sobre cómo interactuás con la App (funciones usadas, frecuencia de uso) con el propósito de mejorar la experiencia.</li>
      <li><strong>Información del dispositivo:</strong> identificador del dispositivo, sistema operativo y versión de la App, necesarios para el funcionamiento técnico.</li>
    </ul>

    <h2>2. Cómo usamos tu información</h2>
    <p>Usamos la información recopilada para:</p>
    <ul>
      <li>Proveer y personalizar los servicios de la App (meditaciones, sonidos, diario).</li>
      <li>Sincronizar tu progreso y favoritos entre sesiones.</li>
      <li>Enviar notificaciones de recordatorio de práctica (solo si las activás).</li>
      <li>Mejorar la funcionalidad y el contenido de la App.</li>
      <li>Gestionar tu suscripción premium cuando corresponda.</li>
    </ul>
    <p>No vendemos, alquilamos ni compartimos tu información personal con terceros con fines publicitarios.</p>

    <h2>3. Servicios de terceros</h2>
    <p>La App utiliza los siguientes servicios de terceros, cada uno con su propia política de privacidad:</p>
    <ul>
      <li><strong>Clerk</strong> — Autenticación y gestión de cuentas de usuario. <a href="https://clerk.com/privacy" target="_blank">clerk.com/privacy</a></li>
      <li><strong>RevenueCat</strong> — Gestión de suscripciones y compras dentro de la App. <a href="https://www.revenuecat.com/privacy" target="_blank">revenuecat.com/privacy</a></li>
      <li><strong>Apple App Store</strong> — Distribución de la App y procesamiento de pagos de suscripción en iOS.</li>
    </ul>

    <h2>4. Almacenamiento y seguridad</h2>
    <p>
      Tu información se almacena en servidores seguros con cifrado en tránsito (HTTPS/TLS).
      El contenido del diario personal y las intenciones se guardan localmente en tu dispositivo
      y, opcionalmente, se sincronizan con tu cuenta en la nube cuando iniciás sesión.
    </p>
    <p>
      Implementamos medidas técnicas y organizativas razonables para proteger tu información
      contra accesos no autorizados, pérdida o alteración.
    </p>

    <h2>5. Retención de datos</h2>
    <p>
      Conservamos tu información mientras tu cuenta esté activa. Si eliminás tu cuenta,
      borraremos o anonimizaremos tus datos personales dentro de los 30 días siguientes,
      salvo que la ley nos exija conservarlos por más tiempo.
    </p>

    <h2>6. Tus derechos</h2>
    <p>Tenés derecho a:</p>
    <ul>
      <li>Acceder a la información personal que tenemos sobre vos.</li>
      <li>Solicitar la corrección de datos inexactos.</li>
      <li>Solicitar la eliminación de tu cuenta y datos asociados.</li>
      <li>Exportar tus datos en un formato portable.</li>
    </ul>
    <p>Para ejercer cualquiera de estos derechos, contactanos a través del correo indicado al final de esta página.</p>

    <h2>7. Privacidad de menores</h2>
    <p>
      La App no está dirigida a menores de 13 años. No recopilamos conscientemente información
      personal de niños menores de 13 años. Si tomamos conocimiento de que un menor nos ha
      proporcionado datos personales, los eliminaremos de inmediato.
    </p>

    <h2>8. Cambios a esta política</h2>
    <p>
      Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos sobre
      cambios significativos a través de la App o por correo electrónico. El uso continuado
      de la App después de dichos cambios constituye tu aceptación de la política actualizada.
    </p>

    <hr class="divider" />

    <div class="contact">
      <strong>Contacto</strong><br /><br />
      Si tenés preguntas sobre esta Política de Privacidad o sobre el tratamiento de tus datos,
      podés escribirnos a:<br /><br />
      <a href="mailto:hola@resonancia.app">hola@resonancia.app</a><br />
      Resonancia — Casa del Cuenco
    </div>
  </div>
</body>
</html>`);
});

export default app;
