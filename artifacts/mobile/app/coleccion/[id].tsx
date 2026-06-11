import { Redirect, useLocalSearchParams } from "expo-router";

export default function ColeccionRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/(tabs)/coleccion/${id ?? ""}` as never} />;
}
