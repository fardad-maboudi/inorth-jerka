import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import _generate from "@babel/generator";
import * as t from "@babel/types";

// @babel/traverse and @babel/generator are CJS; the default-import interop
// differs between Node and Bun (Node exposes `.default`, Bun gives the callable
// directly). Normalise to the callable so the tagger works under both.
const traverse = _traverse?.default ?? _traverse;
const generate = _generate?.default ?? _generate;

// Joorchin visual-edit tagger (vendored, base44-free).
//
// In dev mode this tags every JSX element with:
//   - data-source-location="<filename>:<line>:<col>"  (original-source loc)
//   - data-dynamic-content="true|false"
//
// `data-dynamic-content` is a WHOLE-ELEMENT UI hint only: the studio uses it to
// disable obviously-unsafe edits (e.g. editing the text of an element whose
// children are interpolated). It is intentionally coarse. The authoritative,
// per-property protection lives server-side in be/core's visual-edit.service.ts,
// which re-parses the source and rejects (409) edits that would clobber a
// dynamic value for the *specific* property being changed. Keep that split in
// mind before loosening or tightening anything here.

// Exact bare-identifier names that mark an element's content as dynamic.
// (Exact match — NOT substring — so `revalue`/`textbox`/`itemize` don't trip it.)
const DYNAMIC_IDENTIFIERS = new Set([
  "props",
  "state",
  "data",
  "item",
  "value",
  "content",
]);

// Check if a JSX element contains dynamic content in its subtree.
function checkIfElementHasDynamicContent(jsxElement) {
  let hasDynamicContent = false;

  function checkNodeForDynamicContent(node) {
    // JSX expressions like {variable}, {func()}, {obj.prop}
    if (t.isJSXExpressionContainer(node)) {
      const expression = node.expression;

      // Skip empty expressions {}
      if (t.isJSXEmptyExpression(expression)) {
        return false;
      }

      // Any non-literal expression is considered dynamic
      if (!t.isLiteral(expression)) {
        return true;
      }
    }

    // Template literals with expressions `Hello ${name}`
    if (t.isTemplateLiteral(node) && node.expressions.length > 0) {
      return true;
    }

    // Member expressions like props.title, state.value
    if (t.isMemberExpression(node)) {
      return true;
    }

    // Function calls like getData(), format()
    if (t.isCallExpression(node)) {
      return true;
    }

    // Conditional expressions like condition ? "yes" : "no"
    if (t.isConditionalExpression(node)) {
      return true;
    }

    // Bare identifier references that exactly match a known dynamic name.
    if (t.isIdentifier(node)) {
      if (DYNAMIC_IDENTIFIERS.has(node.name)) {
        return true;
      }
    }

    return false;
  }

  function traverseNode(node) {
    if (checkNodeForDynamicContent(node)) {
      hasDynamicContent = true;
      return;
    }

    Object.keys(node).forEach((key) => {
      const value = node[key];

      if (Array.isArray(value)) {
        value.forEach((child) => {
          if (child && typeof child === "object" && child.type) {
            traverseNode(child);
          }
        });
      } else if (value && typeof value === "object" && value.type) {
        traverseNode(value);
      }
    });
  }

  jsxElement.children.forEach((child) => {
    if (hasDynamicContent) return; // Early exit if already found
    traverseNode(child);
  });

  return hasDynamicContent;
}

export function visualEditPlugin() {
  return {
    name: "visual-edit-transform",
    apply: (config) => config.mode === "development",
    enforce: "pre",
    order: "pre",
    // ponytail: no Tailwind CDN — fights local @import "tailwindcss" (v4)
    // and turns gradient stops (from-*) transparent in preview.
    transform(code, id) {
      // Skip node_modules and the visual-edit runtime itself
      if (id.includes("node_modules") || id.includes("visual-edit-agent")) {
        return null;
      }

      // Process JS/JSX/TS/TSX files
      if (!id.match(/\.(jsx?|tsx?)$/)) {
        return null;
      }

      // Extract filename from path, preserving pages/ or components/ structure
      const pathParts = id.split("/");
      let filename;

      if (id.includes("/components/")) {
        const componentsIndex = pathParts.findIndex(
          (part) => part === "components"
        );
        if (componentsIndex >= 0 && componentsIndex < pathParts.length - 1) {
          const relevantParts = pathParts.slice(
            componentsIndex,
            pathParts.length
          );
          const lastPart = relevantParts[relevantParts.length - 1];
          relevantParts[relevantParts.length - 1] = lastPart.includes(".")
            ? lastPart.split(".")[0]
            : lastPart;
          filename = relevantParts.join("/");
        } else {
          filename = pathParts[pathParts.length - 1];
          if (filename.includes(".")) {
            filename = filename.split(".")[0];
          }
        }
      } else if (id.includes("/pages/")) {
        const pagesIndex = pathParts.findIndex((part) => part === "pages");
        if (pagesIndex >= 0 && pagesIndex < pathParts.length - 1) {
          const relevantParts = pathParts.slice(pagesIndex, pathParts.length);
          const lastPart = relevantParts[relevantParts.length - 1];
          relevantParts[relevantParts.length - 1] = lastPart.includes(".")
            ? lastPart.split(".")[0]
            : lastPart;
          filename = relevantParts.join("/");
        } else {
          filename = pathParts[pathParts.length - 1];
          if (filename.includes(".")) {
            filename = filename.split(".")[0];
          }
        }
      } else {
        // For other files (like layout), just use the filename
        filename = pathParts[pathParts.length - 1];
        if (filename.includes(".")) {
          filename = filename.split(".")[0];
        }
      }

      try {
        const ast = parse(code, {
          sourceType: "module",
          plugins: [
            "jsx",
            "typescript",
            "decorators-legacy",
            "classProperties",
            "objectRestSpread",
            "functionBind",
            "exportDefaultFrom",
            "exportNamespaceFrom",
            "dynamicImport",
            "nullishCoalescingOperator",
            "optionalChaining",
            "asyncGenerators",
            "bigInt",
            "optionalCatchBinding",
            "throwExpressions",
          ],
        });

        traverse(ast, {
          JSXElement(path) {
            const jsxElement = path.node;
            const openingElement = jsxElement.openingElement;

            // Skip fragments
            if (t.isJSXFragment(jsxElement)) return;

            // Skip if already tagged
            const hasSourceLocation = openingElement.attributes.some(
              (attr) =>
                t.isJSXAttribute(attr) &&
                t.isJSXIdentifier(attr.name) &&
                attr.name.name === "data-source-location"
            );

            if (hasSourceLocation) return;

            const { line, column } = openingElement.loc?.start || {
              line: 1,
              column: 0,
            };

            const sourceLocationAttr = t.jsxAttribute(
              t.jsxIdentifier("data-source-location"),
              t.stringLiteral(`${filename}:${line}:${column}`)
            );

            const isDynamic = checkIfElementHasDynamicContent(jsxElement);

            const dynamicContentAttr = t.jsxAttribute(
              t.jsxIdentifier("data-dynamic-content"),
              t.stringLiteral(isDynamic ? "true" : "false")
            );

            openingElement.attributes.unshift(
              sourceLocationAttr,
              dynamicContentAttr
            );
          },
        });

        const result = generate(ast, {
          compact: false,
          concise: false,
          retainLines: true,
        });

        return {
          code: result.code,
          map: null,
        };
      } catch (error) {
        console.error("Failed to add source location to JSX:", error);
        return {
          code: code, // Return original code on failure
          map: null,
        };
      }
    },
  };
}
