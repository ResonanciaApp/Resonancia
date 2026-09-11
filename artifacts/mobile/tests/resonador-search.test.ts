import assert from "node:assert/strict";
import test from "node:test";

import type { Resonador } from "../data/resonadores.ts";
import { filterResonadores } from "../lib/resonador-search.ts";

const resonadores: Resonador[] = [
  {
    id: "uno",
    name: "Árbol Sagrado",
    photo: 1,
    subtipo: "Músico",
    bio: "Ceremonias de sonido",
    city: "Lima",
    country: "Perú",
    specialty: ["Cuencos tibetanos"],
    genres: ["Música ceremonial"],
    bookingModality: "presencial",
  },
  {
    id: "dos",
    name: "Kai Amara",
    photo: 2,
    subtipo: "Voz guía",
    bio: "Meditación y respiración",
    city: "Ciudad de México",
    country: "México",
    specialty: ["Meditación guiada"],
    genres: ["Mindfulness"],
    bookingModality: "ambas",
  },
];

test("busca Resonadores ignorando mayúsculas y tildes", () => {
  assert.deepEqual(
    filterResonadores(resonadores, { query: "arbol peru" }).map(({ id }) => id),
    ["uno"],
  );
});

test("combina rol, país y modalidad", () => {
  assert.deepEqual(
    filterResonadores(resonadores, {
      role: "Músico",
      country: "Perú",
      modality: "presencial",
    }).map(({ id }) => id),
    ["uno"],
  );
});

test("la modalidad ambas aparece en online y presencial", () => {
  assert.deepEqual(
    filterResonadores(resonadores, { modality: "online" }).map(({ id }) => id),
    ["dos"],
  );
  assert.deepEqual(
    filterResonadores(resonadores, { modality: "presencial" }).map(({ id }) => id),
    ["uno", "dos"],
  );
});