import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";

import type { FavoriteCollectionTabId } from "@/lib/favorites-home-helpers";

/** Los tabs de categoría reutilizan los mismos símbolos que Descubrir. */
export function FavoriteTabIcon({ id, color }: { id: FavoriteCollectionTabId; color: string }) {
  switch (id) {
    case "meditaciones":
      return <Image source={require("@/assets/images/cat-meditaciones.png")} style={{ width: 16, height: 16 }} contentFit="contain" tintColor={color} />;
    case "sesiones":
      return <Image source={require("@/assets/images/cat-sesiones.png")} style={{ width: 17, height: 17 }} contentFit="contain" tintColor={color} />;
    case "musica":
      return <Image source={require("@/assets/images/cat-musica.png")} style={{ width: 17, height: 17 }} contentFit="contain" tintColor={color} />;
    case "ambientales":
      return <MaterialCommunityIcons name="leaf" size={18} color={color} />;
    case "historias":
      return <MaterialCommunityIcons name="book-open-page-variant" size={17} color={color} />;
    case "charlas":
      return <MaterialCommunityIcons name="message-text-outline" size={17} color={color} />;
    case "all":
      return <Feather name="grid" size={16} color={color} />;
    case "collections":
      return <Feather name="layers" size={16} color={color} />;
    case "videos":
      return <Feather name="video" size={16} color={color} />;
    case "playlists":
      return <Feather name="list" size={16} color={color} />;
    case "inspiraciones":
      return <Feather name="sun" size={16} color={color} />;
  }
}