import { describe, expect, it } from "vitest";
import {
  getInternalEditorialTagOption,
  getPublicationNotificationMatch,
} from "./publication-notification-matching";

const session = {
  categoryId: "musica-sonidos",
  categoryLabel: "Música",
  title: "Cuencos al amanecer",
  themeTag: ["__other_theme_internal:foco-concentracion__:Música tranquilizadora"],
  temaTag: [],
  sonidosTags: [],
  descansoTags: [],
};

describe("published session notification matching", () => {
  it("detects only canonical internal Explore tags and extracts their labels", () => {
    expect(getInternalEditorialTagOption(
      "__other_theme_internal:foco-concentracion__:Música tranquilizadora",
    )).toEqual({
      id: "__other_theme_internal:foco-concentracion__:Música tranquilizadora",
      label: "Música tranquilizadora",
    });
    expect(getInternalEditorialTagOption("Música")).toBeNull();
    expect(getInternalEditorialTagOption("__supercategory_theme_sonidos__:Naturaleza")).toBeNull();
  });

  it("prioritizes an editorial tag over the broader category", () => {
    expect(getPublicationNotificationMatch(session, {
      selectedCategoryIds: ["musica-sonidos"],
      selectedEditorialTags: [
        "__other_theme_internal:foco-concentracion__:Música tranquilizadora",
      ],
    })).toEqual({
      label: "Música tranquilizadora",
      message: "Nueva sesión de Música tranquilizadora: Cuencos al amanecer",
    });
  });

  it("does not match users with unrelated selections", () => {
    expect(getPublicationNotificationMatch(session, {
      selectedCategoryIds: ["meditaciones-guiadas"],
      selectedEditorialTags: [
        "__other_theme_internal:sueño__:Sueño profundo",
      ],
    })).toBeNull();
  });

  it("does not offer category-only notifications for Reflexiones", () => {
    expect(getPublicationNotificationMatch({
      ...session,
      categoryId: "charlas",
      categoryLabel: "Reflexiones",
      themeTag: [],
    }, {
      selectedCategoryIds: ["charlas"],
      selectedEditorialTags: [],
    })).toBeNull();
  });
});