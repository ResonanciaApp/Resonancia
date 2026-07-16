import React from "react";
import { Image } from "react-native";

const LOTUS_IMAGE = require("../assets/images/lotus-streak.png");

interface Props {
  size?: number;
}

export function LotusStreakIcon({ size = 24 }: Props) {
  return (
    <Image
      source={LOTUS_IMAGE}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
