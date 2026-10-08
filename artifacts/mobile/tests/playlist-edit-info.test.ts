import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("../app/playlist/[id].tsx", import.meta.url), "utf8");
const editor = source.slice(source.indexOf("function EditInfoModal"));

test("Playlist: recomendaciones sin emoji ni divisor superior y menú con nombre correcto", () => {
  assert.doesNotMatch(source, /recommendedMoodBadge|recommendedMoodEmoji|recommendedSectionDivider/);
  assert.match(source, />Sesiones recomendadas</);
  assert.match(source, /Contenido basado en tu último estado de ánimo/);
  assert.match(source, /label: "Agregar a esta playlist", action: onAddSessions/);
  assert.doesNotMatch(source, /Agregar a este ritual/);
  assert.match(source, /index < recommended.length - 1 && <View style=\{styles.recommendedDivider\}/);
});

test("Nombre y datos: campos sin placeholders y controles como Editar detalles", () => {
  assert.doesNotMatch(editor, /placeholder=/);
  assert.match(editor, /borderBottomColor: "rgba\(255,255,255,0\.06\)"/);
  assert.match(editor, /fieldLabel: \{ fontFamily: "Manrope630", color: MUTED, fontSize: 15/);
  assert.match(editor, /height: 43, paddingHorizontal: 18, marginLeft: "auto", borderRadius: 999/);
  assert.match(editor, /disabled=\{saveDisabled\}/);
  assert.match(editor, /onRequestClose=\{\(\) => requestClose\(\)\}/);
  assert.match(editor, /onPress=\{\(\) => requestClose\(onChangeCover\)\}/);
  assert.match(editor, /const hasChanges = name !== playlist.name \|\| desc !== \(playlist.description \?\? ""\)/);
});

test("Salir sin cambios cierra; con cambios espera confirmación nativa", () => {
  const body = editor.split("const requestClose = (close = onClose) => {")[1].split("\n  };")[0];
  let closed = 0;
  let alertArgs: any[] | undefined;
  const onClose = () => { closed++; };
  const Alert = { alert: (...args: any[]) => { alertArgs = args; } };
  const run = new Function("hasChanges", "onClose", "Alert", `return (close = onClose) => {${body}}`);
  run(false, onClose, Alert)();
  assert.equal(closed, 1);
  assert.equal(alertArgs, undefined);
  run(true, onClose, Alert)();
  assert.equal(closed, 1);
  assert.equal(alertArgs![0], "¿Estás seguro/a de que quieres descargar los cambios?");
  assert.equal(alertArgs![2][0].text, "Continuar editando");
  assert.equal(alertArgs![2][0].style, "cancel");
  assert.equal(alertArgs![2][1].text, "Descartar");
  assert.equal(alertArgs![2][1].style, "destructive");
  alertArgs![2][1].onPress();
  assert.equal(closed, 2);
});

test("Guardar requiere cambios y nombre válido y cierra después de guardar", () => {
  assert.match(editor, /const saveDisabled = !hasChanges \|\| !name.trim\(\)/);
  assert.match(editor, /if \(saveDisabled\) return;\s+onSave\(name.trim\(\), desc.trim\(\)\);\s+onClose\(\);/);
});
