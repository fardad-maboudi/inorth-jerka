/**
 * Visual Edit Script - Runs inside the iframe to enable element selection
 * This script is loaded by the generated site and communicates with the parent via postMessage
 */
(function () {
  if (window.__visualEditInitialized) return;
  window.__visualEditInitialized = true;

  // Only run in iframe
  if (window.self === window.top) {
    console.log("[VisualEdit] Not in iframe, skipping initialization");
    return;
  }

  console.log("[VisualEdit] Initializing visual editor in iframe");

  let isEnabled = false;
  let isEditingText = false;
  let pickingSuspended = false;
  let hoveredElement = null;
  let selectedElement = null;
  let highlightOverlay = null;
  let selectionOverlay = null;
  let originalText = null;
  let originalEditInlineStyles = null;
  /** Detached node + comment placeholder for cheap delete rollback (A7). */
  let pendingDeleteRollback = null;

  function visualEditStyleTransition() {
    // Instant feedback while editing — animated transitions feel like lag.
    return "color 0ms, background-color 0ms, opacity 0ms";
  }

  function ensureVisualEditStyleTransition(el) {
    if (!el || el.dataset.visualEditStyleTransition === "1") return;
    const add = visualEditStyleTransition();
    const prev =
      el.style.transition && el.style.transition !== "none" ? el.style.transition : "";
    el.style.transition = prev ? `${prev}, ${add}` : add;
    el.dataset.visualEditStyleTransition = "1";
  }

  /** Apply style props in one paint; set new values before clearing old keys. */
  function applyStyleProps(el, styles, clearProps) {
    if (!el) return;
    ensureVisualEditStyleTransition(el);
    const setKeys = new Set(Object.keys(styles || {}));
    if (styles && typeof styles === "object") {
      for (const [prop, value] of Object.entries(styles)) {
        if (prop === "color") {
          el.style.webkitTextFillColor = "";
          el.style.backgroundClip = "";
          el.style.webkitBackgroundClip = "";
          el.style.backgroundImage = "";
        }
        if (prop === "backgroundColor") {
          el.style.backgroundClip = "";
          el.style.webkitBackgroundClip = "";
        }
        el.style[prop] = value;
      }
    }
    if (Array.isArray(clearProps)) {
      for (const prop of clearProps) {
        if (typeof prop !== "string" || !prop || setKeys.has(prop)) continue;
        el.style[prop] = "";
      }
    }
  }

  function optimisticallyDeleteElement(element) {
    const parent = element.parentNode;
    if (!parent) return false;

    const placeholder = document.createComment("visual-edit-delete-placeholder");
    parent.replaceChild(placeholder, element);

    pendingDeleteRollback = {
      detachedNode: element,
      placeholder,
      parent,
      sourceLocation: element.getAttribute("data-source-location"),
    };

    selectedElement = null;
    updateOverlay(selectionOverlay, null);
    updateOverlay(highlightOverlay, null);

    window.parent.postMessage(
      { type: "visual-edit:element-deleted", payload: true },
      "*",
    );
    return true;
  }

  function restoreDeletedElement() {
    if (!pendingDeleteRollback) return false;

    const { detachedNode, placeholder, parent } = pendingDeleteRollback;
    pendingDeleteRollback = null;

    if (placeholder.isConnected && placeholder.parentNode === parent) {
      parent.replaceChild(detachedNode, placeholder);
    } else if (parent.isConnected) {
      parent.appendChild(detachedNode);
    } else {
      return false;
    }

    selectedElement = detachedNode;
    const rect = detachedNode.getBoundingClientRect();
    updateOverlay(selectionOverlay, rect);

    const info = getElementInfo(detachedNode);
    if (info) {
      window.parent.postMessage(
        { type: "visual-edit:element-click", payload: info },
        "*",
      );
    }
    return true;
  }

  function clearPendingDeleteRollback() {
    pendingDeleteRollback = null;
  }

  // Create highlight overlay element
  function createOverlay(id, color) {
    const overlay = document.createElement("div");
    overlay.id = id;
    overlay.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 99998;
      border: 2px solid ${color};
      background: ${color}20;
      transition: all 0.1s ease;
      display: none;
      border-radius: 4px;
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  function initOverlays() {
    if (!highlightOverlay) {
      highlightOverlay = createOverlay("visual-edit-highlight", "#3b82f6");
    }
    if (!selectionOverlay) {
      selectionOverlay = createOverlay("visual-edit-selection", "#8b5cf6");
      selectionOverlay.style.border = "2px solid #8b5cf6";
      selectionOverlay.style.background = "#8b5cf620";
    }
  }

  function updateOverlay(overlay, rect) {
    if (!rect || !overlay) {
      if (overlay) overlay.style.display = "none";
      return;
    }
    overlay.style.display = "block";
    overlay.style.top = rect.top + "px";
    overlay.style.left = rect.left + "px";
    overlay.style.width = rect.width + "px";
    overlay.style.height = rect.height + "px";
  }

  function getElementInfo(element) {
    if (!element) return null;

    const sourceLocation = element.getAttribute("data-source-location");
    if (!sourceLocation) return null;

    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);
    const className = element.className || "";
    const textColorFromClass = className.match(/\btext-\[(#[0-9a-fA-F]{6})\]/)?.[1];
    const bgColorFromClass = className.match(/\bbg-\[(#[0-9a-fA-F]{6})\]/)?.[1];
    const inlineColor = element.style.color;
    const inlineBg = element.style.backgroundColor;
    const reportedColor =
      (inlineColor && inlineColor !== "transparent" ? inlineColor : null) ||
      textColorFromClass ||
      styles.color;
    const reportedBackgroundColor =
      (inlineBg && inlineBg !== "transparent" ? inlineBg : null) ||
      bgColorFromClass ||
      styles.backgroundColor;

    // Get direct text content (not from children)
    let directText = "";
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        directText += node.textContent;
      }
    }

    const info = {
      sourceLocation,
      dynamicContent: element.getAttribute("data-dynamic-content") === "true",
      tagName: element.tagName.toLowerCase(),
      className,
      textContent: (element.textContent || "").slice(0, 500),
      directText: directText.trim(),
      innerHTML: element.innerHTML,
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
        x: rect.x,
        y: rect.y,
      },
      computedStyles: {
        color: reportedColor,
        backgroundColor: reportedBackgroundColor,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        fontFamily: styles.fontFamily,
        padding: styles.padding,
        margin: styles.margin,
        borderRadius: styles.borderRadius,
        textAlign: styles.textAlign,
        opacity: styles.opacity,
      },
    };

    // Add image src if element is an image
    if (element.tagName.toLowerCase() === "img" && element.src) {
      info.imageSrc = element.src;
      info.alt = element.alt || "";
    }

    // Expose the link target for <a> so href can be edited.
    if (element.tagName.toLowerCase() === "a") {
      info.href = element.getAttribute("href") || "";
    }

    info.ancestors = collectAncestors(element);
    info.instanceIndex = getSourceLocationInstanceIndex(element);

    return info;
  }

  /** Parents with source tags, outermost (near root) → innermost. */
  function collectAncestors(element) {
    const ancestors = [];
    let current = element.parentElement;
    while (current && current !== document.body) {
      const sourceLocation = current.getAttribute("data-source-location");
      if (sourceLocation) {
        ancestors.push({
          tagName: current.tagName.toLowerCase(),
          sourceLocation,
          dynamicContent:
            current.getAttribute("data-dynamic-content") === "true",
        });
      }
      current = current.parentElement;
    }
    ancestors.reverse();
    return ancestors;
  }

  function getElementsBySourceLocation(sourceLocation) {
    const results = [];
    if (!sourceLocation) return results;
    for (const el of document.querySelectorAll("[data-source-location]")) {
      if (el.getAttribute("data-source-location") === sourceLocation) {
        results.push(el);
      }
    }
    return results;
  }

  function getSourceLocationInstanceIndex(element) {
    const loc = element.getAttribute("data-source-location");
    if (!loc) return 0;
    const matches = getElementsBySourceLocation(loc);
    for (let i = 0; i < matches.length; i++) {
      if (matches[i] === element) return i;
    }
    return 0;
  }

  /** @param {object} [options]
   * @param {string} [options.contextSourceLocation] — leaf still selected in studio (breadcrumb)
   * @param {number} [options.contextInstanceIndex]
   * @param {number} [options.instanceIndex] — direct Nth match (undo/redo)
   */
  function findElementBySourceLocation(sourceLocation, options) {
    if (!sourceLocation) return null;
    const opts = options || {};
    const contextSourceLocation = opts.contextSourceLocation;
    const contextInstanceIndex = opts.contextInstanceIndex;
    const instanceIndex = opts.instanceIndex;

    if (typeof instanceIndex === "number" && instanceIndex >= 0) {
      const matches = getElementsBySourceLocation(sourceLocation);
      if (matches[instanceIndex]) return matches[instanceIndex];
    }

    if (selectedElement) {
      let current = selectedElement;
      while (current && current !== document.body) {
        if (current.getAttribute("data-source-location") === sourceLocation) {
          return current;
        }
        current = current.parentElement;
      }
    }

    if (
      contextSourceLocation &&
      typeof contextInstanceIndex === "number" &&
      contextInstanceIndex >= 0
    ) {
      const contexts = getElementsBySourceLocation(contextSourceLocation);
      const ctx = contexts[contextInstanceIndex] ?? null;
      if (ctx) {
        let current = ctx;
        while (current && current !== document.body) {
          if (current.getAttribute("data-source-location") === sourceLocation) {
            return current;
          }
          current = current.parentElement;
        }
      }
    }

    const matches = getElementsBySourceLocation(sourceLocation);
    return matches[0] ?? null;
  }

  function selectElement(element) {
    if (!element || !isEnabled) return;

    if (isEditingText) {
      disableTextEditing(false);
    }

    selectedElement = element;
    updateOverlay(highlightOverlay, null);
    const rect = element.getBoundingClientRect();
    updateOverlay(selectionOverlay, rect);

    const info = getElementInfo(element);
    if (!info) return;

    console.log("[VisualEdit] Element selected:", info.sourceLocation);
    window.parent.postMessage(
      { type: "visual-edit:element-click", payload: info },
      "*",
    );
  }

  function findEditableParent(element) {
    let current = element;
    while (current && current !== document.body) {
      if (
        current.hasAttribute &&
        current.hasAttribute("data-source-location")
      ) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  /** Prefer a tagged <img> under the pointer so card wrappers don't steal image clicks. */
  function findEditableTarget(element, clientX, clientY) {
    if (typeof clientX === "number" && typeof clientY === "number") {
      const stack = document.elementsFromPoint(clientX, clientY);
      for (const el of stack) {
        if (
          el.tagName?.toLowerCase() === "img" &&
          el.hasAttribute?.("data-source-location")
        ) {
          return el;
        }
      }
      for (const el of stack) {
        if (el.hasAttribute?.("data-source-location")) {
          return el;
        }
      }
    }
    return findEditableParent(element);
  }

  function isDynamicElement(element) {
    return element?.getAttribute?.("data-dynamic-content") === "true";
  }

  /** True when the element has child elements (not just text nodes). */
  function hasElementChildNodes(element) {
    if (!element?.childNodes) return false;
    for (const node of element.childNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) return true;
    }
    return false;
  }

  // ========== TEXT EDITING ==========

  function enableTextEditing(element) {
    if (!element || isEditingText) return;
    if (isDynamicElement(element)) return;

    isEditingText = true;
    originalText = element.textContent;

    const computed = window.getComputedStyle(element);
    const pageDir =
      document.documentElement.getAttribute("dir") ||
      window.getComputedStyle(document.documentElement).direction ||
      "ltr";
    originalEditInlineStyles = {
      textAlign: element.style.textAlign,
      direction: element.style.direction,
    };
    // contenteditable ignores inherited text-align on many UAs — mirror computed layout.
    element.style.textAlign = computed.textAlign;
    element.style.direction =
      computed.direction === "rtl" || computed.direction === "ltr"
        ? computed.direction
        : pageDir;

    // Make element editable
    element.setAttribute("contenteditable", "true");
    element.style.outline = "2px solid #8b5cf6";
    element.style.outlineOffset = "2px";
    element.style.cursor = "text";

    // Focus and select all text
    element.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);

    // Hide overlay while editing
    updateOverlay(selectionOverlay, null);

    console.log("[VisualEdit] Text editing enabled");
    window.parent.postMessage({ type: "visual-edit:text-edit-start" }, "*");
  }

  function disableTextEditing(save = true) {
    if (!selectedElement || !isEditingText) return;

    const newText = selectedElement.textContent;

    // Remove editable state
    selectedElement.removeAttribute("contenteditable");
    selectedElement.style.outline = "";
    selectedElement.style.outlineOffset = "";
    selectedElement.style.cursor = "";
    if (originalEditInlineStyles) {
      selectedElement.style.textAlign = originalEditInlineStyles.textAlign;
      selectedElement.style.direction = originalEditInlineStyles.direction;
      originalEditInlineStyles = null;
    } else {
      selectedElement.style.textAlign = "";
      selectedElement.style.direction = "";
    }

    isEditingText = false;

    if (save && newText !== originalText) {
      const info = getElementInfo(selectedElement);
      console.log("[VisualEdit] Text changed:", {
        old: originalText,
        new: newText,
      });
      window.parent.postMessage(
        {
          type: "visual-edit:text-changed",
          payload: {
            ...info,
            oldText: originalText,
            newText: newText,
          },
        },
        "*",
      );
    } else if (!save) {
      // Restore original text
      selectedElement.textContent = originalText;
    }

    // Restore overlay
    const rect = selectedElement.getBoundingClientRect();
    updateOverlay(selectionOverlay, rect);

    originalText = null;
    window.parent.postMessage({ type: "visual-edit:text-edit-end" }, "*");
  }

  function handleTextEditKeyDown(e) {
    if (!isEditingText) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      disableTextEditing(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      disableTextEditing(false);
    }
  }

  function handleTextEditBlur(e) {
    if (!isEditingText) return;

    // Small delay to allow for click events
    setTimeout(() => {
      if (isEditingText) {
        disableTextEditing(true);
      }
    }, 100);
  }

  // ========== MOUSE & CLICK HANDLERS ==========

  function suspendPicking() {
    pickingSuspended = true;
    document.body.style.cursor = "";
    updateOverlay(highlightOverlay, null);
    hoveredElement = null;
  }

  function resumePicking() {
    if (!isEnabled) return;
    pickingSuspended = false;
    if (!isEditingText) {
      document.body.style.cursor = "crosshair";
    }
  }

  function handleMouseMove(e) {
    if (!isEnabled || isEditingText || pickingSuspended) return;

    const target = findEditableTarget(e.target, e.clientX, e.clientY);

    if (target !== hoveredElement) {
      hoveredElement = target;

      if (target && target !== selectedElement) {
        const rect = target.getBoundingClientRect();
        updateOverlay(highlightOverlay, rect);
      } else {
        updateOverlay(highlightOverlay, null);
      }

      const info = getElementInfo(target);
      window.parent.postMessage(
        { type: "visual-edit:element-hover", payload: info },
        "*",
      );
    }
  }

  function handleClick(e) {
    if (!isEnabled || pickingSuspended) return;
    if (isEditingText) return; // Don't interfere with text editing

    const target = findEditableTarget(e.target, e.clientX, e.clientY);
    if (!target) {
      // Clicked outside editable element - deselect
      if (selectedElement) {
        selectedElement = null;
        updateOverlay(selectionOverlay, null);
        window.parent.postMessage(
          { type: "visual-edit:element-deselect" },
          "*",
        );
      }
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    selectElement(target);
  }

  function handleDoubleClick(e) {
    if (!isEnabled) return;

    const target = findEditableTarget(e.target, e.clientX, e.clientY);
    if (target && target === selectedElement) {
      e.preventDefault();
      e.stopPropagation();
      enableTextEditing(target);
    }
  }

  function handleKeyDown(e) {
    if (isEditingText) {
      handleTextEditKeyDown(e);
      return;
    }

    if (e.key === "Escape" && selectedElement) {
      e.preventDefault();
      selectedElement = null;
      updateOverlay(selectionOverlay, null);
      window.parent.postMessage({ type: "visual-edit:element-deselect" }, "*");
      return;
    }

    if ((e.key === "Delete" || e.key === "Backspace") && selectedElement) {
      e.preventDefault();
      window.parent.postMessage({ type: "visual-edit:request-delete" }, "*");
      return;
    }

    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === "z") {
      e.preventDefault();
      window.parent.postMessage(
        {
          type: e.shiftKey
            ? "visual-edit:request-redo"
            : "visual-edit:request-undo",
        },
        "*",
      );
      return;
    }
    if (mod && e.key.toLowerCase() === "y") {
      e.preventDefault();
      window.parent.postMessage({ type: "visual-edit:request-redo" }, "*");
      return;
    }

    // Press Enter to start editing text
    if (e.key === "Enter" && selectedElement && !isEditingText) {
      e.preventDefault();
      enableTextEditing(selectedElement);
    }
  }

  function handleScroll() {
    // Update overlay positions on scroll
    if (selectedElement && !isEditingText) {
      const rect = selectedElement.getBoundingClientRect();
      updateOverlay(selectionOverlay, rect);

      // Send scroll info to parent for Base44-style menu following
      window.parent.postMessage(
        {
          type: "visual-edit:iframe-scroll",
          payload: {
            scrollY: window.scrollY,
            scrollX: window.scrollX,
            elementRect: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              right: rect.right,
              bottom: rect.bottom,
              x: rect.x,
              y: rect.y,
            },
          },
        },
        "*",
      );
    }
    if (hoveredElement && hoveredElement !== selectedElement) {
      const rect = hoveredElement.getBoundingClientRect();
      updateOverlay(highlightOverlay, rect);
    }
  }

  function enable() {
    if (isEnabled) return;
    isEnabled = true;
    initOverlays();

    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("dblclick", handleDoubleClick, true);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("blur", handleTextEditBlur, true);
    window.addEventListener("scroll", handleScroll, true);

    document.body.style.cursor = "crosshair";
    console.log("[VisualEdit] Enabled");
    window.parent.postMessage({ type: "visual-edit:ready" }, "*");
  }

  function disable() {
    if (!isEnabled) return;

    // End any active text editing
    if (isEditingText) {
      disableTextEditing(false);
    }

    isEnabled = false;
    pickingSuspended = false;

    document.removeEventListener("mousemove", handleMouseMove, true);
    document.removeEventListener("click", handleClick, true);
    document.removeEventListener("dblclick", handleDoubleClick, true);
    document.removeEventListener("keydown", handleKeyDown, true);
    document.removeEventListener("blur", handleTextEditBlur, true);
    window.removeEventListener("scroll", handleScroll, true);

    if (highlightOverlay) highlightOverlay.style.display = "none";
    if (selectionOverlay) selectionOverlay.style.display = "none";

    document.body.style.cursor = "";
    hoveredElement = null;
    selectedElement = null;
    console.log("[VisualEdit] Disabled");
  }

  // Listen for messages from parent
  window.addEventListener("message", (e) => {
    const { type, payload } = e.data || {};

    switch (type) {
      case "visual-edit:enable":
        enable();
        break;
      case "visual-edit:disable":
        disable();
        break;
      case "visual-edit:suspend-picking":
        suspendPicking();
        break;
      case "visual-edit:resume-picking":
        resumePicking();
        break;
      case "visual-edit:check-ready":
        // Respond to parent's readiness check
        window.parent.postMessage({ type: "visual-edit:loaded" }, "*");
        break;
      case "visual-edit:deselect":
        selectedElement = null;
        hoveredElement = null;
        updateOverlay(selectionOverlay, null);
        updateOverlay(highlightOverlay, null);
        break;
      case "visual-edit:select-by-location": {
        const loc = payload?.sourceLocation;
        if (typeof loc === "string" && loc) {
          const el = findElementBySourceLocation(loc, {
            contextSourceLocation: payload?.contextSourceLocation,
            contextInstanceIndex: payload?.contextInstanceIndex,
            instanceIndex: payload?.instanceIndex,
          });
          if (el) {
            if (payload?.silent) {
              if (isEditingText) disableTextEditing(false);
              selectedElement = el;
              updateOverlay(highlightOverlay, null);
              updateOverlay(selectionOverlay, el.getBoundingClientRect());
            } else {
              selectElement(el);
            }
          }
        }
        break;
      }
      case "visual-edit:start-text-edit":
        // Start text editing on currently selected element
        if (selectedElement) {
          enableTextEditing(selectedElement);
        }
        break;
      case "visual-edit:highlight":
        if (payload?.selector) {
          const el = document.querySelector(payload.selector);
          if (el) {
            const rect = el.getBoundingClientRect();
            updateOverlay(highlightOverlay, rect);
          }
        }
        break;
      case "visual-edit:update-style":
        // Update styles on selected element
        if (selectedElement && payload?.styles) {
          applyStyleProps(selectedElement, payload.styles);
          // Send updated info back
          const info = getElementInfo(selectedElement);
          window.parent.postMessage(
            {
              type: "visual-edit:style-updated",
              payload: info,
            },
            "*",
          );
        }
        break;
      case "visual-edit:update-content":
        // Update text content on selected element
        if (
          selectedElement &&
          payload?.textContent !== undefined &&
          !isDynamicElement(selectedElement)
        ) {
          // Clear all child nodes and set new text
          selectedElement.textContent = payload.textContent;

          // Send updated info back to parent
          const info = getElementInfo(selectedElement);
          window.parent.postMessage(
            {
              type: "visual-edit:text-changed",
              payload: info,
            },
            "*",
          );
        }
        break;
      case "visual-edit:update-image":
        // Update image src on selected element
        if (
          selectedElement &&
          selectedElement.tagName.toLowerCase() === "img" &&
          payload?.imageSrc
        ) {
          selectedElement.src = payload.imageSrc;
          if (payload.alt !== undefined) {
            selectedElement.alt = payload.alt;
          }

          // Send updated info back to parent
          const info = getElementInfo(selectedElement);
          window.parent.postMessage(
            {
              type: "visual-edit:image-changed",
              payload: info,
            },
            "*",
          );
        }
        break;
      case "visual-edit:delete-element":
        // Detach + comment placeholder so restore can re-insert without reloading
        // the whole iframe when persist fails (A7).
        if (selectedElement && !isDynamicElement(selectedElement)) {
          optimisticallyDeleteElement(selectedElement);
        }
        break;
      case "visual-edit:commit-delete":
        clearPendingDeleteRollback();
        break;
      case "visual-edit:update-attribute":
        // Update a plain attribute (href/src/alt) on the selected element so
        // link/image edits preview optimistically. Persistence + the
        // authoritative dynamic guard happen in be/core.
        if (selectedElement && payload?.attributes) {
          Object.entries(payload.attributes).forEach(([name, value]) => {
            if (value === undefined) return;
            selectedElement.setAttribute(name, value);
          });
          const info = getElementInfo(selectedElement);
          window.parent.postMessage(
            {
              type: "visual-edit:attribute-updated",
              payload: info,
            },
            "*",
          );
        }
        break;
      case "visual-edit:update-class":
        // Update className on selected element
        if (selectedElement && payload?.className !== undefined) {
          ensureVisualEditStyleTransition(selectedElement);
          if (payload.previewStyles && typeof payload.previewStyles === "object") {
            applyStyleProps(
              selectedElement,
              payload.previewStyles,
              payload.clearStyles,
            );
          } else if (Array.isArray(payload.clearStyles)) {
            applyStyleProps(selectedElement, {}, payload.clearStyles);
          }
          selectedElement.className = payload.className;
          if (payload.previewOnly) break;
          // Send updated info back to parent
          const info = getElementInfo(selectedElement);
          window.parent.postMessage(
            {
              type: "visual-edit:class-updated",
              payload: info,
            },
            "*",
          );
        }
        break;
      case "visual-edit:restore":
        // Roll back optimistic delete without reloading iframe src.
        if (payload?.restoreDelete) {
          restoreDeletedElement();
          break;
        }
        // Roll back optimistic DOM when server persist fails (409 / network).
        if (selectedElement && payload) {
          if (payload.className !== undefined) {
            selectedElement.className = payload.className;
          }
          if (
            payload.textContent !== undefined &&
            !hasElementChildNodes(selectedElement)
          ) {
            selectedElement.textContent = payload.textContent;
          }
          if (payload.styles && typeof payload.styles === "object") {
            Object.entries(payload.styles).forEach(([prop, value]) => {
              selectedElement.style[prop] = value ?? "";
            });
          }
          if (payload.previewStyles && typeof payload.previewStyles === "object") {
            applyStyleProps(
              selectedElement,
              payload.previewStyles,
              payload.clearPreviewStyles,
            );
          } else if (Array.isArray(payload.clearPreviewStyles)) {
            applyStyleProps(selectedElement, {}, payload.clearPreviewStyles);
          }
          if (payload.attributes && typeof payload.attributes === "object") {
            Object.entries(payload.attributes).forEach(([name, value]) => {
              if (value === undefined || value === null) return;
              if (name === "src" && selectedElement.tagName.toLowerCase() === "img") {
                selectedElement.src = value;
              } else {
                selectedElement.setAttribute(name, value);
              }
            });
          }
          const info = getElementInfo(selectedElement);
          window.parent.postMessage(
            { type: "visual-edit:style-updated", payload: info },
            "*",
          );
        }
        break;
    }
  });

  // Notify parent that we're ready to receive messages
  console.log("[VisualEdit] Script loaded, waiting for enable message");
  window.parent.postMessage({ type: "visual-edit:loaded" }, "*");

  // ── Preview error reporter ────────────────────────────────────────────────
  // Forward Vite overlay / runtime errors to Studio chat (postMessage bridge).
  let lastPreviewErrorSignature = "";

  function reportPreviewError(title, details, meta) {
    const signature = `${title}\n${details ?? ""}`;
    if (!title || signature === lastPreviewErrorSignature) return;
    lastPreviewErrorSignature = signature;

    window.parent?.postMessage(
      {
        type: "app_error",
        error: {
          title,
          details,
          file: meta?.file,
          plugin: meta?.plugin,
          componentName: meta?.componentName,
        },
      },
      "*",
    );
  }

  function extractViteOverlayError(overlay) {
    const root = overlay.shadowRoot;
    if (!root) return;

    const plugin = root.querySelector(".plugin")?.textContent?.trim();
    const message = root.querySelector(".message-body")?.textContent?.trim();
    const file = root.querySelector(".file")?.textContent?.trim();
    const frame = root.querySelector(".frame")?.textContent?.trim();
    const stack = root.querySelector(".stack")?.textContent?.trim();

    if (!message) return;

    const title = plugin ? `${plugin} ${message}` : message;
    const detailsParts = [];
    if (file) detailsParts.push(`File: ${file}`);
    if (frame) detailsParts.push(frame);
    if (stack) detailsParts.push(stack);

    reportPreviewError(title, detailsParts.join("\n\n"), {
      file,
      plugin: plugin?.match(/\[plugin:([^\]]+)\]/)?.[1]?.trim(),
    });
  }

  function scanForViteOverlay() {
    document.querySelectorAll("vite-error-overlay").forEach(extractViteOverlayError);
  }

  const previewErrorObserver = new MutationObserver(scanForViteOverlay);
  previewErrorObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  scanForViteOverlay();
  window.setInterval(scanForViteOverlay, 2000);
})();
