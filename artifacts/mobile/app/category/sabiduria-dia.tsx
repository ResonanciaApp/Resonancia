import { Redirect } from "expo-router";

export default function SabiduriaDiaRedirect() {
  return <Redirect href={"/category/meditaciones-guiadas" as never} />;
}
