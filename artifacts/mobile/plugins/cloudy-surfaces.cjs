const path = require("node:path");
const APP_ROOT = path.resolve(__dirname, "..") + path.sep;
const STYLE_PROPS = new Set([
  "style", "contentContainerStyle", "ListHeaderComponentStyle",
  "ListFooterComponentStyle", "columnWrapperStyle", "imageStyle",
]);

/** App-only: no changes to React Native, dependencies, SVG fills or color tokens. */
module.exports = function cloudySurfaces({ types: t }) {
  function componentExpression(name) {
    if (t.isJSXIdentifier(name)) return t.identifier(name.name);
    return t.memberExpression(componentExpression(name.object), t.identifier(name.property.name));
  }
  return {
    name: "cloudy-surface-backgrounds",
    visitor: {
      Program: {
        enter(program, state) {
          const filename = state.filename || state.file.opts.filename || "";
          state.cloudyEnabled = filename.startsWith(APP_ROOT) &&
            !filename.includes(`${path.sep}node_modules${path.sep}`) &&
            !filename.endsWith(`${path.sep}CloudySurface.tsx`);
          state.cloudySurfaceId = null;
        },
        exit(program, state) {
          if (!state.cloudySurfaceId) return;
          const declaration = t.importDeclaration(
            [t.importSpecifier(state.cloudySurfaceId, t.identifier("CloudySurface"))],
            t.stringLiteral("@/components/CloudySurface"),
          );
          // Preserve startup side-effect import ordering (HTTP asset fix, etc.).
          const imports = program.get("body").filter((entry) => entry.isImportDeclaration());
          if (imports.length) imports.at(-1).insertAfter(declaration);
          else program.unshiftContainer("body", declaration);
        },
      },
      JSXElement: {
        exit(element, state) {
          if (!state.cloudyEnabled) return;
          const opening = element.node.openingElement;
          if (t.isJSXIdentifier(opening.name)) {
            if (/^[a-z]/.test(opening.name.name)) return;
            if (opening.name.name === state.cloudySurfaceId?.name) return;
          }
          const styled = opening.attributes.some((attribute) =>
            t.isJSXSpreadAttribute(attribute) ||
            (t.isJSXAttribute(attribute) && STYLE_PROPS.has(attribute.name.name)),
          );
          if (!styled) return;
          if (!state.cloudySurfaceId) {
            state.cloudySurfaceId = element.scope.getProgramParent().generateUidIdentifier("CloudySurface");
          }
          const originalComponent = componentExpression(opening.name);
          opening.name = t.jsxIdentifier(state.cloudySurfaceId.name);
          opening.attributes.unshift(t.jsxAttribute(
            t.jsxIdentifier("__surfaceComponent"),
            t.jsxExpressionContainer(originalComponent),
          ));
          if (element.node.closingElement) {
            element.node.closingElement.name = t.jsxIdentifier(state.cloudySurfaceId.name);
          }
        },
      },
    },
  };
};