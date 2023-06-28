(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));

  // node_modules/frappe-datatable/node_modules/sortablejs/Sortable.js
  var require_Sortable = __commonJS({
    "node_modules/frappe-datatable/node_modules/sortablejs/Sortable.js"(exports, module) {
      (function sortableModule(factory) {
        "use strict";
        if (typeof define === "function" && define.amd) {
          define(factory);
        } else if (typeof module != "undefined" && typeof module.exports != "undefined") {
          module.exports = factory();
        } else {
          window["Sortable"] = factory();
        }
      })(function sortableFactory() {
        "use strict";
        if (typeof window === "undefined" || !window.document) {
          return function sortableError() {
            throw new Error("Sortable.js requires a window with a document");
          };
        }
        var dragEl, parentEl, ghostEl, cloneEl, rootEl, nextEl, lastDownEl, scrollEl, scrollParentEl, scrollCustomFn, oldIndex, newIndex, activeGroup, putSortable, autoScrolls = [], scrolling = false, awaitingDragStarted = false, ignoreNextClick = false, sortables = [], pointerElemChangedInterval, lastPointerElemX, lastPointerElemY, tapEvt, touchEvt, moved, lastTarget, lastDirection, pastFirstInvertThresh = false, isCircumstantialInvert = false, lastMode, targetMoveDistance, forRepaintDummy, realDragElRect, R_SPACE = /\s+/g, expando = "Sortable" + new Date().getTime(), win = window, document2 = win.document, parseInt2 = win.parseInt, setTimeout2 = win.setTimeout, $2 = win.jQuery || win.Zepto, Polymer = win.Polymer, captureMode = {
          capture: false,
          passive: false
        }, IE11OrLess = !!navigator.userAgent.match(/(?:Trident.*rv[ :]?11\.|msie|iemobile)/i), Edge = !!navigator.userAgent.match(/Edge/i), CSSFloatProperty = Edge || IE11OrLess ? "cssFloat" : "float", supportDraggable = "draggable" in document2.createElement("div"), supportCssPointerEvents = function() {
          if (IE11OrLess) {
            return false;
          }
          var el = document2.createElement("x");
          el.style.cssText = "pointer-events:auto";
          return el.style.pointerEvents === "auto";
        }(), _silent = false, _alignedSilent = false, abs = Math.abs, min = Math.min, savedInputChecked = [], _detectDirection = function(el, options) {
          var elCSS = _css(el), elWidth = parseInt2(elCSS.width), child1 = _getChild(el, 0, options), child2 = _getChild(el, 1, options), firstChildCSS = child1 && _css(child1), secondChildCSS = child2 && _css(child2), firstChildWidth = firstChildCSS && parseInt2(firstChildCSS.marginLeft) + parseInt2(firstChildCSS.marginRight) + _getRect(child1).width, secondChildWidth = secondChildCSS && parseInt2(secondChildCSS.marginLeft) + parseInt2(secondChildCSS.marginRight) + _getRect(child2).width;
          if (elCSS.display === "flex") {
            return elCSS.flexDirection === "column" || elCSS.flexDirection === "column-reverse" ? "vertical" : "horizontal";
          }
          if (child1 && firstChildCSS.float !== "none") {
            var touchingSideChild2 = firstChildCSS.float === "left" ? "left" : "right";
            return child2 && (secondChildCSS.clear === "both" || secondChildCSS.clear === touchingSideChild2) ? "vertical" : "horizontal";
          }
          return child1 && (firstChildCSS.display === "block" || firstChildCSS.display === "flex" || firstChildCSS.display === "table" || firstChildCSS.display === "grid" || firstChildWidth >= elWidth && elCSS[CSSFloatProperty] === "none" || child2 && elCSS[CSSFloatProperty] === "none" && firstChildWidth + secondChildWidth > elWidth) ? "vertical" : "horizontal";
        }, _detectNearestEmptySortable = function(x, y) {
          for (var i = 0; i < sortables.length; i++) {
            if (sortables[i].children.length)
              continue;
            var rect = _getRect(sortables[i]), threshold = sortables[i][expando].options.emptyInsertThreshold, insideHorizontally = x >= rect.left - threshold && x <= rect.right + threshold, insideVertically = y >= rect.top - threshold && y <= rect.bottom + threshold;
            if (insideHorizontally && insideVertically) {
              return sortables[i];
            }
          }
        }, _isClientInRowColumn = function(x, y, el, axis, options) {
          var targetRect = _getRect(el), targetS1Opp = axis === "vertical" ? targetRect.left : targetRect.top, targetS2Opp = axis === "vertical" ? targetRect.right : targetRect.bottom, mouseOnOppAxis = axis === "vertical" ? x : y;
          return targetS1Opp < mouseOnOppAxis && mouseOnOppAxis < targetS2Opp;
        }, _isElInRowColumn = function(el1, el2, axis) {
          var el1Rect = el1 === dragEl && realDragElRect || _getRect(el1), el2Rect = el2 === dragEl && realDragElRect || _getRect(el2), el1S1Opp = axis === "vertical" ? el1Rect.left : el1Rect.top, el1S2Opp = axis === "vertical" ? el1Rect.right : el1Rect.bottom, el1OppLength = axis === "vertical" ? el1Rect.width : el1Rect.height, el2S1Opp = axis === "vertical" ? el2Rect.left : el2Rect.top, el2S2Opp = axis === "vertical" ? el2Rect.right : el2Rect.bottom, el2OppLength = axis === "vertical" ? el2Rect.width : el2Rect.height;
          return el1S1Opp === el2S1Opp || el1S2Opp === el2S2Opp || el1S1Opp + el1OppLength / 2 === el2S1Opp + el2OppLength / 2;
        }, _getParentAutoScrollElement = function(el, includeSelf) {
          if (!el || !el.getBoundingClientRect)
            return win;
          var elem = el;
          var gotSelf = false;
          do {
            if (elem.clientWidth < elem.scrollWidth || elem.clientHeight < elem.scrollHeight) {
              var elemCSS = _css(elem);
              if (elem.clientWidth < elem.scrollWidth && (elemCSS.overflowX == "auto" || elemCSS.overflowX == "scroll") || elem.clientHeight < elem.scrollHeight && (elemCSS.overflowY == "auto" || elemCSS.overflowY == "scroll")) {
                if (!elem || !elem.getBoundingClientRect || elem === document2.body)
                  return win;
                if (gotSelf || includeSelf)
                  return elem;
                gotSelf = true;
              }
            }
          } while (elem = elem.parentNode);
          return win;
        }, _autoScroll = _throttle(function(evt, options, rootEl2, isFallback) {
          if (options.scroll) {
            var _this = rootEl2 ? rootEl2[expando] : window, sens = options.scrollSensitivity, speed = options.scrollSpeed, x = evt.clientX, y = evt.clientY, winWidth = window.innerWidth, winHeight = window.innerHeight, scrollThisInstance = false;
            if (scrollParentEl !== rootEl2) {
              _clearAutoScrolls();
              scrollEl = options.scroll;
              scrollCustomFn = options.scrollFn;
              if (scrollEl === true) {
                scrollEl = _getParentAutoScrollElement(rootEl2, true);
                scrollParentEl = scrollEl;
              }
            }
            var layersOut = 0;
            var currentParent = scrollEl;
            do {
              var el = currentParent, rect = _getRect(el), top = rect.top, bottom = rect.bottom, left = rect.left, right = rect.right, width = rect.width, height = rect.height, scrollWidth, scrollHeight, css, vx, vy, canScrollX, canScrollY, scrollPosX, scrollPosY;
              if (el !== win) {
                scrollWidth = el.scrollWidth;
                scrollHeight = el.scrollHeight;
                css = _css(el);
                canScrollX = width < scrollWidth && (css.overflowX === "auto" || css.overflowX === "scroll");
                canScrollY = height < scrollHeight && (css.overflowY === "auto" || css.overflowY === "scroll");
                scrollPosX = el.scrollLeft;
                scrollPosY = el.scrollTop;
              } else {
                scrollWidth = document2.documentElement.scrollWidth;
                scrollHeight = document2.documentElement.scrollHeight;
                css = _css(document2.documentElement);
                canScrollX = width < scrollWidth && (css.overflowX === "auto" || css.overflowX === "scroll" || css.overflowX === "visible");
                canScrollY = height < scrollHeight && (css.overflowY === "auto" || css.overflowY === "scroll" || css.overflowY === "visible");
                scrollPosX = document2.documentElement.scrollLeft;
                scrollPosY = document2.documentElement.scrollTop;
              }
              vx = canScrollX && (abs(right - x) <= sens && scrollPosX + width < scrollWidth) - (abs(left - x) <= sens && !!scrollPosX);
              vy = canScrollY && (abs(bottom - y) <= sens && scrollPosY + height < scrollHeight) - (abs(top - y) <= sens && !!scrollPosY);
              if (!autoScrolls[layersOut]) {
                for (var i = 0; i <= layersOut; i++) {
                  if (!autoScrolls[i]) {
                    autoScrolls[i] = {};
                  }
                }
              }
              if (autoScrolls[layersOut].vx != vx || autoScrolls[layersOut].vy != vy || autoScrolls[layersOut].el !== el) {
                autoScrolls[layersOut].el = el;
                autoScrolls[layersOut].vx = vx;
                autoScrolls[layersOut].vy = vy;
                clearInterval(autoScrolls[layersOut].pid);
                if (el && (vx != 0 || vy != 0)) {
                  scrollThisInstance = true;
                  autoScrolls[layersOut].pid = setInterval(function() {
                    if (isFallback && this.layer === 0) {
                      Sortable.active._emulateDragOver(true);
                    }
                    var scrollOffsetY = autoScrolls[this.layer].vy ? autoScrolls[this.layer].vy * speed : 0;
                    var scrollOffsetX = autoScrolls[this.layer].vx ? autoScrolls[this.layer].vx * speed : 0;
                    if (typeof scrollCustomFn === "function") {
                      if (scrollCustomFn.call(_this, scrollOffsetX, scrollOffsetY, evt, touchEvt, autoScrolls[this.layer].el) !== "continue") {
                        return;
                      }
                    }
                    if (autoScrolls[this.layer].el === win) {
                      win.scrollTo(win.pageXOffset + scrollOffsetX, win.pageYOffset + scrollOffsetY);
                    } else {
                      autoScrolls[this.layer].el.scrollTop += scrollOffsetY;
                      autoScrolls[this.layer].el.scrollLeft += scrollOffsetX;
                    }
                  }.bind({ layer: layersOut }), 24);
                }
              }
              layersOut++;
            } while (options.bubbleScroll && currentParent !== win && (currentParent = _getParentAutoScrollElement(currentParent, false)));
            scrolling = scrollThisInstance;
          }
        }, 30), _clearAutoScrolls = function() {
          autoScrolls.forEach(function(autoScroll) {
            clearInterval(autoScroll.pid);
          });
          autoScrolls = [];
        }, _prepareGroup = function(options) {
          function toFn(value, pull) {
            return function(to, from, dragEl2, evt) {
              var sameGroup = to.options.group.name && from.options.group.name && to.options.group.name === from.options.group.name;
              if (value == null && (pull || sameGroup)) {
                return true;
              } else if (value == null || value === false) {
                return false;
              } else if (pull && value === "clone") {
                return value;
              } else if (typeof value === "function") {
                return toFn(value(to, from, dragEl2, evt), pull)(to, from, dragEl2, evt);
              } else {
                var otherGroup = (pull ? to : from).options.group.name;
                return value === true || typeof value === "string" && value === otherGroup || value.join && value.indexOf(otherGroup) > -1;
              }
            };
          }
          var group = {};
          var originalGroup = options.group;
          if (!originalGroup || typeof originalGroup != "object") {
            originalGroup = { name: originalGroup };
          }
          group.name = originalGroup.name;
          group.checkPull = toFn(originalGroup.pull, true);
          group.checkPut = toFn(originalGroup.put);
          group.revertClone = originalGroup.revertClone;
          options.group = group;
        }, _checkAlignment = function(evt) {
          if (!dragEl || !dragEl.parentNode)
            return;
          dragEl.parentNode[expando] && dragEl.parentNode[expando]._computeIsAligned(evt);
        }, _isTrueParentSortable = function(el, target) {
          var trueParent = target;
          while (!trueParent[expando]) {
            trueParent = trueParent.parentNode;
          }
          return el === trueParent;
        }, _artificalBubble = function(sortable, originalEvt, method) {
          var nextParent = sortable.parentNode;
          while (nextParent && !nextParent[expando]) {
            nextParent = nextParent.parentNode;
          }
          if (nextParent) {
            nextParent[expando][method](_extend(originalEvt, {
              artificialBubble: true
            }));
          }
        }, _hideGhostForTarget = function() {
          if (!supportCssPointerEvents && ghostEl) {
            _css(ghostEl, "display", "none");
          }
        }, _unhideGhostForTarget = function() {
          if (!supportCssPointerEvents && ghostEl) {
            _css(ghostEl, "display", "");
          }
        };
        document2.addEventListener("click", function(evt) {
          if (ignoreNextClick) {
            evt.preventDefault();
            evt.stopPropagation && evt.stopPropagation();
            evt.stopImmediatePropagation && evt.stopImmediatePropagation();
            ignoreNextClick = false;
            return false;
          }
        }, true);
        var nearestEmptyInsertDetectEvent = function(evt) {
          evt = evt.touches ? evt.touches[0] : evt;
          if (dragEl) {
            var nearest = _detectNearestEmptySortable(evt.clientX, evt.clientY);
            if (nearest) {
              nearest[expando]._onDragOver({
                clientX: evt.clientX,
                clientY: evt.clientY,
                target: nearest,
                rootEl: nearest
              });
            }
          }
        };
        _on(document2, "dragover", nearestEmptyInsertDetectEvent);
        _on(document2, "mousemove", nearestEmptyInsertDetectEvent);
        _on(document2, "touchmove", nearestEmptyInsertDetectEvent);
        function Sortable(el, options) {
          if (!(el && el.nodeType && el.nodeType === 1)) {
            throw "Sortable: `el` must be HTMLElement, not " + {}.toString.call(el);
          }
          this.el = el;
          this.options = options = _extend({}, options);
          el[expando] = this;
          var defaults = {
            group: null,
            sort: true,
            disabled: false,
            store: null,
            handle: null,
            scroll: true,
            scrollSensitivity: 30,
            scrollSpeed: 10,
            bubbleScroll: true,
            draggable: /[uo]l/i.test(el.nodeName) ? ">li" : ">*",
            swapThreshold: 1,
            invertSwap: false,
            invertedSwapThreshold: null,
            removeCloneOnHide: true,
            direction: function() {
              return _detectDirection(el, this.options);
            },
            ghostClass: "sortable-ghost",
            chosenClass: "sortable-chosen",
            dragClass: "sortable-drag",
            ignore: "a, img",
            filter: null,
            preventOnFilter: true,
            animation: 0,
            easing: null,
            setData: function(dataTransfer, dragEl2) {
              dataTransfer.setData("Text", dragEl2.textContent);
            },
            dropBubble: false,
            dragoverBubble: false,
            dataIdAttr: "data-id",
            delay: 0,
            touchStartThreshold: parseInt2(window.devicePixelRatio, 10) || 1,
            forceFallback: false,
            fallbackClass: "sortable-fallback",
            fallbackOnBody: false,
            fallbackTolerance: 0,
            fallbackOffset: { x: 0, y: 0 },
            supportPointer: Sortable.supportPointer !== false && ("PointerEvent" in window || window.navigator && "msPointerEnabled" in window.navigator),
            emptyInsertThreshold: 5
          };
          for (var name in defaults) {
            !(name in options) && (options[name] = defaults[name]);
          }
          _prepareGroup(options);
          for (var fn in this) {
            if (fn.charAt(0) === "_" && typeof this[fn] === "function") {
              this[fn] = this[fn].bind(this);
            }
          }
          this.nativeDraggable = options.forceFallback ? false : supportDraggable;
          if (options.supportPointer) {
            _on(el, "pointerdown", this._onTapStart);
          } else {
            _on(el, "mousedown", this._onTapStart);
            _on(el, "touchstart", this._onTapStart);
          }
          if (this.nativeDraggable) {
            _on(el, "dragover", this);
            _on(el, "dragenter", this);
          }
          sortables.push(this.el);
          options.store && options.store.get && this.sort(options.store.get(this) || []);
        }
        Sortable.prototype = {
          constructor: Sortable,
          _computeIsAligned: function(evt) {
            var target;
            if (ghostEl && !supportCssPointerEvents) {
              _hideGhostForTarget();
              target = document2.elementFromPoint(evt.clientX, evt.clientY);
              _unhideGhostForTarget();
            } else {
              target = evt.target;
            }
            target = _closest(target, this.options.draggable, this.el, false);
            if (_alignedSilent)
              return;
            if (!dragEl || dragEl.parentNode !== this.el)
              return;
            var children = this.el.children;
            for (var i = 0; i < children.length; i++) {
              if (_closest(children[i], this.options.draggable, this.el, false) && children[i] !== target) {
                children[i].sortableMouseAligned = _isClientInRowColumn(evt.clientX, evt.clientY, children[i], this._getDirection(evt, null), this.options);
              }
            }
            if (!_closest(target, this.options.draggable, this.el, true)) {
              lastTarget = null;
            }
            _alignedSilent = true;
            setTimeout2(function() {
              _alignedSilent = false;
            }, 30);
          },
          _getDirection: function(evt, target) {
            return typeof this.options.direction === "function" ? this.options.direction.call(this, evt, target, dragEl) : this.options.direction;
          },
          _onTapStart: function(evt) {
            if (!evt.cancelable)
              return;
            var _this = this, el = this.el, options = this.options, preventOnFilter = options.preventOnFilter, type = evt.type, touch = evt.touches && evt.touches[0], target = (touch || evt).target, originalTarget = evt.target.shadowRoot && (evt.path && evt.path[0] || evt.composedPath && evt.composedPath()[0]) || target, filter = options.filter, startIndex;
            _saveInputCheckedState(el);
            if (IE11OrLess && !evt.artificialBubble && !_isTrueParentSortable(el, target)) {
              return;
            }
            if (dragEl) {
              return;
            }
            if (/mousedown|pointerdown/.test(type) && evt.button !== 0 || options.disabled) {
              return;
            }
            if (originalTarget.isContentEditable) {
              return;
            }
            target = _closest(target, options.draggable, el, false);
            if (!target) {
              if (IE11OrLess) {
                _artificalBubble(el, evt, "_onTapStart");
              }
              return;
            }
            if (lastDownEl === target) {
              return;
            }
            startIndex = _index(target, options.draggable);
            if (typeof filter === "function") {
              if (filter.call(this, evt, target, this)) {
                _dispatchEvent(_this, originalTarget, "filter", target, el, el, startIndex);
                preventOnFilter && evt.cancelable && evt.preventDefault();
                return;
              }
            } else if (filter) {
              filter = filter.split(",").some(function(criteria) {
                criteria = _closest(originalTarget, criteria.trim(), el, false);
                if (criteria) {
                  _dispatchEvent(_this, criteria, "filter", target, el, el, startIndex);
                  return true;
                }
              });
              if (filter) {
                preventOnFilter && evt.cancelable && evt.preventDefault();
                return;
              }
            }
            if (options.handle && !_closest(originalTarget, options.handle, el, false)) {
              return;
            }
            this._prepareDragStart(evt, touch, target, startIndex);
          },
          _handleAutoScroll: function(evt, fallback) {
            if (!dragEl || !this.options.scroll)
              return;
            var x = evt.clientX, y = evt.clientY, elem = document2.elementFromPoint(x, y), _this = this;
            if (fallback || Edge || IE11OrLess) {
              _autoScroll(evt, _this.options, elem, fallback);
              var ogElemScroller = _getParentAutoScrollElement(elem, true);
              if (scrolling && (!pointerElemChangedInterval || x !== lastPointerElemX || y !== lastPointerElemY)) {
                pointerElemChangedInterval && clearInterval(pointerElemChangedInterval);
                pointerElemChangedInterval = setInterval(function() {
                  if (!dragEl)
                    return;
                  var newElem = _getParentAutoScrollElement(document2.elementFromPoint(x, y), true);
                  if (newElem !== ogElemScroller) {
                    ogElemScroller = newElem;
                    _clearAutoScrolls();
                    _autoScroll(evt, _this.options, ogElemScroller, fallback);
                  }
                }, 10);
                lastPointerElemX = x;
                lastPointerElemY = y;
              }
            } else {
              if (!_this.options.bubbleScroll || _getParentAutoScrollElement(elem, true) === window) {
                _clearAutoScrolls();
                return;
              }
              _autoScroll(evt, _this.options, _getParentAutoScrollElement(elem, false), false);
            }
          },
          _prepareDragStart: function(evt, touch, target, startIndex) {
            var _this = this, el = _this.el, options = _this.options, ownerDocument = el.ownerDocument, dragStartFn;
            if (target && !dragEl && target.parentNode === el) {
              rootEl = el;
              dragEl = target;
              parentEl = dragEl.parentNode;
              nextEl = dragEl.nextSibling;
              lastDownEl = target;
              activeGroup = options.group;
              oldIndex = startIndex;
              tapEvt = {
                target: dragEl,
                clientX: (touch || evt).clientX,
                clientY: (touch || evt).clientY
              };
              this._lastX = (touch || evt).clientX;
              this._lastY = (touch || evt).clientY;
              dragEl.style["will-change"] = "all";
              dragEl.style.transition = "";
              dragEl.style.transform = "";
              dragStartFn = function() {
                _this._disableDelayedDrag();
                dragEl.draggable = _this.nativeDraggable;
                _this._triggerDragStart(evt, touch);
                _dispatchEvent(_this, rootEl, "choose", dragEl, rootEl, rootEl, oldIndex);
                _toggleClass(dragEl, options.chosenClass, true);
              };
              options.ignore.split(",").forEach(function(criteria) {
                _find(dragEl, criteria.trim(), _disableDraggable);
              });
              if (options.supportPointer) {
                _on(ownerDocument, "pointerup", _this._onDrop);
              } else {
                _on(ownerDocument, "mouseup", _this._onDrop);
                _on(ownerDocument, "touchend", _this._onDrop);
                _on(ownerDocument, "touchcancel", _this._onDrop);
              }
              if (options.delay) {
                _on(ownerDocument, "mouseup", _this._disableDelayedDrag);
                _on(ownerDocument, "touchend", _this._disableDelayedDrag);
                _on(ownerDocument, "touchcancel", _this._disableDelayedDrag);
                _on(ownerDocument, "mousemove", _this._delayedDragTouchMoveHandler);
                _on(ownerDocument, "touchmove", _this._delayedDragTouchMoveHandler);
                options.supportPointer && _on(ownerDocument, "pointermove", _this._delayedDragTouchMoveHandler);
                _this._dragStartTimer = setTimeout2(dragStartFn, options.delay);
              } else {
                dragStartFn();
              }
            }
          },
          _delayedDragTouchMoveHandler: function(e) {
            var touch = e.touches ? e.touches[0] : e;
            if (min(abs(touch.clientX - this._lastX), abs(touch.clientY - this._lastY)) >= this.options.touchStartThreshold) {
              this._disableDelayedDrag();
            }
          },
          _disableDelayedDrag: function() {
            var ownerDocument = this.el.ownerDocument;
            clearTimeout(this._dragStartTimer);
            _off(ownerDocument, "mouseup", this._disableDelayedDrag);
            _off(ownerDocument, "touchend", this._disableDelayedDrag);
            _off(ownerDocument, "touchcancel", this._disableDelayedDrag);
            _off(ownerDocument, "mousemove", this._delayedDragTouchMoveHandler);
            _off(ownerDocument, "touchmove", this._delayedDragTouchMoveHandler);
            _off(ownerDocument, "pointermove", this._delayedDragTouchMoveHandler);
          },
          _triggerDragStart: function(evt, touch) {
            touch = touch || (evt.pointerType == "touch" ? evt : null);
            if (!this.nativeDraggable || touch) {
              if (this.options.supportPointer) {
                _on(document2, "pointermove", this._onTouchMove);
              } else if (touch) {
                _on(document2, "touchmove", this._onTouchMove);
              } else {
                _on(document2, "mousemove", this._onTouchMove);
              }
            } else {
              _on(dragEl, "dragend", this);
              _on(rootEl, "dragstart", this._onDragStart);
            }
            try {
              if (document2.selection) {
                _nextTick(function() {
                  document2.selection.empty();
                });
              } else {
                window.getSelection().removeAllRanges();
              }
            } catch (err) {
            }
          },
          _dragStarted: function(fallback) {
            awaitingDragStarted = false;
            if (rootEl && dragEl) {
              if (this.nativeDraggable) {
                _on(document2, "dragover", this._handleAutoScroll);
                _on(document2, "dragover", _checkAlignment);
              }
              var options = this.options;
              !fallback && _toggleClass(dragEl, options.dragClass, false);
              _toggleClass(dragEl, options.ghostClass, true);
              _css(dragEl, "transform", "");
              Sortable.active = this;
              fallback && this._appendGhost();
              _dispatchEvent(this, rootEl, "start", dragEl, rootEl, rootEl, oldIndex);
            } else {
              this._nulling();
            }
          },
          _emulateDragOver: function(bypassLastTouchCheck) {
            if (touchEvt) {
              if (this._lastX === touchEvt.clientX && this._lastY === touchEvt.clientY && !bypassLastTouchCheck) {
                return;
              }
              this._lastX = touchEvt.clientX;
              this._lastY = touchEvt.clientY;
              _hideGhostForTarget();
              var target = document2.elementFromPoint(touchEvt.clientX, touchEvt.clientY);
              var parent = target;
              while (target && target.shadowRoot) {
                target = target.shadowRoot.elementFromPoint(touchEvt.clientX, touchEvt.clientY);
                parent = target;
              }
              if (parent) {
                do {
                  if (parent[expando]) {
                    var inserted;
                    inserted = parent[expando]._onDragOver({
                      clientX: touchEvt.clientX,
                      clientY: touchEvt.clientY,
                      target,
                      rootEl: parent
                    });
                    if (inserted && !this.options.dragoverBubble) {
                      break;
                    }
                  }
                  target = parent;
                } while (parent = parent.parentNode);
              }
              dragEl.parentNode[expando]._computeIsAligned(touchEvt);
              _unhideGhostForTarget();
            }
          },
          _onTouchMove: function(evt) {
            if (tapEvt) {
              var options = this.options, fallbackTolerance = options.fallbackTolerance, fallbackOffset = options.fallbackOffset, touch = evt.touches ? evt.touches[0] : evt, matrix = ghostEl && _matrix(ghostEl), scaleX = ghostEl && matrix && matrix.a, scaleY = ghostEl && matrix && matrix.d, dx = (touch.clientX - tapEvt.clientX + fallbackOffset.x) / (scaleX ? scaleX : 1), dy = (touch.clientY - tapEvt.clientY + fallbackOffset.y) / (scaleY ? scaleY : 1), translate3d = evt.touches ? "translate3d(" + dx + "px," + dy + "px,0)" : "translate(" + dx + "px," + dy + "px)";
              if (!Sortable.active && !awaitingDragStarted) {
                if (fallbackTolerance && min(abs(touch.clientX - this._lastX), abs(touch.clientY - this._lastY)) < fallbackTolerance) {
                  return;
                }
                this._onDragStart(evt, true);
              }
              this._handleAutoScroll(touch, true);
              moved = true;
              touchEvt = touch;
              _css(ghostEl, "webkitTransform", translate3d);
              _css(ghostEl, "mozTransform", translate3d);
              _css(ghostEl, "msTransform", translate3d);
              _css(ghostEl, "transform", translate3d);
              evt.cancelable && evt.preventDefault();
            }
          },
          _appendGhost: function() {
            if (!ghostEl) {
              var rect = _getRect(dragEl, this.options.fallbackOnBody ? document2.body : rootEl, true), css = _css(dragEl), options = this.options;
              ghostEl = dragEl.cloneNode(true);
              _toggleClass(ghostEl, options.ghostClass, false);
              _toggleClass(ghostEl, options.fallbackClass, true);
              _toggleClass(ghostEl, options.dragClass, true);
              _css(ghostEl, "box-sizing", "border-box");
              _css(ghostEl, "margin", 0);
              _css(ghostEl, "top", rect.top);
              _css(ghostEl, "left", rect.left);
              _css(ghostEl, "width", rect.width);
              _css(ghostEl, "height", rect.height);
              _css(ghostEl, "opacity", "0.8");
              _css(ghostEl, "position", "fixed");
              _css(ghostEl, "zIndex", "100000");
              _css(ghostEl, "pointerEvents", "none");
              options.fallbackOnBody && document2.body.appendChild(ghostEl) || rootEl.appendChild(ghostEl);
            }
          },
          _onDragStart: function(evt, fallback) {
            var _this = this;
            var dataTransfer = evt.dataTransfer;
            var options = _this.options;
            cloneEl = _clone(dragEl);
            cloneEl.draggable = false;
            cloneEl.style["will-change"] = "";
            this._hideClone();
            _toggleClass(cloneEl, _this.options.chosenClass, false);
            _this._cloneId = _nextTick(function() {
              if (!_this.options.removeCloneOnHide) {
                rootEl.insertBefore(cloneEl, dragEl);
              }
              _dispatchEvent(_this, rootEl, "clone", dragEl);
            });
            !fallback && _toggleClass(dragEl, options.dragClass, true);
            if (fallback) {
              ignoreNextClick = true;
              _this._loopId = setInterval(_this._emulateDragOver, 50);
            } else {
              _off(document2, "mouseup", _this._onDrop);
              _off(document2, "touchend", _this._onDrop);
              _off(document2, "touchcancel", _this._onDrop);
              if (dataTransfer) {
                dataTransfer.effectAllowed = "move";
                options.setData && options.setData.call(_this, dataTransfer, dragEl);
              }
              _on(document2, "drop", _this);
              _css(dragEl, "transform", "translateZ(0)");
            }
            awaitingDragStarted = true;
            _this._dragStartId = _nextTick(_this._dragStarted.bind(_this, fallback));
            _on(document2, "selectstart", _this);
          },
          _onDragOver: function(evt) {
            var el = this.el, target = evt.target, dragRect, targetRect, revert, options = this.options, group = options.group, activeSortable = Sortable.active, isOwner = activeGroup === group, canSort = options.sort, _this = this;
            if (_silent)
              return;
            if (IE11OrLess && !evt.rootEl && !evt.artificialBubble && !_isTrueParentSortable(el, target)) {
              return;
            }
            function completed() {
              if (activeSortable) {
                _toggleClass(dragEl, putSortable ? putSortable.options.ghostClass : activeSortable.options.ghostClass, false);
                _toggleClass(dragEl, options.ghostClass, true);
              }
              if (putSortable !== _this && _this !== Sortable.active) {
                putSortable = _this;
              } else if (_this === Sortable.active) {
                putSortable = null;
              }
              if (target === dragEl && !dragEl.animated || target === el && !target.animated) {
                lastTarget = null;
              }
              if (!options.dragoverBubble && !evt.rootEl && target !== document2) {
                _this._handleAutoScroll(evt);
                dragEl.parentNode[expando]._computeIsAligned(evt);
              }
              !options.dragoverBubble && evt.stopPropagation && evt.stopPropagation();
              return true;
            }
            function changed() {
              _dispatchEvent(_this, rootEl, "change", target, el, rootEl, oldIndex, _index(dragEl, options.draggable), evt);
            }
            if (evt.preventDefault !== void 0) {
              evt.cancelable && evt.preventDefault();
            }
            moved = true;
            target = _closest(target, options.draggable, el, true);
            if (!!_closest(evt.target, null, dragEl, true) || target.animated) {
              return completed();
            }
            if (target !== dragEl) {
              ignoreNextClick = false;
            }
            if (activeSortable && !options.disabled && (isOwner ? canSort || (revert = !rootEl.contains(dragEl)) : putSortable === this || (this.lastPutMode = activeGroup.checkPull(this, activeSortable, dragEl, evt)) && group.checkPut(this, activeSortable, dragEl, evt))) {
              var axis = this._getDirection(evt, target);
              dragRect = _getRect(dragEl);
              if (revert) {
                this._hideClone();
                parentEl = rootEl;
                if (nextEl) {
                  rootEl.insertBefore(dragEl, nextEl);
                } else {
                  rootEl.appendChild(dragEl);
                }
                return completed();
              }
              if (el.children.length === 0 || el.children[0] === ghostEl || _ghostIsLast(evt, axis, el) && !dragEl.animated) {
                if (el.children.length !== 0 && el.children[0] !== ghostEl && el === evt.target) {
                  target = _lastChild(el);
                }
                if (target) {
                  targetRect = _getRect(target);
                }
                if (isOwner) {
                  activeSortable._hideClone();
                } else {
                  activeSortable._showClone(this);
                }
                if (_onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt, !!target) !== false) {
                  el.appendChild(dragEl);
                  parentEl = el;
                  realDragElRect = null;
                  changed();
                  this._animate(dragRect, dragEl);
                  target && this._animate(targetRect, target);
                  return completed();
                }
              } else if (target && target !== dragEl && target.parentNode === el) {
                var direction = 0, targetBeforeFirstSwap, aligned = target.sortableMouseAligned, differentLevel = dragEl.parentNode !== el, scrolledPastTop = _isScrolledPast(target, axis === "vertical" ? "top" : "left");
                if (lastTarget !== target) {
                  lastMode = null;
                  targetBeforeFirstSwap = _getRect(target)[axis === "vertical" ? "top" : "left"];
                  pastFirstInvertThresh = false;
                }
                if (_isElInRowColumn(dragEl, target, axis) && aligned || differentLevel || scrolledPastTop || options.invertSwap || lastMode === "insert" || lastMode === "swap") {
                  if (lastMode !== "swap") {
                    isCircumstantialInvert = options.invertSwap || differentLevel || scrolling || scrolledPastTop;
                  }
                  direction = _getSwapDirection(evt, target, axis, options.swapThreshold, options.invertedSwapThreshold == null ? options.swapThreshold : options.invertedSwapThreshold, isCircumstantialInvert, lastTarget === target);
                  lastMode = "swap";
                } else {
                  direction = _getInsertDirection(target, options);
                  lastMode = "insert";
                }
                if (direction === 0)
                  return completed();
                realDragElRect = null;
                lastTarget = target;
                lastDirection = direction;
                targetRect = _getRect(target);
                var nextSibling = target.nextElementSibling, after = false;
                after = direction === 1;
                var moveVector = _onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt, after);
                if (moveVector !== false) {
                  if (moveVector === 1 || moveVector === -1) {
                    after = moveVector === 1;
                  }
                  _silent = true;
                  setTimeout2(_unsilent, 30);
                  if (isOwner) {
                    activeSortable._hideClone();
                  } else {
                    activeSortable._showClone(this);
                  }
                  if (after && !nextSibling) {
                    el.appendChild(dragEl);
                  } else {
                    target.parentNode.insertBefore(dragEl, after ? nextSibling : target);
                  }
                  parentEl = dragEl.parentNode;
                  if (targetBeforeFirstSwap !== void 0 && !isCircumstantialInvert) {
                    targetMoveDistance = abs(targetBeforeFirstSwap - _getRect(target)[axis === "vertical" ? "top" : "left"]);
                  }
                  changed();
                  !differentLevel && this._animate(targetRect, target);
                  this._animate(dragRect, dragEl);
                  return completed();
                }
              }
              if (el.contains(dragEl)) {
                return completed();
              }
            }
            if (IE11OrLess && !evt.rootEl) {
              _artificalBubble(el, evt, "_onDragOver");
            }
            return false;
          },
          _animate: function(prevRect, target) {
            var ms = this.options.animation;
            if (ms) {
              var currentRect = _getRect(target);
              if (target === dragEl) {
                realDragElRect = currentRect;
              }
              if (prevRect.nodeType === 1) {
                prevRect = _getRect(prevRect);
              }
              if (prevRect.left + prevRect.width / 2 !== currentRect.left + currentRect.width / 2 || prevRect.top + prevRect.height / 2 !== currentRect.top + currentRect.height / 2) {
                var matrix = _matrix(this.el), scaleX = matrix && matrix.a, scaleY = matrix && matrix.d;
                _css(target, "transition", "none");
                _css(target, "transform", "translate3d(" + (prevRect.left - currentRect.left) / (scaleX ? scaleX : 1) + "px," + (prevRect.top - currentRect.top) / (scaleY ? scaleY : 1) + "px,0)");
                forRepaintDummy = target.offsetWidth;
                _css(target, "transition", "transform " + ms + "ms" + (this.options.easing ? " " + this.options.easing : ""));
                _css(target, "transform", "translate3d(0,0,0)");
              }
              typeof target.animated === "number" && clearTimeout(target.animated);
              target.animated = setTimeout2(function() {
                _css(target, "transition", "");
                _css(target, "transform", "");
                target.animated = false;
              }, ms);
            }
          },
          _offUpEvents: function() {
            var ownerDocument = this.el.ownerDocument;
            _off(document2, "touchmove", this._onTouchMove);
            _off(document2, "pointermove", this._onTouchMove);
            _off(ownerDocument, "mouseup", this._onDrop);
            _off(ownerDocument, "touchend", this._onDrop);
            _off(ownerDocument, "pointerup", this._onDrop);
            _off(ownerDocument, "touchcancel", this._onDrop);
            _off(document2, "selectstart", this);
          },
          _onDrop: function(evt) {
            var el = this.el, options = this.options;
            awaitingDragStarted = false;
            scrolling = false;
            isCircumstantialInvert = false;
            pastFirstInvertThresh = false;
            clearInterval(this._loopId);
            clearInterval(pointerElemChangedInterval);
            _clearAutoScrolls();
            _cancelThrottle();
            clearTimeout(this._dragStartTimer);
            _cancelNextTick(this._cloneId);
            _cancelNextTick(this._dragStartId);
            _off(document2, "mousemove", this._onTouchMove);
            if (this.nativeDraggable) {
              _off(document2, "drop", this);
              _off(el, "dragstart", this._onDragStart);
              _off(document2, "dragover", this._handleAutoScroll);
              _off(document2, "dragover", _checkAlignment);
            }
            this._offUpEvents();
            if (evt) {
              if (moved) {
                evt.cancelable && evt.preventDefault();
                !options.dropBubble && evt.stopPropagation();
              }
              ghostEl && ghostEl.parentNode && ghostEl.parentNode.removeChild(ghostEl);
              if (rootEl === parentEl || putSortable && putSortable.lastPutMode !== "clone") {
                cloneEl && cloneEl.parentNode && cloneEl.parentNode.removeChild(cloneEl);
              }
              if (dragEl) {
                if (this.nativeDraggable) {
                  _off(dragEl, "dragend", this);
                }
                _disableDraggable(dragEl);
                dragEl.style["will-change"] = "";
                _toggleClass(dragEl, putSortable ? putSortable.options.ghostClass : this.options.ghostClass, false);
                _toggleClass(dragEl, this.options.chosenClass, false);
                _dispatchEvent(this, rootEl, "unchoose", dragEl, parentEl, rootEl, oldIndex, null, evt);
                if (rootEl !== parentEl) {
                  newIndex = _index(dragEl, options.draggable);
                  if (newIndex >= 0) {
                    _dispatchEvent(null, parentEl, "add", dragEl, parentEl, rootEl, oldIndex, newIndex, evt);
                    _dispatchEvent(this, rootEl, "remove", dragEl, parentEl, rootEl, oldIndex, newIndex, evt);
                    _dispatchEvent(null, parentEl, "sort", dragEl, parentEl, rootEl, oldIndex, newIndex, evt);
                    _dispatchEvent(this, rootEl, "sort", dragEl, parentEl, rootEl, oldIndex, newIndex, evt);
                  }
                  putSortable && putSortable.save();
                } else {
                  if (dragEl.nextSibling !== nextEl) {
                    newIndex = _index(dragEl, options.draggable);
                    if (newIndex >= 0) {
                      _dispatchEvent(this, rootEl, "update", dragEl, parentEl, rootEl, oldIndex, newIndex, evt);
                      _dispatchEvent(this, rootEl, "sort", dragEl, parentEl, rootEl, oldIndex, newIndex, evt);
                    }
                  }
                }
                if (Sortable.active) {
                  if (newIndex == null || newIndex === -1) {
                    newIndex = oldIndex;
                  }
                  _dispatchEvent(this, rootEl, "end", dragEl, parentEl, rootEl, oldIndex, newIndex, evt);
                  this.save();
                }
              }
            }
            this._nulling();
          },
          _nulling: function() {
            rootEl = dragEl = parentEl = ghostEl = nextEl = cloneEl = lastDownEl = scrollEl = scrollParentEl = autoScrolls.length = pointerElemChangedInterval = lastPointerElemX = lastPointerElemY = tapEvt = touchEvt = moved = newIndex = oldIndex = lastTarget = lastDirection = forRepaintDummy = realDragElRect = putSortable = activeGroup = Sortable.active = null;
            savedInputChecked.forEach(function(el) {
              el.checked = true;
            });
            savedInputChecked.length = 0;
          },
          handleEvent: function(evt) {
            switch (evt.type) {
              case "drop":
              case "dragend":
                this._onDrop(evt);
                break;
              case "dragenter":
              case "dragover":
                if (dragEl) {
                  this._onDragOver(evt);
                  _globalDragOver(evt);
                }
                break;
              case "selectstart":
                evt.preventDefault();
                break;
            }
          },
          toArray: function() {
            var order = [], el, children = this.el.children, i = 0, n = children.length, options = this.options;
            for (; i < n; i++) {
              el = children[i];
              if (_closest(el, options.draggable, this.el, false)) {
                order.push(el.getAttribute(options.dataIdAttr) || _generateId(el));
              }
            }
            return order;
          },
          sort: function(order) {
            var items = {}, rootEl2 = this.el;
            this.toArray().forEach(function(id, i) {
              var el = rootEl2.children[i];
              if (_closest(el, this.options.draggable, rootEl2, false)) {
                items[id] = el;
              }
            }, this);
            order.forEach(function(id) {
              if (items[id]) {
                rootEl2.removeChild(items[id]);
                rootEl2.appendChild(items[id]);
              }
            });
          },
          save: function() {
            var store = this.options.store;
            store && store.set && store.set(this);
          },
          closest: function(el, selector) {
            return _closest(el, selector || this.options.draggable, this.el, false);
          },
          option: function(name, value) {
            var options = this.options;
            if (value === void 0) {
              return options[name];
            } else {
              options[name] = value;
              if (name === "group") {
                _prepareGroup(options);
              }
            }
          },
          destroy: function() {
            var el = this.el;
            el[expando] = null;
            _off(el, "mousedown", this._onTapStart);
            _off(el, "touchstart", this._onTapStart);
            _off(el, "pointerdown", this._onTapStart);
            if (this.nativeDraggable) {
              _off(el, "dragover", this);
              _off(el, "dragenter", this);
            }
            Array.prototype.forEach.call(el.querySelectorAll("[draggable]"), function(el2) {
              el2.removeAttribute("draggable");
            });
            this._onDrop();
            sortables.splice(sortables.indexOf(this.el), 1);
            this.el = el = null;
          },
          _hideClone: function() {
            if (!cloneEl.cloneHidden) {
              _css(cloneEl, "display", "none");
              cloneEl.cloneHidden = true;
              if (cloneEl.parentNode && this.options.removeCloneOnHide) {
                cloneEl.parentNode.removeChild(cloneEl);
              }
            }
          },
          _showClone: function(putSortable2) {
            if (putSortable2.lastPutMode !== "clone") {
              this._hideClone();
              return;
            }
            if (cloneEl.cloneHidden) {
              if (rootEl.contains(dragEl) && !this.options.group.revertClone) {
                rootEl.insertBefore(cloneEl, dragEl);
              } else if (nextEl) {
                rootEl.insertBefore(cloneEl, nextEl);
              } else {
                rootEl.appendChild(cloneEl);
              }
              if (this.options.group.revertClone) {
                this._animate(dragEl, cloneEl);
              }
              _css(cloneEl, "display", "");
              cloneEl.cloneHidden = false;
            }
          }
        };
        function _closest(el, selector, ctx, includeCTX) {
          if (el) {
            ctx = ctx || document2;
            do {
              if (selector != null && (selector[0] === ">" && el.parentNode === ctx && _matches(el, selector.substring(1)) || _matches(el, selector)) || includeCTX && el === ctx) {
                return el;
              }
              if (el === ctx)
                break;
            } while (el = _getParentOrHost(el));
          }
          return null;
        }
        function _getParentOrHost(el) {
          return el.host && el !== document2 && el.host.nodeType ? el.host : el.parentNode;
        }
        function _globalDragOver(evt) {
          if (evt.dataTransfer) {
            evt.dataTransfer.dropEffect = "move";
          }
          evt.cancelable && evt.preventDefault();
        }
        function _on(el, event, fn) {
          el.addEventListener(event, fn, captureMode);
        }
        function _off(el, event, fn) {
          el.removeEventListener(event, fn, captureMode);
        }
        function _toggleClass(el, name, state) {
          if (el && name) {
            if (el.classList) {
              el.classList[state ? "add" : "remove"](name);
            } else {
              var className = (" " + el.className + " ").replace(R_SPACE, " ").replace(" " + name + " ", " ");
              el.className = (className + (state ? " " + name : "")).replace(R_SPACE, " ");
            }
          }
        }
        function _css(el, prop, val) {
          var style = el && el.style;
          if (style) {
            if (val === void 0) {
              if (document2.defaultView && document2.defaultView.getComputedStyle) {
                val = document2.defaultView.getComputedStyle(el, "");
              } else if (el.currentStyle) {
                val = el.currentStyle;
              }
              return prop === void 0 ? val : val[prop];
            } else {
              if (!(prop in style) && prop.indexOf("webkit") === -1) {
                prop = "-webkit-" + prop;
              }
              style[prop] = val + (typeof val === "string" ? "" : "px");
            }
          }
        }
        function _matrix(el) {
          var appliedTransforms = "";
          do {
            var transform = _css(el, "transform");
            if (transform && transform !== "none") {
              appliedTransforms = transform + " " + appliedTransforms;
            }
          } while (el = el.parentNode);
          if (window.DOMMatrix) {
            return new DOMMatrix(appliedTransforms);
          } else if (window.WebKitCSSMatrix) {
            return new WebKitCSSMatrix(appliedTransforms);
          } else if (window.CSSMatrix) {
            return new CSSMatrix(appliedTransforms);
          }
        }
        function _find(ctx, tagName, iterator) {
          if (ctx) {
            var list = ctx.getElementsByTagName(tagName), i = 0, n = list.length;
            if (iterator) {
              for (; i < n; i++) {
                iterator(list[i], i);
              }
            }
            return list;
          }
          return [];
        }
        function _dispatchEvent(sortable, rootEl2, name, targetEl, toEl, fromEl, startIndex, newIndex2, originalEvt) {
          sortable = sortable || rootEl2[expando];
          var evt, options = sortable.options, onName = "on" + name.charAt(0).toUpperCase() + name.substr(1);
          if (window.CustomEvent && !IE11OrLess && !Edge) {
            evt = new CustomEvent(name, {
              bubbles: true,
              cancelable: true
            });
          } else {
            evt = document2.createEvent("Event");
            evt.initEvent(name, true, true);
          }
          evt.to = toEl || rootEl2;
          evt.from = fromEl || rootEl2;
          evt.item = targetEl || rootEl2;
          evt.clone = cloneEl;
          evt.oldIndex = startIndex;
          evt.newIndex = newIndex2;
          evt.originalEvent = originalEvt;
          if (rootEl2) {
            rootEl2.dispatchEvent(evt);
          }
          if (options[onName]) {
            options[onName].call(sortable, evt);
          }
        }
        function _onMove(fromEl, toEl, dragEl2, dragRect, targetEl, targetRect, originalEvt, willInsertAfter) {
          var evt, sortable = fromEl[expando], onMoveFn = sortable.options.onMove, retVal;
          if (window.CustomEvent && !IE11OrLess && !Edge) {
            evt = new CustomEvent("move", {
              bubbles: true,
              cancelable: true
            });
          } else {
            evt = document2.createEvent("Event");
            evt.initEvent("move", true, true);
          }
          evt.to = toEl;
          evt.from = fromEl;
          evt.dragged = dragEl2;
          evt.draggedRect = dragRect;
          evt.related = targetEl || toEl;
          evt.relatedRect = targetRect || _getRect(toEl);
          evt.willInsertAfter = willInsertAfter;
          evt.originalEvent = originalEvt;
          fromEl.dispatchEvent(evt);
          if (onMoveFn) {
            retVal = onMoveFn.call(sortable, evt, originalEvt);
          }
          return retVal;
        }
        function _disableDraggable(el) {
          el.draggable = false;
        }
        function _unsilent() {
          _silent = false;
        }
        function _getChild(el, childNum, options) {
          var currentChild = 0, i = 0, children = el.children;
          while (i < children.length) {
            if (children[i].style.display !== "none" && children[i] !== ghostEl && children[i] !== dragEl && _closest(children[i], options.draggable, el, false)) {
              if (currentChild === childNum) {
                return children[i];
              }
              currentChild++;
            }
            i++;
          }
          return null;
        }
        function _lastChild(el) {
          var last = el.lastElementChild;
          while (last === ghostEl || last.style.display === "none") {
            last = last.previousElementSibling;
            if (!last)
              break;
          }
          return last || null;
        }
        function _ghostIsLast(evt, axis, el) {
          var elRect = _getRect(_lastChild(el)), mouseOnAxis = axis === "vertical" ? evt.clientY : evt.clientX, mouseOnOppAxis = axis === "vertical" ? evt.clientX : evt.clientY, targetS2 = axis === "vertical" ? elRect.bottom : elRect.right, targetS1Opp = axis === "vertical" ? elRect.left : elRect.top, targetS2Opp = axis === "vertical" ? elRect.right : elRect.bottom, spacer = 10;
          return axis === "vertical" ? mouseOnOppAxis > targetS2Opp + spacer || mouseOnOppAxis <= targetS2Opp && mouseOnAxis > targetS2 && mouseOnOppAxis >= targetS1Opp : mouseOnAxis > targetS2 && mouseOnOppAxis > targetS1Opp || mouseOnAxis <= targetS2 && mouseOnOppAxis > targetS2Opp + spacer;
        }
        function _getSwapDirection(evt, target, axis, swapThreshold, invertedSwapThreshold, invertSwap, isLastTarget) {
          var targetRect = _getRect(target), mouseOnAxis = axis === "vertical" ? evt.clientY : evt.clientX, targetLength = axis === "vertical" ? targetRect.height : targetRect.width, targetS1 = axis === "vertical" ? targetRect.top : targetRect.left, targetS2 = axis === "vertical" ? targetRect.bottom : targetRect.right, dragRect = _getRect(dragEl), invert = false;
          if (!invertSwap) {
            if (isLastTarget && targetMoveDistance < targetLength * swapThreshold) {
              if (!pastFirstInvertThresh && (lastDirection === 1 ? mouseOnAxis > targetS1 + targetLength * invertedSwapThreshold / 2 : mouseOnAxis < targetS2 - targetLength * invertedSwapThreshold / 2)) {
                pastFirstInvertThresh = true;
              }
              if (!pastFirstInvertThresh) {
                var dragS1 = axis === "vertical" ? dragRect.top : dragRect.left, dragS2 = axis === "vertical" ? dragRect.bottom : dragRect.right;
                if (lastDirection === 1 ? mouseOnAxis < targetS1 + targetMoveDistance : mouseOnAxis > targetS2 - targetMoveDistance) {
                  return lastDirection * -1;
                }
              } else {
                invert = true;
              }
            } else {
              if (mouseOnAxis > targetS1 + targetLength * (1 - swapThreshold) / 2 && mouseOnAxis < targetS2 - targetLength * (1 - swapThreshold) / 2) {
                return mouseOnAxis > targetS1 + targetLength / 2 ? -1 : 1;
              }
            }
          }
          invert = invert || invertSwap;
          if (invert) {
            if (mouseOnAxis < targetS1 + targetLength * invertedSwapThreshold / 2 || mouseOnAxis > targetS2 - targetLength * invertedSwapThreshold / 2) {
              return mouseOnAxis > targetS1 + targetLength / 2 ? 1 : -1;
            }
          }
          return 0;
        }
        function _getInsertDirection(target, options) {
          var dragElIndex = _index(dragEl, options.draggable), targetIndex = _index(target, options.draggable);
          if (dragElIndex < targetIndex) {
            return 1;
          } else {
            return -1;
          }
        }
        function _generateId(el) {
          var str = el.tagName + el.className + el.src + el.href + el.textContent, i = str.length, sum = 0;
          while (i--) {
            sum += str.charCodeAt(i);
          }
          return sum.toString(36);
        }
        function _index(el, selector) {
          var index = 0;
          if (!el || !el.parentNode) {
            return -1;
          }
          while (el && (el = el.previousElementSibling)) {
            if (el.nodeName.toUpperCase() !== "TEMPLATE" && el !== cloneEl) {
              index++;
            }
          }
          return index;
        }
        function _matches(el, selector) {
          if (el) {
            try {
              if (el.matches) {
                return el.matches(selector);
              } else if (el.msMatchesSelector) {
                return el.msMatchesSelector(selector);
              } else if (el.webkitMatchesSelector) {
                return el.webkitMatchesSelector(selector);
              }
            } catch (_) {
              return false;
            }
          }
          return false;
        }
        var _throttleTimeout;
        function _throttle(callback, ms) {
          return function() {
            if (!_throttleTimeout) {
              var args = arguments, _this = this;
              _throttleTimeout = setTimeout2(function() {
                if (args.length === 1) {
                  callback.call(_this, args[0]);
                } else {
                  callback.apply(_this, args);
                }
                _throttleTimeout = void 0;
              }, ms);
            }
          };
        }
        function _cancelThrottle() {
          clearTimeout(_throttleTimeout);
          _throttleTimeout = void 0;
        }
        function _extend(dst, src) {
          if (dst && src) {
            for (var key in src) {
              if (src.hasOwnProperty(key)) {
                dst[key] = src[key];
              }
            }
          }
          return dst;
        }
        function _clone(el) {
          if (Polymer && Polymer.dom) {
            return Polymer.dom(el).cloneNode(true);
          } else if ($2) {
            return $2(el).clone(true)[0];
          } else {
            return el.cloneNode(true);
          }
        }
        function _saveInputCheckedState(root) {
          savedInputChecked.length = 0;
          var inputs = root.getElementsByTagName("input");
          var idx = inputs.length;
          while (idx--) {
            var el = inputs[idx];
            el.checked && savedInputChecked.push(el);
          }
        }
        function _nextTick(fn) {
          return setTimeout2(fn, 0);
        }
        function _cancelNextTick(id) {
          return clearTimeout(id);
        }
        function _getRect(el, container, adjustForTransform) {
          if (!el.getBoundingClientRect && el !== win)
            return;
          var elRect, top, left, bottom, right, height, width;
          if (el !== win) {
            elRect = el.getBoundingClientRect();
            top = elRect.top;
            left = elRect.left;
            bottom = elRect.bottom;
            right = elRect.right;
            height = elRect.height;
            width = elRect.width;
          } else {
            top = 0;
            left = 0;
            bottom = window.innerHeight;
            right = window.innerWidth;
            height = window.innerHeight;
            width = window.innerWidth;
          }
          if (adjustForTransform && el !== win) {
            container = container || el.parentNode;
            if (!IE11OrLess) {
              do {
                if (container && container.getBoundingClientRect && _css(container, "transform") !== "none") {
                  var containerRect = container.getBoundingClientRect();
                  top -= containerRect.top + parseInt2(_css(container, "border-top-width"));
                  left -= containerRect.left + parseInt2(_css(container, "border-left-width"));
                  bottom = top + elRect.height;
                  right = left + elRect.width;
                  break;
                }
              } while (container = container.parentNode);
            }
            var matrix = _matrix(el), scaleX = matrix && matrix.a, scaleY = matrix && matrix.d;
            if (matrix) {
              top /= scaleY;
              left /= scaleX;
              width /= scaleX;
              height /= scaleY;
              bottom = top + height;
              right = left + width;
            }
          }
          return {
            top,
            left,
            bottom,
            right,
            width,
            height
          };
        }
        function _isScrolledPast(el, side) {
          var parent = _getParentAutoScrollElement(parent, true), elSide = _getRect(el)[side];
          while (parent) {
            var parentSide = _getRect(parent)[side], visible;
            if (side === "top" || side === "left") {
              visible = elSide >= parentSide;
            } else {
              visible = elSide <= parentSide;
            }
            if (!visible)
              return true;
            if (parent === win)
              break;
            parent = _getParentAutoScrollElement(parent, false);
          }
          return false;
        }
        _on(document2, "touchmove", function(evt) {
          if ((Sortable.active || awaitingDragStarted) && evt.cancelable) {
            evt.preventDefault();
          }
        });
        Sortable.utils = {
          on: _on,
          off: _off,
          css: _css,
          find: _find,
          is: function(el, selector) {
            return !!_closest(el, selector, el, false);
          },
          extend: _extend,
          throttle: _throttle,
          closest: _closest,
          toggleClass: _toggleClass,
          clone: _clone,
          index: _index,
          nextTick: _nextTick,
          cancelNextTick: _cancelNextTick,
          detectDirection: _detectDirection,
          getChild: _getChild
        };
        Sortable.create = function(el, options) {
          return new Sortable(el, options);
        };
        Sortable.version = "1.8.3";
        return Sortable;
      });
    }
  });

  // node_modules/frappe-datatable/dist/frappe-datatable.cjs.js
  var require_frappe_datatable_cjs = __commonJS({
    "node_modules/frappe-datatable/dist/frappe-datatable.cjs.js"(exports, module) {
      "use strict";
      function _interopDefault(ex) {
        return ex && typeof ex === "object" && "default" in ex ? ex["default"] : ex;
      }
      var Sortable = _interopDefault(require_Sortable());
      function $2(expr, con) {
        return typeof expr === "string" ? (con || document).querySelector(expr) : expr || null;
      }
      $2.each = (expr, con) => {
        return typeof expr === "string" ? Array.from((con || document).querySelectorAll(expr)) : expr || null;
      };
      $2.create = (tag, o) => {
        let element = document.createElement(tag);
        for (let i in o) {
          let val = o[i];
          if (i === "inside") {
            $2(val).appendChild(element);
          } else if (i === "around") {
            let ref = $2(val);
            ref.parentNode.insertBefore(element, ref);
            element.appendChild(ref);
          } else if (i === "styles") {
            if (typeof val === "object") {
              Object.keys(val).map((prop) => {
                element.style[prop] = val[prop];
              });
            }
          } else if (i in element) {
            element[i] = val;
          } else {
            element.setAttribute(i, val);
          }
        }
        return element;
      };
      $2.on = (element, event, selector, callback) => {
        if (!callback) {
          callback = selector;
          $2.bind(element, event, callback);
        } else {
          $2.delegate(element, event, selector, callback);
        }
      };
      $2.off = (element, event, handler) => {
        element.removeEventListener(event, handler);
      };
      $2.bind = (element, event, callback) => {
        event.split(/\s+/).forEach(function(event2) {
          element.addEventListener(event2, callback);
        });
      };
      $2.delegate = (element, event, selector, callback) => {
        element.addEventListener(event, function(e) {
          const delegatedTarget = e.target.closest(selector);
          if (delegatedTarget) {
            e.delegatedTarget = delegatedTarget;
            callback.call(this, e, delegatedTarget);
          }
        });
      };
      $2.unbind = (element, o) => {
        if (element) {
          for (let event in o) {
            let callback = o[event];
            event.split(/\s+/).forEach(function(event2) {
              element.removeEventListener(event2, callback);
            });
          }
        }
      };
      $2.fire = (target, type, properties) => {
        let evt = document.createEvent("HTMLEvents");
        evt.initEvent(type, true, true);
        for (let j in properties) {
          evt[j] = properties[j];
        }
        return target.dispatchEvent(evt);
      };
      $2.data = (element, attrs) => {
        if (!attrs) {
          return element.dataset;
        }
        for (const attr in attrs) {
          element.dataset[attr] = attrs[attr];
        }
      };
      $2.style = (elements, styleMap) => {
        if (typeof styleMap === "string") {
          return $2.getStyle(elements, styleMap);
        }
        if (!Array.isArray(elements)) {
          elements = [elements];
        }
        elements.map((element) => {
          for (const prop in styleMap) {
            element.style[prop] = styleMap[prop];
          }
        });
      };
      $2.removeStyle = (elements, styleProps) => {
        if (!Array.isArray(elements)) {
          elements = [elements];
        }
        if (!Array.isArray(styleProps)) {
          styleProps = [styleProps];
        }
        elements.map((element) => {
          for (const prop of styleProps) {
            element.style[prop] = "";
          }
        });
      };
      $2.getStyle = (element, prop) => {
        if (!prop) {
          return getComputedStyle(element);
        }
        let val = getComputedStyle(element)[prop];
        if (["width", "height"].includes(prop)) {
          val = parseFloat(val);
        }
        return val;
      };
      $2.closest = (selector, element) => {
        if (!element)
          return null;
        if (element.matches(selector)) {
          return element;
        }
        return $2.closest(selector, element.parentNode);
      };
      $2.inViewport = (el, parentEl) => {
        const {
          top,
          left,
          bottom,
          right
        } = el.getBoundingClientRect();
        const {
          top: pTop,
          left: pLeft,
          bottom: pBottom,
          right: pRight
        } = parentEl.getBoundingClientRect();
        return top >= pTop && left >= pLeft && bottom <= pBottom && right <= pRight;
      };
      $2.scrollTop = function scrollTop(element, pixels) {
        requestAnimationFrame(() => {
          element.scrollTop = pixels;
        });
      };
      $2.scrollbarSize = function scrollbarSize() {
        if (!$2.scrollBarSizeValue) {
          $2.scrollBarSizeValue = getScrollBarSize();
        }
        return $2.scrollBarSizeValue;
      };
      function getScrollBarSize() {
        const scrollDiv = document.createElement("div");
        $2.style(scrollDiv, {
          width: "100px",
          height: "100px",
          overflow: "scroll",
          position: "absolute",
          top: "-9999px"
        });
        document.body.appendChild(scrollDiv);
        const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
        document.body.removeChild(scrollDiv);
        return scrollbarWidth;
      }
      $2.hasVerticalOverflow = function(element) {
        return element.scrollHeight > element.offsetHeight + 10;
      };
      $2.hasHorizontalOverflow = function(element) {
        return element.scrollWidth > element.offsetWidth + 10;
      };
      $2.measureTextWidth = function(text) {
        const div = document.createElement("div");
        div.style.position = "absolute";
        div.style.visibility = "hidden";
        div.style.height = "auto";
        div.style.width = "auto";
        div.style.whiteSpace = "nowrap";
        div.innerText = text;
        document.body.appendChild(div);
        return div.clientWidth + 1;
      };
      function isObject(value) {
        var type = typeof value;
        return value != null && (type == "object" || type == "function");
      }
      var isObject_1 = isObject;
      var commonjsGlobal = typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
      function commonjsRequire() {
        throw new Error("Dynamic requires are not currently supported by rollup-plugin-commonjs");
      }
      function unwrapExports(x) {
        return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
      }
      function createCommonjsModule(fn, module2) {
        return module2 = { exports: {} }, fn(module2, module2.exports), module2.exports;
      }
      var freeGlobal = typeof commonjsGlobal == "object" && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;
      var _freeGlobal = freeGlobal;
      var freeSelf = typeof self == "object" && self && self.Object === Object && self;
      var root = _freeGlobal || freeSelf || Function("return this")();
      var _root = root;
      var now = function() {
        return _root.Date.now();
      };
      var now_1 = now;
      var Symbol = _root.Symbol;
      var _Symbol = Symbol;
      var objectProto = Object.prototype;
      var hasOwnProperty = objectProto.hasOwnProperty;
      var nativeObjectToString = objectProto.toString;
      var symToStringTag = _Symbol ? _Symbol.toStringTag : void 0;
      function getRawTag(value) {
        var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
        try {
          value[symToStringTag] = void 0;
        } catch (e) {
        }
        var result = nativeObjectToString.call(value);
        {
          if (isOwn) {
            value[symToStringTag] = tag;
          } else {
            delete value[symToStringTag];
          }
        }
        return result;
      }
      var _getRawTag = getRawTag;
      var objectProto$1 = Object.prototype;
      var nativeObjectToString$1 = objectProto$1.toString;
      function objectToString(value) {
        return nativeObjectToString$1.call(value);
      }
      var _objectToString = objectToString;
      var nullTag = "[object Null]";
      var undefinedTag = "[object Undefined]";
      var symToStringTag$1 = _Symbol ? _Symbol.toStringTag : void 0;
      function baseGetTag(value) {
        if (value == null) {
          return value === void 0 ? undefinedTag : nullTag;
        }
        return symToStringTag$1 && symToStringTag$1 in Object(value) ? _getRawTag(value) : _objectToString(value);
      }
      var _baseGetTag = baseGetTag;
      function isObjectLike(value) {
        return value != null && typeof value == "object";
      }
      var isObjectLike_1 = isObjectLike;
      var symbolTag = "[object Symbol]";
      function isSymbol(value) {
        return typeof value == "symbol" || isObjectLike_1(value) && _baseGetTag(value) == symbolTag;
      }
      var isSymbol_1 = isSymbol;
      var NAN = 0 / 0;
      var reTrim = /^\s+|\s+$/g;
      var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
      var reIsBinary = /^0b[01]+$/i;
      var reIsOctal = /^0o[0-7]+$/i;
      var freeParseInt = parseInt;
      function toNumber(value) {
        if (typeof value == "number") {
          return value;
        }
        if (isSymbol_1(value)) {
          return NAN;
        }
        if (isObject_1(value)) {
          var other = typeof value.valueOf == "function" ? value.valueOf() : value;
          value = isObject_1(other) ? other + "" : other;
        }
        if (typeof value != "string") {
          return value === 0 ? value : +value;
        }
        value = value.replace(reTrim, "");
        var isBinary = reIsBinary.test(value);
        return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
      }
      var toNumber_1 = toNumber;
      var FUNC_ERROR_TEXT = "Expected a function";
      var nativeMax = Math.max;
      var nativeMin = Math.min;
      function debounce(func, wait, options) {
        var lastArgs, lastThis, maxWait, result, timerId, lastCallTime, lastInvokeTime = 0, leading = false, maxing = false, trailing = true;
        if (typeof func != "function") {
          throw new TypeError(FUNC_ERROR_TEXT);
        }
        wait = toNumber_1(wait) || 0;
        if (isObject_1(options)) {
          leading = !!options.leading;
          maxing = "maxWait" in options;
          maxWait = maxing ? nativeMax(toNumber_1(options.maxWait) || 0, wait) : maxWait;
          trailing = "trailing" in options ? !!options.trailing : trailing;
        }
        function invokeFunc(time) {
          var args = lastArgs, thisArg = lastThis;
          lastArgs = lastThis = void 0;
          lastInvokeTime = time;
          result = func.apply(thisArg, args);
          return result;
        }
        function leadingEdge(time) {
          lastInvokeTime = time;
          timerId = setTimeout(timerExpired, wait);
          return leading ? invokeFunc(time) : result;
        }
        function remainingWait(time) {
          var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime, timeWaiting = wait - timeSinceLastCall;
          return maxing ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
        }
        function shouldInvoke(time) {
          var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime;
          return lastCallTime === void 0 || timeSinceLastCall >= wait || timeSinceLastCall < 0 || maxing && timeSinceLastInvoke >= maxWait;
        }
        function timerExpired() {
          var time = now_1();
          if (shouldInvoke(time)) {
            return trailingEdge(time);
          }
          timerId = setTimeout(timerExpired, remainingWait(time));
        }
        function trailingEdge(time) {
          timerId = void 0;
          if (trailing && lastArgs) {
            return invokeFunc(time);
          }
          lastArgs = lastThis = void 0;
          return result;
        }
        function cancel() {
          if (timerId !== void 0) {
            clearTimeout(timerId);
          }
          lastInvokeTime = 0;
          lastArgs = lastCallTime = lastThis = timerId = void 0;
        }
        function flush() {
          return timerId === void 0 ? result : trailingEdge(now_1());
        }
        function debounced() {
          var time = now_1(), isInvoking = shouldInvoke(time);
          lastArgs = arguments;
          lastThis = this;
          lastCallTime = time;
          if (isInvoking) {
            if (timerId === void 0) {
              return leadingEdge(lastCallTime);
            }
            if (maxing) {
              timerId = setTimeout(timerExpired, wait);
              return invokeFunc(lastCallTime);
            }
          }
          if (timerId === void 0) {
            timerId = setTimeout(timerExpired, wait);
          }
          return result;
        }
        debounced.cancel = cancel;
        debounced.flush = flush;
        return debounced;
      }
      var debounce_1 = debounce;
      var FUNC_ERROR_TEXT$1 = "Expected a function";
      function throttle(func, wait, options) {
        var leading = true, trailing = true;
        if (typeof func != "function") {
          throw new TypeError(FUNC_ERROR_TEXT$1);
        }
        if (isObject_1(options)) {
          leading = "leading" in options ? !!options.leading : leading;
          trailing = "trailing" in options ? !!options.trailing : trailing;
        }
        return debounce_1(func, wait, {
          "leading": leading,
          "maxWait": wait,
          "trailing": trailing
        });
      }
      var throttle_1 = throttle;
      var asyncTag = "[object AsyncFunction]";
      var funcTag = "[object Function]";
      var genTag = "[object GeneratorFunction]";
      var proxyTag = "[object Proxy]";
      function isFunction(value) {
        if (!isObject_1(value)) {
          return false;
        }
        var tag = _baseGetTag(value);
        return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
      }
      var isFunction_1 = isFunction;
      var coreJsData = _root["__core-js_shared__"];
      var _coreJsData = coreJsData;
      var maskSrcKey = function() {
        var uid = /[^.]+$/.exec(_coreJsData && _coreJsData.keys && _coreJsData.keys.IE_PROTO || "");
        return uid ? "Symbol(src)_1." + uid : "";
      }();
      function isMasked(func) {
        return !!maskSrcKey && maskSrcKey in func;
      }
      var _isMasked = isMasked;
      var funcProto = Function.prototype;
      var funcToString = funcProto.toString;
      function toSource(func) {
        if (func != null) {
          try {
            return funcToString.call(func);
          } catch (e) {
          }
          try {
            return func + "";
          } catch (e) {
          }
        }
        return "";
      }
      var _toSource = toSource;
      var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
      var reIsHostCtor = /^\[object .+?Constructor\]$/;
      var funcProto$1 = Function.prototype;
      var objectProto$2 = Object.prototype;
      var funcToString$1 = funcProto$1.toString;
      var hasOwnProperty$1 = objectProto$2.hasOwnProperty;
      var reIsNative = RegExp("^" + funcToString$1.call(hasOwnProperty$1).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$");
      function baseIsNative(value) {
        if (!isObject_1(value) || _isMasked(value)) {
          return false;
        }
        var pattern = isFunction_1(value) ? reIsNative : reIsHostCtor;
        return pattern.test(_toSource(value));
      }
      var _baseIsNative = baseIsNative;
      function getValue(object, key) {
        return object == null ? void 0 : object[key];
      }
      var _getValue = getValue;
      function getNative(object, key) {
        var value = _getValue(object, key);
        return _baseIsNative(value) ? value : void 0;
      }
      var _getNative = getNative;
      var nativeCreate = _getNative(Object, "create");
      var _nativeCreate = nativeCreate;
      function hashClear() {
        this.__data__ = _nativeCreate ? _nativeCreate(null) : {};
        this.size = 0;
      }
      var _hashClear = hashClear;
      function hashDelete(key) {
        var result = this.has(key) && delete this.__data__[key];
        this.size -= result ? 1 : 0;
        return result;
      }
      var _hashDelete = hashDelete;
      var HASH_UNDEFINED = "__lodash_hash_undefined__";
      var objectProto$3 = Object.prototype;
      var hasOwnProperty$2 = objectProto$3.hasOwnProperty;
      function hashGet(key) {
        var data = this.__data__;
        if (_nativeCreate) {
          var result = data[key];
          return result === HASH_UNDEFINED ? void 0 : result;
        }
        return hasOwnProperty$2.call(data, key) ? data[key] : void 0;
      }
      var _hashGet = hashGet;
      var objectProto$4 = Object.prototype;
      var hasOwnProperty$3 = objectProto$4.hasOwnProperty;
      function hashHas(key) {
        var data = this.__data__;
        return _nativeCreate ? data[key] !== void 0 : hasOwnProperty$3.call(data, key);
      }
      var _hashHas = hashHas;
      var HASH_UNDEFINED$1 = "__lodash_hash_undefined__";
      function hashSet(key, value) {
        var data = this.__data__;
        this.size += this.has(key) ? 0 : 1;
        data[key] = _nativeCreate && value === void 0 ? HASH_UNDEFINED$1 : value;
        return this;
      }
      var _hashSet = hashSet;
      function Hash(entries) {
        var index = -1, length = entries == null ? 0 : entries.length;
        this.clear();
        while (++index < length) {
          var entry = entries[index];
          this.set(entry[0], entry[1]);
        }
      }
      Hash.prototype.clear = _hashClear;
      Hash.prototype["delete"] = _hashDelete;
      Hash.prototype.get = _hashGet;
      Hash.prototype.has = _hashHas;
      Hash.prototype.set = _hashSet;
      var _Hash = Hash;
      function listCacheClear() {
        this.__data__ = [];
        this.size = 0;
      }
      var _listCacheClear = listCacheClear;
      function eq(value, other) {
        return value === other || value !== value && other !== other;
      }
      var eq_1 = eq;
      function assocIndexOf(array, key) {
        var length = array.length;
        while (length--) {
          if (eq_1(array[length][0], key)) {
            return length;
          }
        }
        return -1;
      }
      var _assocIndexOf = assocIndexOf;
      var arrayProto = Array.prototype;
      var splice = arrayProto.splice;
      function listCacheDelete(key) {
        var data = this.__data__, index = _assocIndexOf(data, key);
        if (index < 0) {
          return false;
        }
        var lastIndex = data.length - 1;
        if (index == lastIndex) {
          data.pop();
        } else {
          splice.call(data, index, 1);
        }
        --this.size;
        return true;
      }
      var _listCacheDelete = listCacheDelete;
      function listCacheGet(key) {
        var data = this.__data__, index = _assocIndexOf(data, key);
        return index < 0 ? void 0 : data[index][1];
      }
      var _listCacheGet = listCacheGet;
      function listCacheHas(key) {
        return _assocIndexOf(this.__data__, key) > -1;
      }
      var _listCacheHas = listCacheHas;
      function listCacheSet(key, value) {
        var data = this.__data__, index = _assocIndexOf(data, key);
        if (index < 0) {
          ++this.size;
          data.push([key, value]);
        } else {
          data[index][1] = value;
        }
        return this;
      }
      var _listCacheSet = listCacheSet;
      function ListCache(entries) {
        var index = -1, length = entries == null ? 0 : entries.length;
        this.clear();
        while (++index < length) {
          var entry = entries[index];
          this.set(entry[0], entry[1]);
        }
      }
      ListCache.prototype.clear = _listCacheClear;
      ListCache.prototype["delete"] = _listCacheDelete;
      ListCache.prototype.get = _listCacheGet;
      ListCache.prototype.has = _listCacheHas;
      ListCache.prototype.set = _listCacheSet;
      var _ListCache = ListCache;
      var Map = _getNative(_root, "Map");
      var _Map = Map;
      function mapCacheClear() {
        this.size = 0;
        this.__data__ = {
          "hash": new _Hash(),
          "map": new (_Map || _ListCache)(),
          "string": new _Hash()
        };
      }
      var _mapCacheClear = mapCacheClear;
      function isKeyable(value) {
        var type = typeof value;
        return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
      }
      var _isKeyable = isKeyable;
      function getMapData(map, key) {
        var data = map.__data__;
        return _isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
      }
      var _getMapData = getMapData;
      function mapCacheDelete(key) {
        var result = _getMapData(this, key)["delete"](key);
        this.size -= result ? 1 : 0;
        return result;
      }
      var _mapCacheDelete = mapCacheDelete;
      function mapCacheGet(key) {
        return _getMapData(this, key).get(key);
      }
      var _mapCacheGet = mapCacheGet;
      function mapCacheHas(key) {
        return _getMapData(this, key).has(key);
      }
      var _mapCacheHas = mapCacheHas;
      function mapCacheSet(key, value) {
        var data = _getMapData(this, key), size = data.size;
        data.set(key, value);
        this.size += data.size == size ? 0 : 1;
        return this;
      }
      var _mapCacheSet = mapCacheSet;
      function MapCache(entries) {
        var index = -1, length = entries == null ? 0 : entries.length;
        this.clear();
        while (++index < length) {
          var entry = entries[index];
          this.set(entry[0], entry[1]);
        }
      }
      MapCache.prototype.clear = _mapCacheClear;
      MapCache.prototype["delete"] = _mapCacheDelete;
      MapCache.prototype.get = _mapCacheGet;
      MapCache.prototype.has = _mapCacheHas;
      MapCache.prototype.set = _mapCacheSet;
      var _MapCache = MapCache;
      var HASH_UNDEFINED$2 = "__lodash_hash_undefined__";
      function setCacheAdd(value) {
        this.__data__.set(value, HASH_UNDEFINED$2);
        return this;
      }
      var _setCacheAdd = setCacheAdd;
      function setCacheHas(value) {
        return this.__data__.has(value);
      }
      var _setCacheHas = setCacheHas;
      function SetCache(values) {
        var index = -1, length = values == null ? 0 : values.length;
        this.__data__ = new _MapCache();
        while (++index < length) {
          this.add(values[index]);
        }
      }
      SetCache.prototype.add = SetCache.prototype.push = _setCacheAdd;
      SetCache.prototype.has = _setCacheHas;
      var _SetCache = SetCache;
      function baseFindIndex(array, predicate, fromIndex, fromRight) {
        var length = array.length, index = fromIndex + (fromRight ? 1 : -1);
        while (fromRight ? index-- : ++index < length) {
          if (predicate(array[index], index, array)) {
            return index;
          }
        }
        return -1;
      }
      var _baseFindIndex = baseFindIndex;
      function baseIsNaN(value) {
        return value !== value;
      }
      var _baseIsNaN = baseIsNaN;
      function strictIndexOf(array, value, fromIndex) {
        var index = fromIndex - 1, length = array.length;
        while (++index < length) {
          if (array[index] === value) {
            return index;
          }
        }
        return -1;
      }
      var _strictIndexOf = strictIndexOf;
      function baseIndexOf(array, value, fromIndex) {
        return value === value ? _strictIndexOf(array, value, fromIndex) : _baseFindIndex(array, _baseIsNaN, fromIndex);
      }
      var _baseIndexOf = baseIndexOf;
      function arrayIncludes(array, value) {
        var length = array == null ? 0 : array.length;
        return !!length && _baseIndexOf(array, value, 0) > -1;
      }
      var _arrayIncludes = arrayIncludes;
      function arrayIncludesWith(array, value, comparator) {
        var index = -1, length = array == null ? 0 : array.length;
        while (++index < length) {
          if (comparator(value, array[index])) {
            return true;
          }
        }
        return false;
      }
      var _arrayIncludesWith = arrayIncludesWith;
      function cacheHas(cache, key) {
        return cache.has(key);
      }
      var _cacheHas = cacheHas;
      var Set2 = _getNative(_root, "Set");
      var _Set = Set2;
      function noop() {
      }
      var noop_1 = noop;
      function setToArray(set) {
        var index = -1, result = Array(set.size);
        set.forEach(function(value) {
          result[++index] = value;
        });
        return result;
      }
      var _setToArray = setToArray;
      var INFINITY = 1 / 0;
      var createSet = !(_Set && 1 / _setToArray(new _Set([, -0]))[1] == INFINITY) ? noop_1 : function(values) {
        return new _Set(values);
      };
      var _createSet = createSet;
      var LARGE_ARRAY_SIZE = 200;
      function baseUniq(array, iteratee, comparator) {
        var index = -1, includes = _arrayIncludes, length = array.length, isCommon = true, result = [], seen = result;
        if (comparator) {
          isCommon = false;
          includes = _arrayIncludesWith;
        } else if (length >= LARGE_ARRAY_SIZE) {
          var set = iteratee ? null : _createSet(array);
          if (set) {
            return _setToArray(set);
          }
          isCommon = false;
          includes = _cacheHas;
          seen = new _SetCache();
        } else {
          seen = iteratee ? [] : result;
        }
        outer:
          while (++index < length) {
            var value = array[index], computed = iteratee ? iteratee(value) : value;
            value = comparator || value !== 0 ? value : 0;
            if (isCommon && computed === computed) {
              var seenIndex = seen.length;
              while (seenIndex--) {
                if (seen[seenIndex] === computed) {
                  continue outer;
                }
              }
              if (iteratee) {
                seen.push(computed);
              }
              result.push(value);
            } else if (!includes(seen, computed, comparator)) {
              if (seen !== result) {
                seen.push(computed);
              }
              result.push(value);
            }
          }
        return result;
      }
      var _baseUniq = baseUniq;
      function uniq(array) {
        return array && array.length ? _baseUniq(array) : [];
      }
      var uniq_1 = uniq;
      function camelCaseToDash(str) {
        return str.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
      }
      function makeDataAttributeString(props) {
        const keys = Object.keys(props);
        return keys.map((key) => {
          const _key = camelCaseToDash(key);
          const val = props[key];
          if (val === void 0)
            return "";
          return `data-${_key}="${val}" `;
        }).join("").trim();
      }
      function copyTextToClipboard(text) {
        var textArea = document.createElement("textarea");
        textArea.style.position = "fixed";
        textArea.style.top = 0;
        textArea.style.left = 0;
        textArea.style.width = "2em";
        textArea.style.height = "2em";
        textArea.style.padding = 0;
        textArea.style.border = "none";
        textArea.style.outline = "none";
        textArea.style.boxShadow = "none";
        textArea.style.background = "transparent";
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
        } catch (err) {
          console.log("Oops, unable to copy");
        }
        document.body.removeChild(textArea);
      }
      function isNumeric(val) {
        return !isNaN(val);
      }
      var throttle$1 = throttle_1;
      var debounce$1 = debounce_1;
      function nextTick(fn, context = null) {
        return (...args) => {
          return new Promise((resolve) => {
            const execute = () => {
              const out = fn.apply(context, args);
              resolve(out);
            };
            setTimeout(execute);
          });
        };
      }
      function linkProperties(target, source, properties) {
        const props = properties.reduce((acc, prop) => {
          acc[prop] = {
            get() {
              return source[prop];
            }
          };
          return acc;
        }, {});
        Object.defineProperties(target, props);
      }
      function isSet(val) {
        return val !== void 0 || val !== null;
      }
      function notSet(val) {
        return !isSet(val);
      }
      function isNumber(val) {
        return !isNaN(val);
      }
      function ensureArray(val) {
        if (!Array.isArray(val)) {
          return [val];
        }
        return val;
      }
      function uniq$1(arr) {
        return uniq_1(arr);
      }
      function numberSortAsc(a, b) {
        return a - b;
      }
      function stripHTML(html) {
        return html.replace(/<[^>]*>/g, "");
      }
      function format(str, args) {
        if (!str)
          return str;
        Object.keys(args).forEach((arg) => {
          let regex = new RegExp(`{(${arg})}`, "g");
          str = str.replace(regex, args[arg]);
        });
        return str;
      }
      var DataManager = class {
        constructor(options) {
          this.options = options;
          this.sortRows = nextTick(this.sortRows, this);
          this.switchColumn = nextTick(this.switchColumn, this);
          this.removeColumn = nextTick(this.removeColumn, this);
          this.options.filterRows = nextTick(this.options.filterRows, this);
        }
        init(data, columns) {
          if (!data) {
            data = this.options.data;
          }
          if (columns) {
            this.options.columns = columns;
          }
          this.data = data;
          this.rowCount = 0;
          this.columns = [];
          this.rows = [];
          this.prepareColumns();
          this.prepareRows();
          this.prepareTreeRows();
          this.prepareRowView();
          this.prepareNumericColumns();
        }
        get currentSort() {
          const col = this.columns.find((col2) => col2.sortOrder !== "none");
          return col || {
            colIndex: -1,
            sortOrder: "none"
          };
        }
        prepareColumns() {
          this.columns = [];
          this.validateColumns();
          this.prepareDefaultColumns();
          this.prepareHeader();
        }
        prepareDefaultColumns() {
          if (this.options.checkboxColumn && !this.hasColumnById("_checkbox")) {
            const cell = {
              id: "_checkbox",
              content: this.getCheckboxHTML(),
              editable: false,
              resizable: false,
              sortable: false,
              focusable: false,
              dropdown: false,
              width: 32
            };
            this.columns.push(cell);
          }
          if (this.options.serialNoColumn && !this.hasColumnById("_rowIndex")) {
            let cell = {
              id: "_rowIndex",
              content: "",
              align: "center",
              editable: false,
              resizable: false,
              focusable: false,
              dropdown: false
            };
            this.columns.push(cell);
          }
        }
        prepareHeader() {
          let columns = this.columns.concat(this.options.columns);
          const baseCell = {
            isHeader: 1,
            editable: true,
            sortable: true,
            resizable: true,
            focusable: true,
            dropdown: true,
            width: null,
            format: (value) => {
              if (value === null || value === void 0) {
                return "";
              }
              return value + "";
            }
          };
          this.columns = columns.map((cell, i) => this.prepareCell(cell, i)).map((col) => Object.assign({}, baseCell, col)).map((col) => {
            col.content = col.content || col.name || "";
            col.id = col.id || col.content;
            return col;
          });
        }
        prepareCell(content, i) {
          const cell = {
            content: "",
            sortOrder: "none",
            colIndex: i,
            column: this.columns[i]
          };
          if (content !== null && typeof content === "object") {
            Object.assign(cell, content);
          } else {
            cell.content = content;
          }
          return cell;
        }
        prepareNumericColumns() {
          const row0 = this.getRow(0);
          if (!row0)
            return;
          this.columns = this.columns.map((column, i) => {
            const cellValue = row0[i].content;
            if (!column.align && isNumeric(cellValue)) {
              column.align = "right";
            }
            return column;
          });
        }
        prepareRows() {
          this.validateData(this.data);
          this.rows = this.data.map((d, i) => {
            const index = this._getNextRowCount();
            let row = [];
            let meta = {
              rowIndex: index
            };
            if (Array.isArray(d)) {
              if (this.options.checkboxColumn) {
                row.push(this.getCheckboxHTML());
              }
              if (this.options.serialNoColumn) {
                row.push(index + 1 + "");
              }
              row = row.concat(d);
              while (row.length < this.columns.length) {
                row.push("");
              }
            } else {
              for (let col of this.columns) {
                if (col.id === "_checkbox") {
                  row.push(this.getCheckboxHTML());
                } else if (col.id === "_rowIndex") {
                  row.push(index + 1 + "");
                } else {
                  row.push(d[col.id]);
                }
              }
              meta.indent = d.indent || 0;
            }
            return this.prepareRow(row, meta);
          });
        }
        prepareTreeRows() {
          this.rows.forEach((row, i) => {
            if (isNumber(row.meta.indent)) {
              const nextRow = this.getRow(i + 1);
              row.meta.isLeaf = !nextRow || notSet(nextRow.meta.indent) || nextRow.meta.indent <= row.meta.indent;
              row.meta.isTreeNodeClose = false;
            }
          });
        }
        prepareRowView() {
          this.rowViewOrder = this.rows.map((row) => row.meta.rowIndex);
        }
        prepareRow(row, meta) {
          const baseRowCell = {
            rowIndex: meta.rowIndex,
            indent: meta.indent
          };
          row = row.map((cell, i) => this.prepareCell(cell, i)).map((cell) => Object.assign({}, baseRowCell, cell));
          row.meta = meta;
          return row;
        }
        validateColumns() {
          const columns = this.options.columns;
          if (!Array.isArray(columns)) {
            throw new DataError("`columns` must be an array");
          }
          columns.forEach((column, i) => {
            if (typeof column !== "string" && typeof column !== "object") {
              throw new DataError(`column "${i}" must be a string or an object`);
            }
          });
        }
        validateData(data) {
          if (Array.isArray(data) && (data.length === 0 || Array.isArray(data[0]) || typeof data[0] === "object")) {
            return true;
          }
          throw new DataError("`data` must be an array of arrays or objects");
        }
        appendRows(rows) {
          this.validateData(rows);
          this.rows.push(...this.prepareRows(rows));
        }
        sortRows(colIndex, sortOrder = "none") {
          colIndex = +colIndex;
          this.getColumns().map((col) => {
            if (col.colIndex === colIndex) {
              col.sortOrder = sortOrder;
            } else {
              col.sortOrder = "none";
            }
          });
          this._sortRows(colIndex, sortOrder);
        }
        _sortRows(colIndex, sortOrder) {
          if (this.currentSort.colIndex === colIndex) {
            if (this.currentSort.sortOrder === "asc" && sortOrder === "desc" || this.currentSort.sortOrder === "desc" && sortOrder === "asc") {
              this.reverseArray(this.rowViewOrder);
              this.currentSort.sortOrder = sortOrder;
              return;
            }
          }
          this.rowViewOrder.sort((a, b) => {
            const aIndex = a;
            const bIndex = b;
            let aContent = this.getCell(colIndex, a).content;
            let bContent = this.getCell(colIndex, b).content;
            aContent = aContent == null ? "" : aContent;
            bContent = bContent == null ? "" : bContent;
            if (sortOrder === "none") {
              return aIndex - bIndex;
            } else if (sortOrder === "asc") {
              if (aContent < bContent)
                return -1;
              if (aContent > bContent)
                return 1;
              if (aContent === bContent)
                return 0;
            } else if (sortOrder === "desc") {
              if (aContent < bContent)
                return 1;
              if (aContent > bContent)
                return -1;
              if (aContent === bContent)
                return 0;
            }
            return 0;
          });
          if (this.hasColumnById("_rowIndex")) {
            const srNoColIndex = this.getColumnIndexById("_rowIndex");
            this.rows.forEach((row, index) => {
              const viewIndex = this.rowViewOrder.indexOf(index);
              const cell = row[srNoColIndex];
              cell.content = viewIndex + 1 + "";
            });
          }
        }
        reverseArray(array) {
          let left = null;
          let right = null;
          let length = array.length;
          for (left = 0, right = length - 1; left < right; left += 1, right -= 1) {
            const temporary = array[left];
            array[left] = array[right];
            array[right] = temporary;
          }
        }
        switchColumn(index1, index2) {
          const temp = this.columns[index1];
          this.columns[index1] = this.columns[index2];
          this.columns[index2] = temp;
          this.columns[index1].colIndex = index1;
          this.columns[index2].colIndex = index2;
          this.rows.forEach((row) => {
            const newCell1 = Object.assign({}, row[index1], {
              colIndex: index2
            });
            const newCell2 = Object.assign({}, row[index2], {
              colIndex: index1
            });
            row[index2] = newCell1;
            row[index1] = newCell2;
          });
        }
        removeColumn(index) {
          index = +index;
          const filter = (cell) => cell.colIndex !== index;
          const map = (cell, i) => Object.assign({}, cell, {
            colIndex: i
          });
          this.columns = this.columns.filter(filter).map(map);
          this.rows.forEach((row) => {
            row.splice(index, 1);
            row.forEach((cell, i) => {
              cell.colIndex = i;
            });
          });
        }
        updateRow(row, rowIndex) {
          if (row.length < this.columns.length) {
            if (this.hasColumnById("_rowIndex")) {
              const val = rowIndex + 1 + "";
              row = [val].concat(row);
            }
            if (this.hasColumnById("_checkbox")) {
              const val = '<input type="checkbox" />';
              row = [val].concat(row);
            }
          }
          const _row = this.prepareRow(row, { rowIndex });
          const index = this.rows.findIndex((row2) => row2[0].rowIndex === rowIndex);
          this.rows[index] = _row;
          return _row;
        }
        updateCell(colIndex, rowIndex, options) {
          let cell;
          if (typeof colIndex === "object") {
            cell = colIndex;
            colIndex = cell.colIndex;
            rowIndex = cell.rowIndex;
            options = cell;
          }
          cell = this.getCell(colIndex, rowIndex);
          for (let key in options) {
            const newVal = options[key];
            if (newVal !== void 0) {
              cell[key] = newVal;
            }
          }
          return cell;
        }
        updateColumn(colIndex, keyValPairs) {
          const column = this.getColumn(colIndex);
          for (let key in keyValPairs) {
            const newVal = keyValPairs[key];
            if (newVal !== void 0) {
              column[key] = newVal;
            }
          }
          return column;
        }
        filterRows(filters) {
          return this.options.filterRows(this.rows, filters).then((result) => {
            if (!result) {
              result = this.getAllRowIndices();
            }
            if (!result.then) {
              result = Promise.resolve(result);
            }
            return result.then((rowsToShow) => {
              this._filteredRows = rowsToShow;
              const rowsToHide = this.getAllRowIndices().filter((index) => !rowsToShow.includes(index));
              return {
                rowsToHide,
                rowsToShow
              };
            });
          });
        }
        getFilteredRowIndices() {
          return this._filteredRows || this.getAllRowIndices();
        }
        getAllRowIndices() {
          return this.rows.map((row) => row.meta.rowIndex);
        }
        getRowCount() {
          return this.rowCount;
        }
        _getNextRowCount() {
          const val = this.rowCount;
          this.rowCount++;
          return val;
        }
        getRows(start, end) {
          return this.rows.slice(start, end);
        }
        getRowsForView(start, end) {
          const rows = this.rowViewOrder.map((i) => this.rows[i]);
          return rows.slice(start, end);
        }
        getColumns(skipStandardColumns) {
          let columns = this.columns;
          if (skipStandardColumns) {
            columns = columns.slice(this.getStandardColumnCount());
          }
          return columns;
        }
        getStandardColumnCount() {
          if (this.options.checkboxColumn && this.options.serialNoColumn) {
            return 2;
          }
          if (this.options.checkboxColumn || this.options.serialNoColumn) {
            return 1;
          }
          return 0;
        }
        getColumnCount(skipStandardColumns) {
          let val = this.columns.length;
          if (skipStandardColumns) {
            val = val - this.getStandardColumnCount();
          }
          return val;
        }
        getColumn(colIndex) {
          colIndex = +colIndex;
          if (colIndex < 0) {
            colIndex = this.columns.length + colIndex;
          }
          return this.columns.find((col) => col.colIndex === colIndex);
        }
        getColumnById(id) {
          return this.columns.find((col) => col.id === id);
        }
        getRow(rowIndex) {
          rowIndex = +rowIndex;
          return this.rows[rowIndex];
        }
        getCell(colIndex, rowIndex) {
          rowIndex = +rowIndex;
          colIndex = +colIndex;
          return this.getRow(rowIndex)[colIndex];
        }
        getChildren(parentRowIndex) {
          parentRowIndex = +parentRowIndex;
          const parentIndent = this.getRow(parentRowIndex).meta.indent;
          const out = [];
          for (let i = parentRowIndex + 1; i < this.rowCount; i++) {
            const row = this.getRow(i);
            if (isNaN(row.meta.indent))
              continue;
            if (row.meta.indent > parentIndent) {
              out.push(i);
            }
            if (row.meta.indent === parentIndent) {
              break;
            }
          }
          return out;
        }
        getImmediateChildren(parentRowIndex) {
          parentRowIndex = +parentRowIndex;
          const parentIndent = this.getRow(parentRowIndex).meta.indent;
          const out = [];
          const childIndent = parentIndent + 1;
          for (let i = parentRowIndex + 1; i < this.rowCount; i++) {
            const row = this.getRow(i);
            if (isNaN(row.meta.indent) || row.meta.indent > childIndent)
              continue;
            if (row.meta.indent === childIndent) {
              out.push(i);
            }
            if (row.meta.indent === parentIndent) {
              break;
            }
          }
          return out;
        }
        get() {
          return {
            columns: this.columns,
            rows: this.rows
          };
        }
        getData(rowIndex) {
          return this.data[rowIndex];
        }
        hasColumn(name2) {
          return Boolean(this.columns.find((col) => col.content === name2));
        }
        hasColumnById(id) {
          return Boolean(this.columns.find((col) => col.id === id));
        }
        getColumnIndex(name2) {
          return this.columns.findIndex((col) => col.content === name2);
        }
        getColumnIndexById(id) {
          return this.columns.findIndex((col) => col.id === id);
        }
        getCheckboxHTML() {
          return '<input type="checkbox" />';
        }
      };
      var DataError = class extends TypeError {
      };
      var icons = {
        chevronDown: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-down"><polyline points="6 9 12 15 18 9"></polyline></svg>',
        chevronRight: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg>'
      };
      var CellManager = class {
        constructor(instance) {
          this.instance = instance;
          linkProperties(this, this.instance, [
            "wrapper",
            "options",
            "style",
            "header",
            "bodyScrollable",
            "columnmanager",
            "rowmanager",
            "datamanager",
            "keyboard"
          ]);
          this.bindEvents();
        }
        bindEvents() {
          this.bindFocusCell();
          this.bindEditCell();
          this.bindKeyboardSelection();
          this.bindCopyCellContents();
          this.bindMouseEvents();
          this.bindTreeEvents();
        }
        bindFocusCell() {
          this.bindKeyboardNav();
        }
        bindEditCell() {
          this.$editingCell = null;
          $2.on(this.bodyScrollable, "dblclick", ".dt-cell", (e, cell) => {
            this.activateEditing(cell);
          });
          this.keyboard.on("enter", () => {
            if (this.$focusedCell && !this.$editingCell) {
              this.activateEditing(this.$focusedCell);
            } else if (this.$editingCell) {
              this.deactivateEditing();
            }
          });
        }
        bindKeyboardNav() {
          const focusLastCell = (direction) => {
            if (!this.$focusedCell || this.$editingCell) {
              return false;
            }
            let $cell = this.$focusedCell;
            const {
              rowIndex,
              colIndex
            } = $2.data($cell);
            if (direction === "left") {
              $cell = this.getLeftMostCell$(rowIndex);
            } else if (direction === "right") {
              $cell = this.getRightMostCell$(rowIndex);
            } else if (direction === "up") {
              $cell = this.getTopMostCell$(colIndex);
            } else if (direction === "down") {
              $cell = this.getBottomMostCell$(colIndex);
            }
            this.focusCell($cell);
            return true;
          };
          ["left", "right", "up", "down", "tab", "shift+tab"].map((direction) => this.keyboard.on(direction, () => this.focusCellInDirection(direction)));
          ["left", "right", "up", "down"].map((direction) => this.keyboard.on(`ctrl+${direction}`, () => focusLastCell(direction)));
          this.keyboard.on("esc", () => {
            this.deactivateEditing(false);
            this.columnmanager.toggleFilter(false);
          });
          if (this.options.inlineFilters) {
            this.keyboard.on("ctrl+f", (e) => {
              const $cell = $2.closest(".dt-cell", e.target);
              const { colIndex } = $2.data($cell);
              this.activateFilter(colIndex);
              return true;
            });
            $2.on(this.header, "focusin", ".dt-filter", () => {
              this.unfocusCell(this.$focusedCell);
            });
          }
        }
        bindKeyboardSelection() {
          const getNextSelectionCursor = (direction) => {
            let $selectionCursor = this.getSelectionCursor();
            if (direction === "left") {
              $selectionCursor = this.getLeftCell$($selectionCursor);
            } else if (direction === "right") {
              $selectionCursor = this.getRightCell$($selectionCursor);
            } else if (direction === "up") {
              $selectionCursor = this.getAboveCell$($selectionCursor);
            } else if (direction === "down") {
              $selectionCursor = this.getBelowCell$($selectionCursor);
            }
            return $selectionCursor;
          };
          ["left", "right", "up", "down"].map((direction) => this.keyboard.on(`shift+${direction}`, () => this.selectArea(getNextSelectionCursor(direction))));
        }
        bindCopyCellContents() {
          this.keyboard.on("ctrl+c", () => {
            const noOfCellsCopied = this.copyCellContents(this.$focusedCell, this.$selectionCursor);
            const message = this.instance.translate("{count} cells copied", {
              count: noOfCellsCopied
            });
            if (noOfCellsCopied) {
              this.instance.showToastMessage(message, 2);
            }
          });
          if (this.options.pasteFromClipboard) {
            this.keyboard.on("ctrl+v", (e) => {
              this.instance.pasteTarget.focus();
              setTimeout(() => {
                const data = this.instance.pasteTarget.value;
                this.instance.pasteTarget.value = "";
                this.pasteContentInCell(data);
              }, 10);
              return false;
            });
          }
        }
        bindMouseEvents() {
          let mouseDown = null;
          $2.on(this.bodyScrollable, "mousedown", ".dt-cell", (e) => {
            mouseDown = true;
            this.focusCell($2(e.delegatedTarget));
          });
          $2.on(this.bodyScrollable, "mouseup", () => {
            mouseDown = false;
          });
          const selectArea = (e) => {
            if (!mouseDown)
              return;
            this.selectArea($2(e.delegatedTarget));
          };
          $2.on(this.bodyScrollable, "mousemove", ".dt-cell", throttle$1(selectArea, 50));
        }
        bindTreeEvents() {
          $2.on(this.bodyScrollable, "click", ".dt-tree-node__toggle", (e, $toggle) => {
            const $cell = $2.closest(".dt-cell", $toggle);
            const { rowIndex } = $2.data($cell);
            if ($cell.classList.contains("dt-cell--tree-close")) {
              this.rowmanager.openSingleNode(rowIndex);
            } else {
              this.rowmanager.closeSingleNode(rowIndex);
            }
          });
        }
        focusCell($cell, {
          skipClearSelection = 0,
          skipDOMFocus = 0,
          skipScrollToCell = 0
        } = {}) {
          if (!$cell)
            return;
          if ($cell === this.$editingCell)
            return;
          const {
            colIndex,
            isHeader
          } = $2.data($cell);
          if (isHeader) {
            return;
          }
          const column = this.columnmanager.getColumn(colIndex);
          if (column.focusable === false) {
            return;
          }
          if (!skipScrollToCell) {
            this.scrollToCell($cell);
          }
          this.deactivateEditing();
          if (!skipClearSelection) {
            this.clearSelection();
          }
          if (this.$focusedCell) {
            this.$focusedCell.classList.remove("dt-cell--focus");
          }
          this.$focusedCell = $cell;
          $cell.classList.add("dt-cell--focus");
          if (!skipDOMFocus) {
            $cell.focus();
          }
          this.highlightRowColumnHeader($cell);
        }
        unfocusCell($cell) {
          if (!$cell)
            return;
          $cell.classList.remove("dt-cell--focus");
          this.$focusedCell = null;
          if (this.lastHeaders) {
            this.lastHeaders.forEach((header) => header && header.classList.remove("dt-cell--highlight"));
          }
        }
        highlightRowColumnHeader($cell) {
          const {
            colIndex,
            rowIndex
          } = $2.data($cell);
          const srNoColIndex = this.datamanager.getColumnIndexById("_rowIndex");
          const colHeaderSelector = `.dt-cell--header-${colIndex}`;
          const rowHeaderSelector = `.dt-cell--${srNoColIndex}-${rowIndex}`;
          if (this.lastHeaders) {
            this.lastHeaders.forEach((header) => header && header.classList.remove("dt-cell--highlight"));
          }
          const colHeader = $2(colHeaderSelector, this.wrapper);
          const rowHeader = $2(rowHeaderSelector, this.wrapper);
          this.lastHeaders = [colHeader, rowHeader];
          this.lastHeaders.forEach((header) => header && header.classList.add("dt-cell--highlight"));
        }
        selectAreaOnClusterChanged() {
          if (!(this.$focusedCell && this.$selectionCursor))
            return;
          const {
            colIndex,
            rowIndex
          } = $2.data(this.$selectionCursor);
          const $cell = this.getCell$(colIndex, rowIndex);
          if (!$cell || $cell === this.$selectionCursor)
            return;
          const fCell = $2.data(this.$focusedCell);
          this.$focusedCell = this.getCell$(fCell.colIndex, fCell.rowIndex);
          this.selectArea($cell);
        }
        focusCellOnClusterChanged() {
          if (!this.$focusedCell)
            return;
          const {
            colIndex,
            rowIndex
          } = $2.data(this.$focusedCell);
          const $cell = this.getCell$(colIndex, rowIndex);
          if (!$cell)
            return;
          this.focusCell($cell, {
            skipClearSelection: 1,
            skipDOMFocus: 1,
            skipScrollToCell: 1
          });
        }
        selectArea($selectionCursor) {
          if (!this.$focusedCell)
            return;
          if (this._selectArea(this.$focusedCell, $selectionCursor)) {
            this.$selectionCursor = $selectionCursor;
          }
        }
        _selectArea($cell1, $cell2) {
          if ($cell1 === $cell2)
            return false;
          const cells = this.getCellsInRange($cell1, $cell2);
          if (!cells)
            return false;
          this.clearSelection();
          this._selectedCells = cells.map((index) => this.getCell$(...index));
          requestAnimationFrame(() => {
            this._selectedCells.map(($cell) => $cell.classList.add("dt-cell--highlight"));
          });
          return true;
        }
        getCellsInRange($cell1, $cell2) {
          let colIndex1, rowIndex1, colIndex2, rowIndex2;
          if (typeof $cell1 === "number") {
            [colIndex1, rowIndex1, colIndex2, rowIndex2] = arguments;
          } else if (typeof $cell1 === "object") {
            if (!($cell1 && $cell2)) {
              return false;
            }
            const cell1 = $2.data($cell1);
            const cell2 = $2.data($cell2);
            colIndex1 = +cell1.colIndex;
            rowIndex1 = +cell1.rowIndex;
            colIndex2 = +cell2.colIndex;
            rowIndex2 = +cell2.rowIndex;
          }
          if (rowIndex1 > rowIndex2) {
            [rowIndex1, rowIndex2] = [rowIndex2, rowIndex1];
          }
          if (colIndex1 > colIndex2) {
            [colIndex1, colIndex2] = [colIndex2, colIndex1];
          }
          if (this.isStandardCell(colIndex1) || this.isStandardCell(colIndex2)) {
            return false;
          }
          const cells = [];
          let colIndex = colIndex1;
          let rowIndex = rowIndex1;
          const rowIndices = [];
          while (rowIndex <= rowIndex2) {
            rowIndices.push(rowIndex);
            rowIndex += 1;
          }
          rowIndices.map((rowIndex3) => {
            while (colIndex <= colIndex2) {
              cells.push([colIndex, rowIndex3]);
              colIndex++;
            }
            colIndex = colIndex1;
          });
          return cells;
        }
        clearSelection() {
          (this._selectedCells || []).forEach(($cell) => $cell.classList.remove("dt-cell--highlight"));
          this._selectedCells = [];
          this.$selectionCursor = null;
        }
        getSelectionCursor() {
          return this.$selectionCursor || this.$focusedCell;
        }
        activateEditing($cell) {
          this.focusCell($cell);
          const {
            rowIndex,
            colIndex
          } = $2.data($cell);
          const col = this.columnmanager.getColumn(colIndex);
          if (col && (col.editable === false || col.focusable === false)) {
            return;
          }
          const cell = this.getCell(colIndex, rowIndex);
          if (cell && cell.editable === false) {
            return;
          }
          if (this.$editingCell) {
            const {
              _rowIndex,
              _colIndex
            } = $2.data(this.$editingCell);
            if (rowIndex === _rowIndex && colIndex === _colIndex) {
              return;
            }
          }
          this.$editingCell = $cell;
          $cell.classList.add("dt-cell--editing");
          const $editCell = $2(".dt-cell__edit", $cell);
          $editCell.innerHTML = "";
          const editor = this.getEditor(colIndex, rowIndex, cell.content, $editCell);
          if (editor) {
            this.currentCellEditor = editor;
            editor.initValue(cell.content, rowIndex, col);
          }
        }
        deactivateEditing(submitValue = true) {
          if (submitValue) {
            this.submitEditing();
          }
          if (this.$focusedCell)
            this.$focusedCell.focus();
          if (!this.$editingCell)
            return;
          this.$editingCell.classList.remove("dt-cell--editing");
          this.$editingCell = null;
        }
        getEditor(colIndex, rowIndex, value, parent) {
          const column = this.datamanager.getColumn(colIndex);
          const row = this.datamanager.getRow(rowIndex);
          const data = this.datamanager.getData(rowIndex);
          let editor = this.options.getEditor ? this.options.getEditor(colIndex, rowIndex, value, parent, column, row, data) : this.getDefaultEditor(parent);
          if (editor === false) {
            return false;
          }
          if (editor === void 0) {
            editor = this.getDefaultEditor(parent);
          }
          return editor;
        }
        getDefaultEditor(parent) {
          const $input = $2.create("input", {
            class: "dt-input",
            type: "text",
            inside: parent
          });
          return {
            initValue(value) {
              $input.focus();
              $input.value = value;
            },
            getValue() {
              return $input.value;
            },
            setValue(value) {
              $input.value = value;
            }
          };
        }
        submitEditing() {
          let promise = Promise.resolve();
          if (!this.$editingCell)
            return promise;
          const $cell = this.$editingCell;
          const {
            rowIndex,
            colIndex
          } = $2.data($cell);
          const col = this.datamanager.getColumn(colIndex);
          if ($cell) {
            const editor = this.currentCellEditor;
            if (editor) {
              let valuePromise = editor.getValue();
              if (!valuePromise.then) {
                valuePromise = Promise.resolve(valuePromise);
              }
              promise = valuePromise.then((value) => {
                const oldValue = this.getCell(colIndex, rowIndex).content;
                if (oldValue === value)
                  return false;
                const done = editor.setValue(value, rowIndex, col);
                this.updateCell(colIndex, rowIndex, value);
                $cell.focus();
                if (done && done.then) {
                  done.catch((e) => {
                    console.log(e);
                    this.updateCell(colIndex, rowIndex, oldValue);
                  });
                }
                return done;
              });
            }
          }
          this.currentCellEditor = null;
          return promise;
        }
        copyCellContents($cell1, $cell2) {
          if (!$cell2 && $cell1) {
            const {
              colIndex,
              rowIndex
            } = $2.data($cell1);
            const cell = this.getCell(colIndex, rowIndex);
            copyTextToClipboard(cell.content);
            return 1;
          }
          const cells = this.getCellsInRange($cell1, $cell2);
          if (!cells)
            return 0;
          const rows = cells.map((index) => this.getCell(...index)).reduce((acc, curr) => {
            const rowIndex = curr.rowIndex;
            acc[rowIndex] = acc[rowIndex] || [];
            acc[rowIndex].push(curr.content);
            return acc;
          }, []);
          const values = rows.map((row) => row.join("	")).join("\n");
          copyTextToClipboard(values);
          return rows.reduce((total, row) => total + row.length, 0);
        }
        pasteContentInCell(data) {
          if (!this.$focusedCell)
            return;
          const matrix = data.split("\n").map((row) => row.split("	")).filter((row) => row.length && row.every((it2) => it2));
          let { colIndex, rowIndex } = $2.data(this.$focusedCell);
          let focusedCell = {
            colIndex: +colIndex,
            rowIndex: +rowIndex
          };
          matrix.forEach((row, i) => {
            let rowIndex2 = i + focusedCell.rowIndex;
            row.forEach((cell, j) => {
              let colIndex2 = j + focusedCell.colIndex;
              this.updateCell(colIndex2, rowIndex2, cell);
            });
          });
        }
        activateFilter(colIndex) {
          this.columnmanager.toggleFilter();
          this.columnmanager.focusFilter(colIndex);
          if (!this.columnmanager.isFilterShown) {
            this.$focusedCell && this.$focusedCell.focus();
          }
        }
        updateCell(colIndex, rowIndex, value) {
          const cell = this.datamanager.updateCell(colIndex, rowIndex, {
            content: value
          });
          this.refreshCell(cell);
        }
        refreshCell(cell) {
          const $cell = $2(this.selector(cell.colIndex, cell.rowIndex), this.bodyScrollable);
          $cell.innerHTML = this.getCellContent(cell);
        }
        toggleTreeButton(rowIndex, flag) {
          const colIndex = this.columnmanager.getFirstColumnIndex();
          const $cell = this.getCell$(colIndex, rowIndex);
          if ($cell) {
            $cell.classList[flag ? "remove" : "add"]("dt-cell--tree-close");
          }
        }
        isStandardCell(colIndex) {
          return colIndex < this.columnmanager.getFirstColumnIndex();
        }
        focusCellInDirection(direction) {
          if (!this.$focusedCell || this.$editingCell && ["left", "right", "up", "down"].includes(direction)) {
            return false;
          } else if (this.$editingCell && ["tab", "shift+tab"].includes(direction)) {
            this.deactivateEditing();
          }
          let $cell = this.$focusedCell;
          if (direction === "left" || direction === "shift+tab") {
            $cell = this.getLeftCell$($cell);
          } else if (direction === "right" || direction === "tab") {
            $cell = this.getRightCell$($cell);
          } else if (direction === "up") {
            $cell = this.getAboveCell$($cell);
          } else if (direction === "down") {
            $cell = this.getBelowCell$($cell);
          }
          if (!$cell) {
            return false;
          }
          const {
            colIndex
          } = $2.data($cell);
          const column = this.columnmanager.getColumn(colIndex);
          if (!column.focusable) {
            let $prevFocusedCell = this.$focusedCell;
            this.unfocusCell($prevFocusedCell);
            this.$focusedCell = $cell;
            let ret = this.focusCellInDirection(direction);
            if (!ret) {
              this.focusCell($prevFocusedCell);
            }
            return ret;
          }
          this.focusCell($cell);
          return true;
        }
        getCell$(colIndex, rowIndex) {
          return $2(this.selector(colIndex, rowIndex), this.bodyScrollable);
        }
        getAboveCell$($cell) {
          const {
            colIndex
          } = $2.data($cell);
          let $aboveRow = $cell.parentElement.previousElementSibling;
          while ($aboveRow && $aboveRow.classList.contains("dt-row--hide")) {
            $aboveRow = $aboveRow.previousElementSibling;
          }
          if (!$aboveRow)
            return $cell;
          return $2(`.dt-cell--col-${colIndex}`, $aboveRow);
        }
        getBelowCell$($cell) {
          const {
            colIndex
          } = $2.data($cell);
          let $belowRow = $cell.parentElement.nextElementSibling;
          while ($belowRow && $belowRow.classList.contains("dt-row--hide")) {
            $belowRow = $belowRow.nextElementSibling;
          }
          if (!$belowRow)
            return $cell;
          return $2(`.dt-cell--col-${colIndex}`, $belowRow);
        }
        getLeftCell$($cell) {
          return $cell.previousElementSibling;
        }
        getRightCell$($cell) {
          return $cell.nextElementSibling;
        }
        getLeftMostCell$(rowIndex) {
          return this.getCell$(this.columnmanager.getFirstColumnIndex(), rowIndex);
        }
        getRightMostCell$(rowIndex) {
          return this.getCell$(this.columnmanager.getLastColumnIndex(), rowIndex);
        }
        getTopMostCell$(colIndex) {
          return this.getCell$(colIndex, this.rowmanager.getFirstRowIndex());
        }
        getBottomMostCell$(colIndex) {
          return this.getCell$(colIndex, this.rowmanager.getLastRowIndex());
        }
        getCell(colIndex, rowIndex) {
          return this.instance.datamanager.getCell(colIndex, rowIndex);
        }
        getRowHeight() {
          return $2.style($2(".dt-row", this.bodyScrollable), "height");
        }
        scrollToCell($cell) {
          if ($2.inViewport($cell, this.bodyScrollable))
            return false;
          const {
            rowIndex
          } = $2.data($cell);
          this.rowmanager.scrollToRow(rowIndex);
          return false;
        }
        getRowCountPerPage() {
          return Math.ceil(this.instance.getViewportHeight() / this.getRowHeight());
        }
        getCellHTML(cell) {
          const {
            rowIndex,
            colIndex,
            isHeader,
            isFilter,
            isTotalRow
          } = cell;
          const dataAttr = makeDataAttributeString({
            rowIndex,
            colIndex,
            isHeader,
            isFilter,
            isTotalRow
          });
          const row = this.datamanager.getRow(rowIndex);
          const isBodyCell = !(isHeader || isFilter || isTotalRow);
          const className = [
            "dt-cell",
            "dt-cell--col-" + colIndex,
            isBodyCell ? `dt-cell--${colIndex}-${rowIndex}` : "",
            isBodyCell ? "dt-cell--row-" + rowIndex : "",
            isHeader ? "dt-cell--header" : "",
            isHeader ? `dt-cell--header-${colIndex}` : "",
            isFilter ? "dt-cell--filter" : "",
            isBodyCell && (row && row.meta.isTreeNodeClose) ? "dt-cell--tree-close" : ""
          ].join(" ");
          return `
            <div class="${className}" ${dataAttr} tabindex="0">
                ${this.getCellContent(cell)}
            </div>
        `;
        }
        getCellContent(cell) {
          const {
            isHeader,
            isFilter,
            colIndex
          } = cell;
          const editable = !isHeader && cell.editable !== false;
          const editCellHTML = editable ? this.getEditCellHTML(colIndex) : "";
          const sortable = isHeader && cell.sortable !== false;
          const sortIndicator = sortable ? `<span class="sort-indicator">
                ${this.options.sortIndicator[cell.sortOrder]}
            </span>` : "";
          const resizable = isHeader && cell.resizable !== false;
          const resizeColumn = resizable ? '<span class="dt-cell__resize-handle"></span>' : "";
          const hasDropdown = isHeader && cell.dropdown !== false;
          const dropdown = hasDropdown ? this.columnmanager.getDropdownHTML() : "";
          const customFormatter = cell.format || cell.column && cell.column.format || null;
          let contentHTML;
          if (isHeader || isFilter || !customFormatter) {
            contentHTML = cell.content;
          } else {
            const row = this.datamanager.getRow(cell.rowIndex);
            const data = this.datamanager.getData(cell.rowIndex);
            contentHTML = customFormatter(cell.content, row, cell.column, data);
          }
          cell.html = contentHTML;
          if (this.options.treeView && !(isHeader || isFilter) && cell.indent !== void 0) {
            const nextRow = this.datamanager.getRow(cell.rowIndex + 1);
            const addToggle = nextRow && nextRow.meta.indent > cell.indent;
            const leftPadding = 20;
            const unit = "px";
            const firstColumnIndex = this.datamanager.getColumnIndexById("_rowIndex") + 1;
            if (firstColumnIndex === cell.colIndex) {
              const padding = (cell.indent || 0) * leftPadding;
              const toggleHTML = addToggle ? `<span class="dt-tree-node__toggle" style="left: ${padding - leftPadding}${unit}">
                        <span class="icon-open">${icons.chevronDown}</span>
                        <span class="icon-close">${icons.chevronRight}</span>
                    </span>` : "";
              contentHTML = `<span class="dt-tree-node" style="padding-left: ${padding}${unit}">
                    ${toggleHTML}
                    <span>${contentHTML}</span>
                </span>`;
            }
          }
          const className = [
            "dt-cell__content",
            isHeader ? `dt-cell__content--header-${colIndex}` : `dt-cell__content--col-${colIndex}`
          ].join(" ");
          return `
            <div class="${className}">
                ${contentHTML}
                ${sortIndicator}
                ${resizeColumn}
                ${dropdown}
            </div>
            ${editCellHTML}
        `;
        }
        getEditCellHTML(colIndex) {
          return `<div class="dt-cell__edit dt-cell__edit--col-${colIndex}"></div>`;
        }
        selector(colIndex, rowIndex) {
          return `.dt-cell--${colIndex}-${rowIndex}`;
        }
      };
      var ColumnManager = class {
        constructor(instance) {
          this.instance = instance;
          linkProperties(this, this.instance, [
            "options",
            "fireEvent",
            "header",
            "datamanager",
            "cellmanager",
            "style",
            "wrapper",
            "rowmanager",
            "bodyScrollable",
            "bodyRenderer"
          ]);
          this.bindEvents();
        }
        renderHeader() {
          this.header.innerHTML = "<div></div>";
          this.refreshHeader();
        }
        refreshHeader() {
          const columns = this.datamanager.getColumns();
          $2("div", this.header).innerHTML = this.getHeaderHTML(columns);
          this.$filterRow = $2(".dt-row-filter", this.header);
          if (this.$filterRow) {
            $2.style(this.$filterRow, { display: "none" });
          }
          this.$columnMap = [];
          this.bindMoveColumn();
        }
        getHeaderHTML(columns) {
          let html = this.rowmanager.getRowHTML(columns, {
            isHeader: 1
          });
          if (this.options.inlineFilters) {
            html += this.rowmanager.getRowHTML(columns, {
              isFilter: 1
            });
          }
          return html;
        }
        bindEvents() {
          this.bindDropdown();
          this.bindResizeColumn();
          this.bindPerfectColumnWidth();
          this.bindFilter();
        }
        bindDropdown() {
          let toggleClass = ".dt-dropdown__toggle";
          let dropdownClass = ".dt-dropdown__list";
          this.instance.dropdownContainer.innerHTML = this.getDropdownListHTML();
          this.$dropdownList = this.instance.dropdownContainer.firstElementChild;
          $2.on(this.header, "click", toggleClass, (e) => {
            this.openDropdown(e);
          });
          const deactivateDropdownOnBodyClick = (e) => {
            const selector = [
              toggleClass,
              toggleClass + " *",
              dropdownClass,
              dropdownClass + " *"
            ].join(",");
            if (e.target.matches(selector))
              return;
            deactivateDropdown();
          };
          $2.on(document.body, "click", deactivateDropdownOnBodyClick);
          document.addEventListener("scroll", deactivateDropdown, true);
          this.instance.on("onDestroy", () => {
            $2.off(document.body, "click", deactivateDropdownOnBodyClick);
            $2.off(document, "scroll", deactivateDropdown);
          });
          $2.on(this.$dropdownList, "click", ".dt-dropdown__list-item", (e, $item) => {
            if (!this._dropdownActiveColIndex)
              return;
            const dropdownItems = this.options.headerDropdown;
            const { index } = $2.data($item);
            const colIndex = this._dropdownActiveColIndex;
            let callback = dropdownItems[index].action;
            callback && callback.call(this.instance, this.getColumn(colIndex));
            this.hideDropdown();
          });
          const _this = this;
          function deactivateDropdown(e) {
            _this.hideDropdown();
          }
          this.hideDropdown();
        }
        openDropdown(e) {
          if (!this._dropdownWidth) {
            $2.style(this.$dropdownList, { display: "" });
            this._dropdownWidth = $2.style(this.$dropdownList, "width");
          }
          $2.style(this.$dropdownList, {
            display: "",
            left: e.clientX - this._dropdownWidth + 4 + "px",
            top: e.clientY + 4 + "px"
          });
          const $cell = $2.closest(".dt-cell", e.target);
          const { colIndex } = $2.data($cell);
          this._dropdownActiveColIndex = colIndex;
        }
        hideDropdown() {
          $2.style(this.$dropdownList, {
            display: "none"
          });
          this._dropdownActiveColIndex = null;
        }
        bindResizeColumn() {
          let isDragging = false;
          let $resizingCell, startWidth, startX;
          $2.on(this.header, "mousedown", ".dt-cell .dt-cell__resize-handle", (e, $handle) => {
            document.body.classList.add("dt-resize");
            const $cell = $handle.parentNode.parentNode;
            $resizingCell = $cell;
            const {
              colIndex
            } = $2.data($resizingCell);
            const col = this.getColumn(colIndex);
            if (col && col.resizable === false) {
              return;
            }
            isDragging = true;
            startWidth = $2.style($2(".dt-cell__content", $resizingCell), "width");
            startX = e.pageX;
          });
          const onMouseup = (e) => {
            document.body.classList.remove("dt-resize");
            if (!$resizingCell)
              return;
            isDragging = false;
            const {
              colIndex
            } = $2.data($resizingCell);
            this.setColumnWidth(colIndex);
            this.style.setBodyStyle();
            $resizingCell = null;
          };
          $2.on(document.body, "mouseup", onMouseup);
          this.instance.on("onDestroy", () => {
            $2.off(document.body, "mouseup", onMouseup);
          });
          const onMouseMove = (e) => {
            if (!isDragging)
              return;
            let delta = e.pageX - startX;
            if (this.options.direction === "rtl") {
              delta = -1 * delta;
            }
            const finalWidth = startWidth + delta;
            const {
              colIndex
            } = $2.data($resizingCell);
            let columnMinWidth = this.options.minimumColumnWidth;
            if (columnMinWidth > finalWidth) {
              return;
            }
            this.datamanager.updateColumn(colIndex, {
              width: finalWidth
            });
            this.setColumnHeaderWidth(colIndex);
          };
          $2.on(document.body, "mousemove", onMouseMove);
          this.instance.on("onDestroy", () => {
            $2.off(document.body, "mousemove", onMouseMove);
          });
        }
        bindPerfectColumnWidth() {
          $2.on(this.header, "dblclick", ".dt-cell .dt-cell__resize-handle", (e, $handle) => {
            const $cell = $handle.parentNode.parentNode;
            const { colIndex } = $2.data($cell);
            let longestCell = this.bodyRenderer.visibleRows.map((d) => d[colIndex]).reduce((acc, curr) => acc.content.length > curr.content.length ? acc : curr);
            let $longestCellHTML = this.cellmanager.getCellHTML(longestCell);
            let $div = document.createElement("div");
            $div.innerHTML = $longestCellHTML;
            let cellText = $div.querySelector(".dt-cell__content").textContent;
            let {
              borderLeftWidth,
              borderRightWidth,
              paddingLeft,
              paddingRight
            } = $2.getStyle(this.bodyScrollable.querySelector(".dt-cell__content"));
            let padding = [borderLeftWidth, borderRightWidth, paddingLeft, paddingRight].map(parseFloat).reduce((sum, val) => sum + val);
            let width = $2.measureTextWidth(cellText) + padding;
            this.datamanager.updateColumn(colIndex, { width });
            this.setColumnHeaderWidth(colIndex);
            this.setColumnWidth(colIndex);
          });
        }
        bindMoveColumn() {
          if (this.options.disableReorderColumn)
            return;
          const $parent = $2(".dt-row", this.header);
          this.sortable = Sortable.create($parent, {
            onEnd: (e) => {
              const {
                oldIndex,
                newIndex
              } = e;
              const $draggedCell = e.item;
              const {
                colIndex
              } = $2.data($draggedCell);
              if (+colIndex === newIndex)
                return;
              this.switchColumn(oldIndex, newIndex);
            },
            preventOnFilter: false,
            filter: ".dt-cell__resize-handle, .dt-dropdown",
            chosenClass: "dt-cell--dragging",
            animation: 150
          });
        }
        sortColumn(colIndex, nextSortOrder) {
          this.instance.freeze();
          this.sortRows(colIndex, nextSortOrder).then(() => {
            this.refreshHeader();
            return this.rowmanager.refreshRows();
          }).then(() => this.instance.unfreeze()).then(() => {
            this.fireEvent("onSortColumn", this.getColumn(colIndex));
          });
        }
        removeColumn(colIndex) {
          const removedCol = this.getColumn(colIndex);
          this.instance.freeze();
          this.datamanager.removeColumn(colIndex).then(() => {
            this.refreshHeader();
            return this.rowmanager.refreshRows();
          }).then(() => this.instance.unfreeze()).then(() => {
            this.fireEvent("onRemoveColumn", removedCol);
          });
        }
        switchColumn(oldIndex, newIndex) {
          this.instance.freeze();
          this.datamanager.switchColumn(oldIndex, newIndex).then(() => {
            this.refreshHeader();
            return this.rowmanager.refreshRows();
          }).then(() => {
            this.setColumnWidth(oldIndex);
            this.setColumnWidth(newIndex);
            this.instance.unfreeze();
          }).then(() => {
            this.fireEvent("onSwitchColumn", this.getColumn(oldIndex), this.getColumn(newIndex));
          });
        }
        toggleFilter(flag) {
          if (!this.options.inlineFilters)
            return;
          let showFilter;
          if (flag === void 0) {
            showFilter = !this.isFilterShown;
          } else {
            showFilter = flag;
          }
          if (showFilter) {
            $2.style(this.$filterRow, { display: "" });
          } else {
            $2.style(this.$filterRow, { display: "none" });
          }
          this.isFilterShown = showFilter;
          this.style.setBodyStyle();
        }
        focusFilter(colIndex) {
          if (!this.isFilterShown)
            return;
          const $filterInput = $2(`.dt-cell--col-${colIndex} .dt-filter`, this.$filterRow);
          $filterInput.focus();
        }
        bindFilter() {
          if (!this.options.inlineFilters)
            return;
          const handler = (e) => {
            this.applyFilter(this.getAppliedFilters());
          };
          $2.on(this.header, "keydown", ".dt-filter", debounce$1(handler, 300));
        }
        applyFilter(filters) {
          this.datamanager.filterRows(filters).then(({
            rowsToShow
          }) => {
            this.rowmanager.showRows(rowsToShow);
          });
        }
        getAppliedFilters() {
          const filters = {};
          $2.each(".dt-filter", this.header).map((input) => {
            const value = input.value;
            if (value) {
              filters[input.dataset.colIndex] = value;
            }
          });
          return filters;
        }
        applyDefaultSortOrder() {
          const columnsToSort = this.getColumns().filter((col) => col.sortOrder !== "none");
          if (columnsToSort.length === 1) {
            const column = columnsToSort[0];
            this.sortColumn(column.colIndex, column.sortOrder);
          }
        }
        sortRows(colIndex, sortOrder) {
          return this.datamanager.sortRows(colIndex, sortOrder);
        }
        getColumn(colIndex) {
          return this.datamanager.getColumn(colIndex);
        }
        getColumns() {
          return this.datamanager.getColumns();
        }
        setColumnWidth(colIndex, width) {
          colIndex = +colIndex;
          let columnWidth = width || this.getColumn(colIndex).width;
          const selector = [
            `.dt-cell__content--col-${colIndex}`,
            `.dt-cell__edit--col-${colIndex}`
          ].join(", ");
          const styles = {
            width: columnWidth + "px"
          };
          this.style.setStyle(selector, styles);
        }
        setColumnHeaderWidth(colIndex) {
          colIndex = +colIndex;
          this.$columnMap = this.$columnMap || [];
          const selector = `.dt-cell__content--header-${colIndex}`;
          const {
            width
          } = this.getColumn(colIndex);
          let $column = this.$columnMap[colIndex];
          if (!$column) {
            $column = this.header.querySelector(selector);
            this.$columnMap[colIndex] = $column;
          }
          $column.style.width = width + "px";
        }
        getColumnMinWidth(colIndex) {
          colIndex = +colIndex;
          return this.getColumn(colIndex).minWidth || 24;
        }
        getFirstColumnIndex() {
          return this.datamanager.getColumnIndexById("_rowIndex") + 1;
        }
        getHeaderCell$(colIndex) {
          return $2(`.dt-cell--header-${colIndex}`, this.header);
        }
        getLastColumnIndex() {
          return this.datamanager.getColumnCount() - 1;
        }
        getDropdownHTML() {
          const { dropdownButton } = this.options;
          return `
            <div class="dt-dropdown">
                <div class="dt-dropdown__toggle">${dropdownButton}</div>
            </div>
      `;
        }
        getDropdownListHTML() {
          const { headerDropdown: dropdownItems } = this.options;
          return `
            <div class="dt-dropdown__list">
            ${dropdownItems.map((d, i) => `
                <div class="dt-dropdown__list-item" data-index="${i}">${d.label}</div>
            `).join("")}
            </div>
        `;
        }
      };
      var RowManager = class {
        constructor(instance) {
          this.instance = instance;
          linkProperties(this, this.instance, [
            "options",
            "fireEvent",
            "wrapper",
            "bodyScrollable",
            "bodyRenderer",
            "style"
          ]);
          this.bindEvents();
          this.refreshRows = nextTick(this.refreshRows, this);
        }
        get datamanager() {
          return this.instance.datamanager;
        }
        get cellmanager() {
          return this.instance.cellmanager;
        }
        bindEvents() {
          this.bindCheckbox();
        }
        bindCheckbox() {
          if (!this.options.checkboxColumn)
            return;
          this.checkMap = [];
          $2.on(this.wrapper, "click", '.dt-cell--col-0 [type="checkbox"]', (e, $checkbox) => {
            const $cell = $checkbox.closest(".dt-cell");
            const {
              rowIndex,
              isHeader
            } = $2.data($cell);
            const checked = $checkbox.checked;
            if (isHeader) {
              this.checkAll(checked);
            } else {
              this.checkRow(rowIndex, checked);
            }
          });
        }
        refreshRows() {
          this.instance.renderBody();
          this.instance.setDimensions();
        }
        refreshRow(row, rowIndex) {
          const _row = this.datamanager.updateRow(row, rowIndex);
          _row.forEach((cell) => {
            this.cellmanager.refreshCell(cell);
          });
        }
        getCheckedRows() {
          if (!this.checkMap) {
            return [];
          }
          let out = [];
          for (let rowIndex in this.checkMap) {
            const checked = this.checkMap[rowIndex];
            if (checked === 1) {
              out.push(rowIndex);
            }
          }
          return out;
        }
        highlightCheckedRows() {
          this.getCheckedRows().map((rowIndex) => this.checkRow(rowIndex, true));
        }
        checkRow(rowIndex, toggle) {
          const value = toggle ? 1 : 0;
          const selector = (rowIndex2) => `.dt-cell--0-${rowIndex2} [type="checkbox"]`;
          this.checkMap[rowIndex] = value;
          $2.each(selector(rowIndex), this.bodyScrollable).map((input) => {
            input.checked = toggle;
          });
          this.highlightRow(rowIndex, toggle);
          this.showCheckStatus();
          this.fireEvent("onCheckRow", this.datamanager.getRow(rowIndex));
        }
        checkAll(toggle) {
          const value = toggle ? 1 : 0;
          if (toggle) {
            this.checkMap = Array.from(Array(this.getTotalRows())).map((c) => value);
          } else {
            this.checkMap = [];
          }
          $2.each('.dt-cell--col-0 [type="checkbox"]', this.bodyScrollable).map((input) => {
            input.checked = toggle;
          });
          this.highlightAll(toggle);
          this.showCheckStatus();
          this.fireEvent("onCheckRow");
        }
        showCheckStatus() {
          if (!this.options.checkedRowStatus)
            return;
          const checkedRows = this.getCheckedRows();
          const count = checkedRows.length;
          if (count > 0) {
            let message = this.instance.translate("{count} rows selected", {
              count
            });
            this.bodyRenderer.showToastMessage(message);
          } else {
            this.bodyRenderer.clearToastMessage();
          }
        }
        highlightRow(rowIndex, toggle = true) {
          const $row = this.getRow$(rowIndex);
          if (!$row)
            return;
          if (!toggle && this.bodyScrollable.classList.contains("dt-scrollable--highlight-all")) {
            $row.classList.add("dt-row--unhighlight");
            return;
          }
          if (toggle && $row.classList.contains("dt-row--unhighlight")) {
            $row.classList.remove("dt-row--unhighlight");
          }
          this._highlightedRows = this._highlightedRows || {};
          if (toggle) {
            $row.classList.add("dt-row--highlight");
            this._highlightedRows[rowIndex] = $row;
          } else {
            $row.classList.remove("dt-row--highlight");
            delete this._highlightedRows[rowIndex];
          }
        }
        highlightAll(toggle = true) {
          if (toggle) {
            this.bodyScrollable.classList.add("dt-scrollable--highlight-all");
          } else {
            this.bodyScrollable.classList.remove("dt-scrollable--highlight-all");
            for (const rowIndex in this._highlightedRows) {
              const $row = this._highlightedRows[rowIndex];
              $row.classList.remove("dt-row--highlight");
            }
            this._highlightedRows = {};
          }
        }
        showRows(rowIndices) {
          rowIndices = ensureArray(rowIndices);
          const rows = rowIndices.map((rowIndex) => this.datamanager.getRow(rowIndex));
          this.bodyRenderer.renderRows(rows);
        }
        showAllRows() {
          const rowIndices = this.datamanager.getAllRowIndices();
          this.showRows(rowIndices);
        }
        getChildrenToShowForNode(rowIndex) {
          const row = this.datamanager.getRow(rowIndex);
          row.meta.isTreeNodeClose = false;
          return this.datamanager.getImmediateChildren(rowIndex);
        }
        openSingleNode(rowIndex) {
          const childrenToShow = this.getChildrenToShowForNode(rowIndex);
          const visibleRowIndices = this.bodyRenderer.visibleRowIndices;
          const rowsToShow = uniq$1([...childrenToShow, ...visibleRowIndices]).sort(numberSortAsc);
          this.showRows(rowsToShow);
        }
        getChildrenToHideForNode(rowIndex) {
          const row = this.datamanager.getRow(rowIndex);
          row.meta.isTreeNodeClose = true;
          const rowsToHide = this.datamanager.getChildren(rowIndex);
          rowsToHide.forEach((rowIndex2) => {
            const row2 = this.datamanager.getRow(rowIndex2);
            if (!row2.meta.isLeaf) {
              row2.meta.isTreeNodeClose = true;
            }
          });
          return rowsToHide;
        }
        closeSingleNode(rowIndex) {
          const rowsToHide = this.getChildrenToHideForNode(rowIndex);
          const visibleRows = this.bodyRenderer.visibleRowIndices;
          const rowsToShow = visibleRows.filter((rowIndex2) => !rowsToHide.includes(rowIndex2)).sort(numberSortAsc);
          this.showRows(rowsToShow);
        }
        expandAllNodes() {
          let rows = this.datamanager.getRows();
          let rootNodes = rows.filter((row) => !row.meta.isLeaf);
          const childrenToShow = rootNodes.map((row) => this.getChildrenToShowForNode(row.meta.rowIndex)).flat();
          const visibleRowIndices = this.bodyRenderer.visibleRowIndices;
          const rowsToShow = uniq$1([...childrenToShow, ...visibleRowIndices]).sort(numberSortAsc);
          this.showRows(rowsToShow);
        }
        collapseAllNodes() {
          let rows = this.datamanager.getRows();
          let rootNodes = rows.filter((row) => row.meta.indent === 0);
          const rowsToHide = rootNodes.map((row) => this.getChildrenToHideForNode(row.meta.rowIndex)).flat();
          const visibleRows = this.bodyRenderer.visibleRowIndices;
          const rowsToShow = visibleRows.filter((rowIndex) => !rowsToHide.includes(rowIndex)).sort(numberSortAsc);
          this.showRows(rowsToShow);
        }
        setTreeDepth(depth) {
          let rows = this.datamanager.getRows();
          const rowsToOpen = rows.filter((row) => row.meta.indent < depth);
          const rowsToClose = rows.filter((row) => row.meta.indent >= depth);
          const rowsToHide = rowsToClose.filter((row) => row.meta.indent > depth);
          rowsToClose.forEach((row) => {
            if (!row.meta.isLeaf) {
              row.meta.isTreeNodeClose = true;
            }
          });
          rowsToOpen.forEach((row) => {
            if (!row.meta.isLeaf) {
              row.meta.isTreeNodeClose = false;
            }
          });
          const rowsToShow = rows.filter((row) => !rowsToHide.includes(row)).map((row) => row.meta.rowIndex).sort(numberSortAsc);
          this.showRows(rowsToShow);
        }
        getRow$(rowIndex) {
          return $2(this.selector(rowIndex), this.bodyScrollable);
        }
        getTotalRows() {
          return this.datamanager.getRowCount();
        }
        getFirstRowIndex() {
          return 0;
        }
        getLastRowIndex() {
          return this.datamanager.getRowCount() - 1;
        }
        scrollToRow(rowIndex) {
          rowIndex = +rowIndex;
          this._lastScrollTo = this._lastScrollTo || 0;
          const $row = this.getRow$(rowIndex);
          if ($2.inViewport($row, this.bodyScrollable))
            return;
          const {
            height
          } = $row.getBoundingClientRect();
          const {
            top,
            bottom
          } = this.bodyScrollable.getBoundingClientRect();
          const rowsInView = Math.floor((bottom - top) / height);
          let offset = 0;
          if (rowIndex > this._lastScrollTo) {
            offset = height * (rowIndex + 1 - rowsInView);
          } else {
            offset = height * (rowIndex + 1 - 1);
          }
          this._lastScrollTo = rowIndex;
          $2.scrollTop(this.bodyScrollable, offset);
        }
        getRowHTML(row, props) {
          const dataAttr = makeDataAttributeString(props);
          let rowIdentifier = props.rowIndex;
          if (props.isFilter) {
            row = row.map((cell) => Object.assign({}, cell, {
              content: this.getFilterInput({
                colIndex: cell.colIndex,
                name: cell.name
              }),
              isFilter: 1,
              isHeader: void 0,
              editable: false
            }));
            rowIdentifier = "filter";
          }
          if (props.isHeader) {
            rowIdentifier = "header";
          }
          return `
            <div class="dt-row dt-row-${rowIdentifier}" ${dataAttr}>
                ${row.map((cell) => this.cellmanager.getCellHTML(cell)).join("")}
            </div>
        `;
        }
        getFilterInput(props) {
          let title = `title="Filter based on ${props.name || "Index"}"`;
          const dataAttr = makeDataAttributeString(props);
          return `<input class="dt-filter dt-input" type="text" ${dataAttr} tabindex="1" 
            ${props.colIndex === 0 ? "disabled" : title} />`;
        }
        selector(rowIndex) {
          return `.dt-row-${rowIndex}`;
        }
      };
      var hyperlist = createCommonjsModule(function(module2, exports2) {
        (function(f) {
          {
            module2.exports = f();
          }
        })(function() {
          return function e(t, n, r) {
            function s(o2, u) {
              if (!n[o2]) {
                if (!t[o2]) {
                  var a = typeof commonjsRequire == "function" && commonjsRequire;
                  if (!u && a)
                    return a(o2, true);
                  if (i)
                    return i(o2, true);
                  var f = new Error("Cannot find module '" + o2 + "'");
                  throw f.code = "MODULE_NOT_FOUND", f;
                }
                var l = n[o2] = { exports: {} };
                t[o2][0].call(l.exports, function(e2) {
                  var n2 = t[o2][1][e2];
                  return s(n2 ? n2 : e2);
                }, l, l.exports, e, t, n, r);
              }
              return n[o2].exports;
            }
            var i = typeof commonjsRequire == "function" && commonjsRequire;
            for (var o = 0; o < r.length; o++)
              s(r[o]);
            return s;
          }({ 1: [function(_dereq_, module3, exports3) {
            Object.defineProperty(exports3, "__esModule", {
              value: true
            });
            var _createClass = function() {
              function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                  var descriptor = props[i];
                  descriptor.enumerable = descriptor.enumerable || false;
                  descriptor.configurable = true;
                  if ("value" in descriptor)
                    descriptor.writable = true;
                  Object.defineProperty(target, descriptor.key, descriptor);
                }
              }
              return function(Constructor, protoProps, staticProps) {
                if (protoProps)
                  defineProperties(Constructor.prototype, protoProps);
                if (staticProps)
                  defineProperties(Constructor, staticProps);
                return Constructor;
              };
            }();
            function _classCallCheck(instance, Constructor) {
              if (!(instance instanceof Constructor)) {
                throw new TypeError("Cannot call a class as a function");
              }
            }
            var defaultConfig = {
              width: "100%",
              height: "100%"
            };
            var isNumber2 = function isNumber3(input) {
              return Number(input) === Number(input);
            };
            var HyperList2 = function() {
              _createClass(HyperList3, null, [{
                key: "create",
                value: function create(element, userProvidedConfig) {
                  return new HyperList3(element, userProvidedConfig);
                }
              }, {
                key: "mergeStyle",
                value: function mergeStyle(element, style) {
                  for (var i in style) {
                    if (element.style[i] !== style[i]) {
                      element.style[i] = style[i];
                    }
                  }
                }
              }, {
                key: "getMaxBrowserHeight",
                value: function getMaxBrowserHeight() {
                  var wrapper = document.createElement("div");
                  var fixture = document.createElement("div");
                  HyperList3.mergeStyle(wrapper, { position: "absolute", height: "1px", opacity: 0 });
                  HyperList3.mergeStyle(fixture, { height: "1e7px" });
                  wrapper.appendChild(fixture);
                  document.body.appendChild(wrapper);
                  var maxElementHeight = fixture.offsetHeight;
                  document.body.removeChild(wrapper);
                  return maxElementHeight;
                }
              }]);
              function HyperList3(element, userProvidedConfig) {
                var _this = this;
                _classCallCheck(this, HyperList3);
                this._config = {};
                this._lastRepaint = null;
                this._maxElementHeight = HyperList3.getMaxBrowserHeight();
                this.refresh(element, userProvidedConfig);
                var config2 = this._config;
                var render = function render2() {
                  var scrollTop = _this._getScrollPosition();
                  var lastRepaint = _this._lastRepaint;
                  _this._renderAnimationFrame = window.requestAnimationFrame(render2);
                  if (scrollTop === lastRepaint) {
                    return;
                  }
                  if (!lastRepaint || Math.abs(scrollTop - lastRepaint) > _this._averageHeight) {
                    var rendered = _this._renderChunk();
                    _this._lastRepaint = scrollTop;
                    if (rendered !== false && typeof config2.afterRender === "function") {
                      config2.afterRender();
                    }
                  }
                };
                render();
              }
              _createClass(HyperList3, [{
                key: "destroy",
                value: function destroy() {
                  window.cancelAnimationFrame(this._renderAnimationFrame);
                }
              }, {
                key: "refresh",
                value: function refresh(element, userProvidedConfig) {
                  var _this2 = this;
                  Object.assign(this._config, defaultConfig, userProvidedConfig);
                  if (!element || element.nodeType !== 1) {
                    throw new Error("HyperList requires a valid DOM Node container");
                  }
                  this._element = element;
                  var config2 = this._config;
                  var scroller = this._scroller || config2.scroller || document.createElement(config2.scrollerTagName || "tr");
                  if (typeof config2.useFragment !== "boolean") {
                    this._config.useFragment = true;
                  }
                  if (!config2.generate) {
                    throw new Error("Missing required `generate` function");
                  }
                  if (!isNumber2(config2.total)) {
                    throw new Error("Invalid required `total` value, expected number");
                  }
                  if (!Array.isArray(config2.itemHeight) && !isNumber2(config2.itemHeight)) {
                    throw new Error("\n        Invalid required `itemHeight` value, expected number or array\n      ".trim());
                  } else if (isNumber2(config2.itemHeight)) {
                    this._itemHeights = Array(config2.total).fill(config2.itemHeight);
                  } else {
                    this._itemHeights = config2.itemHeight;
                  }
                  Object.keys(defaultConfig).filter(function(prop) {
                    return prop in config2;
                  }).forEach(function(prop) {
                    var value = config2[prop];
                    var isValueNumber = isNumber2(value);
                    var isValuePercent = isValueNumber ? false : value.slice(-1) === "%";
                    if (value && typeof value !== "string" && typeof value !== "number") {
                      var msg = "Invalid optional `" + prop + "`, expected string or number";
                      throw new Error(msg);
                    } else if (isValueNumber) {
                      config2[prop] = value + "px";
                    }
                    if (prop !== "height") {
                      return;
                    }
                    var numberValue = isValueNumber ? value : parseInt(value.replace(/px|%/, ""), 10);
                    if (isValuePercent) {
                      _this2._containerHeight = window.innerHeight * numberValue / 100;
                    } else {
                      _this2._containerHeight = isNumber2(value) ? value : numberValue;
                    }
                  });
                  var elementStyle = {
                    width: "" + config2.width,
                    height: "" + config2.height,
                    overflow: "auto",
                    position: "relative"
                  };
                  HyperList3.mergeStyle(element, elementStyle);
                  var scrollerHeight = config2.itemHeight * config2.total;
                  var maxElementHeight = this._maxElementHeight;
                  if (scrollerHeight > maxElementHeight) {
                    console.warn(["HyperList: The maximum element height", maxElementHeight + "px has", "been exceeded; please reduce your item height."].join(" "));
                  }
                  var scrollerStyle = {
                    opacity: "0",
                    position: "absolute",
                    width: "1px",
                    height: scrollerHeight + "px"
                  };
                  HyperList3.mergeStyle(scroller, scrollerStyle);
                  if (!this._scroller) {
                    element.appendChild(scroller);
                  }
                  this._scroller = scroller;
                  this._scrollHeight = this._computeScrollHeight();
                  this._itemPositions = this._itemPositions || Array(config2.total).fill(0);
                  this._computePositions(0);
                  this._renderChunk(this._lastRepaint !== null);
                  if (typeof config2.afterRender === "function") {
                    config2.afterRender();
                  }
                }
              }, {
                key: "_getRow",
                value: function _getRow(i) {
                  var config2 = this._config;
                  var item = config2.generate(i);
                  var height = item.height;
                  if (height !== void 0 && isNumber2(height)) {
                    item = item.element;
                    if (height !== this._itemHeights) {
                      this._itemHeights[i] = height;
                      this._computePositions(i);
                      this._scrollHeight = this._computeScrollHeight(i);
                    }
                  } else {
                    height = this._itemHeights[i];
                  }
                  if (!item || item.nodeType !== 1) {
                    throw new Error("Generator did not return a DOM Node for index: " + i);
                  }
                  var oldClass = item.getAttribute("class") || "";
                  item.setAttribute("class", oldClass + " " + (config2.rowClassName || "vrow"));
                  var top = this._itemPositions[i];
                  HyperList3.mergeStyle(item, {
                    position: "absolute",
                    top: top + "px"
                  });
                  return item;
                }
              }, {
                key: "_getScrollPosition",
                value: function _getScrollPosition() {
                  var config2 = this._config;
                  if (typeof config2.overrideScrollPosition === "function") {
                    return config2.overrideScrollPosition();
                  }
                  return this._element.scrollTop;
                }
              }, {
                key: "_renderChunk",
                value: function _renderChunk(force) {
                  var config2 = this._config;
                  var element = this._element;
                  var scrollTop = this._getScrollPosition();
                  var total = config2.total;
                  var from = config2.reverse ? this._getReverseFrom(scrollTop) : this._getFrom(scrollTop) - 1;
                  if (from < 0 || from - this._screenItemsLen < 0) {
                    from = 0;
                  }
                  if (!force && this._lastFrom === from) {
                    return false;
                  }
                  this._lastFrom = from;
                  var to = from + this._cachedItemsLen;
                  if (to > total || to + this._cachedItemsLen > total) {
                    to = total;
                  }
                  var fragment = config2.useFragment ? document.createDocumentFragment() : [];
                  var scroller = this._scroller;
                  fragment[config2.useFragment ? "appendChild" : "push"](scroller);
                  for (var i = from; i < to; i++) {
                    var row = this._getRow(i);
                    fragment[config2.useFragment ? "appendChild" : "push"](row);
                  }
                  if (config2.applyPatch) {
                    return config2.applyPatch(element, fragment);
                  }
                  element.innerHTML = "";
                  element.appendChild(fragment);
                }
              }, {
                key: "_computePositions",
                value: function _computePositions() {
                  var from = arguments.length <= 0 || arguments[0] === void 0 ? 1 : arguments[0];
                  var config2 = this._config;
                  var total = config2.total;
                  var reverse = config2.reverse;
                  if (from < 1 && !reverse) {
                    from = 1;
                  }
                  for (var i = from; i < total; i++) {
                    if (reverse) {
                      if (i === 0) {
                        this._itemPositions[0] = this._scrollHeight - this._itemHeights[0];
                      } else {
                        this._itemPositions[i] = this._itemPositions[i - 1] - this._itemHeights[i];
                      }
                    } else {
                      this._itemPositions[i] = this._itemHeights[i - 1] + this._itemPositions[i - 1];
                    }
                  }
                }
              }, {
                key: "_computeScrollHeight",
                value: function _computeScrollHeight() {
                  var _this3 = this;
                  var config2 = this._config;
                  var total = config2.total;
                  var scrollHeight = this._itemHeights.reduce(function(a, b) {
                    return a + b;
                  }, 0);
                  HyperList3.mergeStyle(this._scroller, {
                    opacity: 0,
                    position: "absolute",
                    width: "1px",
                    height: scrollHeight + "px"
                  });
                  var sortedItemHeights = this._itemHeights.slice(0).sort(function(a, b) {
                    return a - b;
                  });
                  var middle = Math.floor(total / 2);
                  var averageHeight = total % 2 === 0 ? (sortedItemHeights[middle] + sortedItemHeights[middle - 1]) / 2 : sortedItemHeights[middle];
                  var containerHeight = this._element.clientHeight ? this._element.clientHeight : this._containerHeight;
                  this._screenItemsLen = Math.ceil(containerHeight / averageHeight);
                  this._containerHeight = containerHeight;
                  this._cachedItemsLen = Math.max(this._cachedItemsLen || 0, this._screenItemsLen * 3);
                  this._averageHeight = averageHeight;
                  if (config2.reverse) {
                    window.requestAnimationFrame(function() {
                      _this3._element.scrollTop = scrollHeight;
                    });
                  }
                  return scrollHeight;
                }
              }, {
                key: "_getFrom",
                value: function _getFrom(scrollTop) {
                  var i = 0;
                  while (this._itemPositions[i] < scrollTop) {
                    i++;
                  }
                  return i;
                }
              }, {
                key: "_getReverseFrom",
                value: function _getReverseFrom(scrollTop) {
                  var i = this._config.total - 1;
                  while (i > 0 && this._itemPositions[i] < scrollTop + this._containerHeight) {
                    i--;
                  }
                  return i;
                }
              }]);
              return HyperList3;
            }();
            exports3.default = HyperList2;
            module3.exports = exports3["default"];
          }, {}] }, {}, [1])(1);
        });
      });
      var HyperList = unwrapExports(hyperlist);
      var BodyRenderer = class {
        constructor(instance) {
          this.instance = instance;
          this.options = instance.options;
          this.datamanager = instance.datamanager;
          this.rowmanager = instance.rowmanager;
          this.cellmanager = instance.cellmanager;
          this.bodyScrollable = instance.bodyScrollable;
          this.footer = this.instance.footer;
          this.log = instance.log;
        }
        renderRows(rows) {
          this.visibleRows = rows;
          this.visibleRowIndices = rows.map((row) => row.meta.rowIndex);
          if (rows.length === 0) {
            this.bodyScrollable.innerHTML = this.getNoDataHTML();
            return;
          }
          const rowViewOrder = this.datamanager.rowViewOrder.map((index) => {
            if (this.visibleRowIndices.includes(index)) {
              return index;
            }
            return null;
          }).filter((index) => index !== null);
          const computedStyle = getComputedStyle(this.bodyScrollable);
          let config2 = {
            width: computedStyle.width,
            height: computedStyle.height,
            itemHeight: this.options.cellHeight,
            total: rows.length,
            generate: (index) => {
              const el = document.createElement("div");
              const rowIndex = rowViewOrder[index];
              const row = this.datamanager.getRow(rowIndex);
              const rowHTML = this.rowmanager.getRowHTML(row, row.meta);
              el.innerHTML = rowHTML;
              return el.children[0];
            },
            afterRender: () => {
              this.restoreState();
            }
          };
          if (!this.hyperlist) {
            this.hyperlist = new HyperList(this.bodyScrollable, config2);
          } else {
            this.hyperlist.refresh(this.bodyScrollable, config2);
          }
          this.renderFooter();
        }
        render() {
          const rows = this.datamanager.getRowsForView();
          this.renderRows(rows);
          this.instance.setDimensions();
        }
        renderFooter() {
          if (!this.options.showTotalRow)
            return;
          const totalRow = this.getTotalRow();
          let html = this.rowmanager.getRowHTML(totalRow, { isTotalRow: 1, rowIndex: "totalRow" });
          this.footer.innerHTML = html;
        }
        getTotalRow() {
          const columns = this.datamanager.getColumns();
          const totalRowTemplate = columns.map((col) => {
            let content = null;
            if (["_rowIndex", "_checkbox"].includes(col.id)) {
              content = "";
            }
            return {
              content,
              isTotalRow: 1,
              colIndex: col.colIndex,
              column: col
            };
          });
          const totalRow = totalRowTemplate.map((cell, i) => {
            if (cell.content === "")
              return cell;
            if (this.options.hooks.columnTotal) {
              const columnValues = this.visibleRows.map((row) => row[i].content);
              const result = this.options.hooks.columnTotal.call(this.instance, columnValues, cell);
              if (result != null) {
                cell.content = result;
                return cell;
              }
            }
            cell.content = this.visibleRows.reduce((acc, prevRow) => {
              const prevCell = prevRow[i];
              if (typeof prevCell.content === "number") {
                if (acc == null)
                  acc = 0;
                return acc + prevCell.content;
              }
              return acc;
            }, cell.content);
            return cell;
          });
          return totalRow;
        }
        restoreState() {
          this.rowmanager.highlightCheckedRows();
          this.cellmanager.selectAreaOnClusterChanged();
          this.cellmanager.focusCellOnClusterChanged();
        }
        showToastMessage(message, hideAfter) {
          this.instance.toastMessage.innerHTML = this.getToastMessageHTML(message);
          if (hideAfter) {
            setTimeout(() => {
              this.clearToastMessage();
            }, hideAfter * 1e3);
          }
        }
        clearToastMessage() {
          this.instance.toastMessage.innerHTML = "";
        }
        getNoDataHTML() {
          return `<div class="dt-scrollable__no-data">${this.options.noDataMessage}</div>`;
        }
        getToastMessageHTML(message) {
          return `<span class="dt-toast__message">${message}</span>`;
        }
      };
      var Style = class {
        constructor(instance) {
          this.instance = instance;
          linkProperties(this, this.instance, [
            "options",
            "datamanager",
            "columnmanager",
            "header",
            "footer",
            "bodyScrollable",
            "datatableWrapper",
            "getColumn",
            "bodyRenderer"
          ]);
          this.scopeClass = "dt-instance-" + instance.constructor.instances;
          instance.datatableWrapper.classList.add(this.scopeClass);
          const styleEl = document.createElement("style");
          instance.wrapper.insertBefore(styleEl, instance.datatableWrapper);
          this.styleEl = styleEl;
          this.bindResizeWindow();
          this.bindScrollHeader();
        }
        get stylesheet() {
          return this.styleEl.sheet;
        }
        bindResizeWindow() {
          this.onWindowResize = this.onWindowResize.bind(this);
          this.onWindowResize = throttle$1(this.onWindowResize, 300);
          if (this.options.layout === "fluid") {
            $2.on(window, "resize", this.onWindowResize);
          }
        }
        bindScrollHeader() {
          this._settingHeaderPosition = false;
          $2.on(this.bodyScrollable, "scroll", (e) => {
            if (this._settingHeaderPosition)
              return;
            this._settingHeaderPosition = true;
            requestAnimationFrame(() => {
              const left = -e.target.scrollLeft;
              $2.style(this.header, {
                transform: `translateX(${left}px)`
              });
              $2.style(this.footer, {
                transform: `translateX(${left}px)`
              });
              this._settingHeaderPosition = false;
            });
          });
        }
        onWindowResize() {
          this.distributeRemainingWidth();
          this.refreshColumnWidth();
          this.setBodyStyle();
        }
        destroy() {
          this.styleEl.remove();
          $2.off(window, "resize", this.onWindowResize);
        }
        setStyle(selector, styleObject) {
          if (selector.includes(",")) {
            selector.split(",").map((s) => s.trim()).forEach((selector2) => {
              this.setStyle(selector2, styleObject);
            });
            return;
          }
          selector = selector.trim();
          if (!selector)
            return;
          this._styleRulesMap = this._styleRulesMap || {};
          const prefixedSelector = this._getPrefixedSelector(selector);
          if (this._styleRulesMap[prefixedSelector]) {
            this.removeStyle(selector);
            styleObject = Object.assign({}, this._styleRulesMap[prefixedSelector], styleObject);
          }
          const styleString = this._getRuleString(styleObject);
          const ruleString = `${prefixedSelector} { ${styleString} }`;
          this._styleRulesMap[prefixedSelector] = styleObject;
          this.stylesheet.insertRule(ruleString);
        }
        removeStyle(selector) {
          if (selector.includes(",")) {
            selector.split(",").map((s) => s.trim()).forEach((selector2) => {
              this.removeStyle(selector2);
            });
            return;
          }
          selector = selector.trim();
          if (!selector)
            return;
          const prefixedSelector = this._getPrefixedSelector(selector);
          const index = Array.from(this.stylesheet.cssRules).findIndex((rule) => rule.selectorText === prefixedSelector);
          if (index === -1)
            return;
          this.stylesheet.deleteRule(index);
        }
        _getPrefixedSelector(selector) {
          return `.${this.scopeClass} ${selector}`;
        }
        _getRuleString(styleObject) {
          return Object.keys(styleObject).map((prop) => {
            let dashed = prop;
            if (!prop.includes("-")) {
              dashed = camelCaseToDash(prop);
            }
            return `${dashed}:${styleObject[prop]};`;
          }).join("");
        }
        setDimensions() {
          this.setCellHeight();
          this.setupMinWidth();
          this.setupNaturalColumnWidth();
          this.setupColumnWidth();
          this.distributeRemainingWidth();
          this.setColumnStyle();
          this.setBodyStyle();
        }
        setCellHeight() {
          this.setStyle(".dt-cell", {
            height: this.options.cellHeight + "px"
          });
        }
        setupMinWidth() {
          $2.each(".dt-cell--header", this.header).map((col) => {
            const { colIndex } = $2.data(col);
            const column = this.getColumn(colIndex);
            if (!column.minWidth) {
              const width = $2.style($2(".dt-cell__content", col), "width");
              column.minWidth = width;
            }
          });
        }
        setupNaturalColumnWidth() {
          if (!$2(".dt-row"))
            return;
          $2.each(".dt-row-header .dt-cell", this.header).map(($headerCell) => {
            const { colIndex } = $2.data($headerCell);
            const column = this.datamanager.getColumn(colIndex);
            let width = $2.style($2(".dt-cell__content", $headerCell), "width");
            if (typeof width === "number" && width >= this.options.minimumColumnWidth) {
              column.naturalWidth = width;
            } else {
              column.naturalWidth = this.options.minimumColumnWidth;
            }
          });
          $2.each(".dt-row-0 .dt-cell", this.bodyScrollable).map(($cell) => {
            const {
              colIndex
            } = $2.data($cell);
            const column = this.datamanager.getColumn(colIndex);
            let naturalWidth = $2.style($2(".dt-cell__content", $cell), "width");
            if (typeof naturalWidth === "number" && naturalWidth >= column.naturalWidth) {
              column.naturalWidth = naturalWidth;
            } else {
              column.naturalWidth = column.naturalWidth;
            }
          });
        }
        setupColumnWidth() {
          if (this.options.layout === "ratio") {
            let totalWidth = $2.style(this.datatableWrapper, "width");
            if (this.options.serialNoColumn) {
              const rowIndexColumn = this.datamanager.getColumnById("_rowIndex");
              totalWidth = totalWidth - rowIndexColumn.width - 1;
            }
            if (this.options.checkboxColumn) {
              const rowIndexColumn = this.datamanager.getColumnById("_checkbox");
              totalWidth = totalWidth - rowIndexColumn.width - 1;
            }
            const totalParts = this.datamanager.getColumns().map((column) => {
              if (column.id === "_rowIndex" || column.id === "_checkbox") {
                return 0;
              }
              if (!column.width) {
                column.width = 1;
              }
              column.ratioWidth = parseInt(column.width, 10);
              return column.ratioWidth;
            }).reduce((a, c) => a + c);
            const onePart = totalWidth / totalParts;
            this.datamanager.getColumns().map((column) => {
              if (column.id === "_rowIndex" || column.id === "_checkbox")
                return;
              column.width = Math.floor(onePart * column.ratioWidth) - 1;
            });
          } else {
            this.datamanager.getColumns().map((column) => {
              if (!column.width) {
                column.width = column.naturalWidth;
              }
              if (column.id === "_rowIndex") {
                column.width = this.getRowIndexColumnWidth();
              }
              if (column.width < this.options.minimumColumnWidth) {
                column.width = this.options.minimumColumnWidth;
              }
            });
          }
        }
        distributeRemainingWidth() {
          if (this.options.layout !== "fluid")
            return;
          const wrapperWidth = $2.style(this.instance.datatableWrapper, "width");
          let firstRow = $2(".dt-row", this.bodyScrollable);
          let firstRowWidth = wrapperWidth;
          if (!firstRow) {
            let headerRow = $2(".dt-row", this.instance.header);
            let cellWidths = Array.from(headerRow.children).map((cell) => cell.offsetWidth);
            firstRowWidth = cellWidths.reduce((sum, a) => sum + a, 0);
          } else {
            firstRowWidth = $2.style(firstRow, "width");
          }
          const resizableColumns = this.datamanager.getColumns().filter((col) => col.resizable);
          const deltaWidth = (wrapperWidth - firstRowWidth) / resizableColumns.length;
          resizableColumns.map((col) => {
            const width = $2.style(this.getColumnHeaderElement(col.colIndex), "width");
            let finalWidth = Math.floor(width + deltaWidth) - 2;
            this.datamanager.updateColumn(col.colIndex, {
              width: finalWidth
            });
          });
        }
        setColumnStyle() {
          this.datamanager.getColumns().map((column) => {
            if (!column.align) {
              column.align = "left";
            }
            if (!["left", "center", "right"].includes(column.align)) {
              column.align = "left";
            }
            this.setStyle(`.dt-cell--col-${column.colIndex}`, {
              "text-align": column.align
            });
            this.columnmanager.setColumnHeaderWidth(column.colIndex);
            this.columnmanager.setColumnWidth(column.colIndex);
          });
        }
        refreshColumnWidth() {
          this.datamanager.getColumns().map((column) => {
            this.columnmanager.setColumnHeaderWidth(column.colIndex);
            this.columnmanager.setColumnWidth(column.colIndex);
          });
        }
        setBodyStyle() {
          const bodyWidth = $2.style(this.datatableWrapper, "width");
          const firstRow = $2(".dt-row", this.bodyScrollable);
          if (!firstRow)
            return;
          const rowWidth = $2.style(firstRow, "width");
          let width = bodyWidth > rowWidth ? rowWidth : bodyWidth;
          $2.style(this.bodyScrollable, {
            width: width + "px"
          });
          $2.removeStyle(this.bodyScrollable, "height");
          let bodyHeight = $2.getStyle(this.bodyScrollable, "height");
          const scrollHeight = (this.bodyRenderer.hyperlist || {})._scrollHeight || Infinity;
          const hasHorizontalOverflow = $2.hasHorizontalOverflow(this.bodyScrollable);
          let height;
          if (scrollHeight < bodyHeight) {
            height = scrollHeight;
            if (hasHorizontalOverflow) {
              height += $2.scrollbarSize();
            }
            $2.style(this.bodyScrollable, {
              height: height + "px"
            });
          }
          const verticalOverflow = this.bodyScrollable.scrollHeight - this.bodyScrollable.offsetHeight;
          if (verticalOverflow < $2.scrollbarSize()) {
            $2.style(this.bodyScrollable, {
              overflowY: "hidden"
            });
          }
          if (this.options.layout === "fluid") {
            $2.style(this.bodyScrollable, {
              overflowX: "hidden"
            });
          }
        }
        getColumnHeaderElement(colIndex) {
          colIndex = +colIndex;
          if (colIndex < 0)
            return null;
          return $2(`.dt-cell--col-${colIndex}`, this.header);
        }
        getRowIndexColumnWidth() {
          const rowCount = this.datamanager.getRowCount();
          const padding = 22;
          return $2.measureTextWidth(rowCount + "") + padding;
        }
      };
      var KEYCODES = {
        13: "enter",
        91: "meta",
        16: "shift",
        17: "ctrl",
        18: "alt",
        37: "left",
        38: "up",
        39: "right",
        40: "down",
        9: "tab",
        27: "esc",
        67: "c",
        70: "f",
        86: "v"
      };
      var Keyboard = class {
        constructor(element) {
          this.listeners = {};
          $2.on(element, "keydown", this.handler.bind(this));
        }
        handler(e) {
          let key = KEYCODES[e.keyCode];
          if (e.shiftKey && key !== "shift") {
            key = "shift+" + key;
          }
          if (e.ctrlKey && key !== "ctrl" || e.metaKey && key !== "meta") {
            key = "ctrl+" + key;
          }
          const listeners = this.listeners[key];
          if (listeners && listeners.length > 0) {
            for (let listener of listeners) {
              const preventBubbling = listener(e);
              if (preventBubbling === void 0 || preventBubbling === true) {
                e.preventDefault();
              }
            }
          }
        }
        on(key, listener) {
          const keys = key.split(",").map((k) => k.trim());
          keys.map((key2) => {
            this.listeners[key2] = this.listeners[key2] || [];
            this.listeners[key2].push(listener);
          });
        }
      };
      var en = {
        "Sort Ascending": "Sort Ascending",
        "Sort Descending": "Sort Descending",
        "Reset sorting": "Reset sorting",
        "Remove column": "Remove column",
        "No Data": "No Data",
        "{count} cells copied": { "1": "{count} cell copied", "default": "{count} cells copied" },
        "{count} rows selected": { "1": "{count} row selected", "default": "{count} rows selected" }
      };
      var de = {
        "Sort Ascending": "Aufsteigend sortieren",
        "Sort Descending": "Absteigend sortieren",
        "Reset sorting": "Sortierung zur\xFCcksetzen",
        "Remove column": "Spalte entfernen",
        "No Data": "Keine Daten",
        "{count} cells copied": { "1": "{count} Zelle kopiert", "default": "{count} Zellen kopiert" },
        "{count} rows selected": { "1": "{count} Zeile ausgew\xE4hlt", "default": "{count} Zeilen ausgew\xE4hlt" }
      };
      var fr = {
        "Sort Ascending": "Trier par ordre croissant",
        "Sort Descending": "Trier par ordre d\xE9croissant",
        "Reset sorting": "R\xE9initialiser le tri",
        "Remove column": "Supprimer colonne",
        "No Data": "Pas de donn\xE9es",
        "{count} cells copied": { "1": "{count} cellule copi\xE9e", "default": "{count} cellules copi\xE9es" },
        "{count} rows selected": { "1": "{count} ligne s\xE9lectionn\xE9e", "default": "{count} lignes s\xE9lectionn\xE9es" }
      };
      var it = {
        "Sort Ascending": "Ordinamento ascendente",
        "Sort Descending": "Ordinamento decrescente",
        "Reset sorting": "Azzeramento ordinamento",
        "Remove column": "Rimuovi colonna",
        "No Data": "Nessun dato",
        "{count} cells copied": { "1": "Copiato {count} cella", "default": "{count} celle copiate" },
        "{count} rows selected": { "1": "{count} linea selezionata", "default": "{count} linee selezionate" }
      };
      function getTranslations() {
        return {
          en,
          de,
          fr,
          it
        };
      }
      var TranslationManager = class {
        constructor(language) {
          this.language = language;
          this.translations = getTranslations();
        }
        addTranslations(translations) {
          this.translations = Object.assign(this.translations, translations);
        }
        translate(sourceText, args) {
          let translation = this.translations[this.language] && this.translations[this.language][sourceText] || sourceText;
          if (typeof translation === "object") {
            translation = args && args.count ? this.getPluralizedTranslation(translation, args.count) : sourceText;
          }
          return format(translation, args || {});
        }
        getPluralizedTranslation(translations, count) {
          return translations[count] || translations["default"];
        }
      };
      function filterRows(rows, filters) {
        let filteredRowIndices = [];
        if (Object.keys(filters).length === 0) {
          return rows.map((row) => row.meta.rowIndex);
        }
        for (let colIndex in filters) {
          const keyword = filters[colIndex];
          const filteredRows = filteredRowIndices.length ? filteredRowIndices.map((i) => rows[i]) : rows;
          const cells = filteredRows.map((row) => row[colIndex]);
          let filter = guessFilter(keyword);
          let filterMethod = getFilterMethod(filter);
          if (filterMethod) {
            filteredRowIndices = filterMethod(filter.text, cells);
          } else {
            filteredRowIndices = cells.map((cell) => cell.rowIndex);
          }
        }
        return filteredRowIndices;
      }
      function getFilterMethod(filter) {
        const stringCompareValue = (cell) => String(stripHTML(cell.html || "") || cell.content || "").toLowerCase();
        const numberCompareValue = (cell) => parseFloat(cell.content);
        const getCompareValues = (cell, keyword) => {
          if (cell.column.compareValue) {
            const compareValues = cell.column.compareValue(cell, keyword);
            if (compareValues && Array.isArray(compareValues))
              return compareValues;
          }
          const float = numberCompareValue(cell);
          if (!isNaN(float)) {
            return [float, keyword];
          }
          return [stringCompareValue(cell), keyword];
        };
        let filterMethodMap = {
          contains(keyword, cells) {
            return cells.filter((cell) => {
              const hay = stringCompareValue(cell);
              const needle = (keyword || "").toLowerCase();
              return !needle || hay.includes(needle);
            }).map((cell) => cell.rowIndex);
          },
          greaterThan(keyword, cells) {
            return cells.filter((cell) => {
              const [compareValue, keywordValue] = getCompareValues(cell, keyword);
              return compareValue > keywordValue;
            }).map((cell) => cell.rowIndex);
          },
          lessThan(keyword, cells) {
            return cells.filter((cell) => {
              const [compareValue, keywordValue] = getCompareValues(cell, keyword);
              return compareValue < keywordValue;
            }).map((cell) => cell.rowIndex);
          },
          equals(keyword, cells) {
            return cells.filter((cell) => {
              const value = parseFloat(cell.content);
              return value === keyword;
            }).map((cell) => cell.rowIndex);
          },
          notEquals(keyword, cells) {
            return cells.filter((cell) => {
              const value = parseFloat(cell.content);
              return value !== keyword;
            }).map((cell) => cell.rowIndex);
          },
          range(rangeValues, cells) {
            return cells.filter((cell) => {
              const values1 = getCompareValues(cell, rangeValues[0]);
              const values2 = getCompareValues(cell, rangeValues[1]);
              const value = values1[0];
              return value >= values1[1] && value <= values2[1];
            }).map((cell) => cell.rowIndex);
          },
          containsNumber(keyword, cells) {
            return cells.filter((cell) => {
              let number = parseFloat(keyword, 10);
              let string = keyword;
              let hayNumber = numberCompareValue(cell);
              let hayString = stringCompareValue(cell);
              return number === hayNumber || hayString.includes(string);
            }).map((cell) => cell.rowIndex);
          }
        };
        return filterMethodMap[filter.type];
      }
      function guessFilter(keyword = "") {
        if (keyword.length === 0)
          return {};
        let compareString = keyword;
        if ([">", "<", "="].includes(compareString[0])) {
          compareString = keyword.slice(1);
        } else if (compareString.startsWith("!=")) {
          compareString = keyword.slice(2);
        }
        if (keyword.startsWith(">")) {
          if (compareString) {
            return {
              type: "greaterThan",
              text: compareString.trim()
            };
          }
        }
        if (keyword.startsWith("<")) {
          if (compareString) {
            return {
              type: "lessThan",
              text: compareString.trim()
            };
          }
        }
        if (keyword.startsWith("=")) {
          if (isNumber(compareString)) {
            return {
              type: "equals",
              text: Number(keyword.slice(1).trim())
            };
          }
        }
        if (isNumber(compareString)) {
          return {
            type: "containsNumber",
            text: compareString
          };
        }
        if (keyword.startsWith("!=")) {
          if (isNumber(compareString)) {
            return {
              type: "notEquals",
              text: Number(keyword.slice(2).trim())
            };
          }
        }
        if (keyword.split(":").length === 2) {
          compareString = keyword.split(":");
          return {
            type: "range",
            text: compareString.map((v) => v.trim())
          };
        }
        return {
          type: "contains",
          text: compareString.toLowerCase()
        };
      }
      function getDefaultOptions(instance) {
        return {
          columns: [],
          data: [],
          dropdownButton: icons.chevronDown,
          headerDropdown: [
            {
              label: instance.translate("Sort Ascending"),
              action: function(column) {
                this.sortColumn(column.colIndex, "asc");
              }
            },
            {
              label: instance.translate("Sort Descending"),
              action: function(column) {
                this.sortColumn(column.colIndex, "desc");
              }
            },
            {
              label: instance.translate("Reset sorting"),
              action: function(column) {
                this.sortColumn(column.colIndex, "none");
              }
            },
            {
              label: instance.translate("Remove column"),
              action: function(column) {
                this.removeColumn(column.colIndex);
              }
            }
          ],
          events: {
            onRemoveColumn(column) {
            },
            onSwitchColumn(column1, column2) {
            },
            onSortColumn(column) {
            },
            onCheckRow(row) {
            },
            onDestroy() {
            }
          },
          hooks: {
            columnTotal: null
          },
          sortIndicator: {
            asc: "\u2191",
            desc: "\u2193",
            none: ""
          },
          overrideComponents: {},
          filterRows,
          freezeMessage: "",
          getEditor: null,
          serialNoColumn: true,
          checkboxColumn: false,
          clusterize: true,
          logs: false,
          layout: "fixed",
          noDataMessage: instance.translate("No Data"),
          cellHeight: 40,
          minimumColumnWidth: 30,
          inlineFilters: false,
          treeView: false,
          checkedRowStatus: true,
          dynamicRowHeight: false,
          pasteFromClipboard: false,
          showTotalRow: false,
          direction: "ltr",
          disableReorderColumn: false
        };
      }
      var defaultComponents = {
        DataManager,
        CellManager,
        ColumnManager,
        RowManager,
        BodyRenderer,
        Style,
        Keyboard
      };
      var DataTable2 = class {
        constructor(wrapper, options) {
          DataTable2.instances++;
          if (typeof wrapper === "string") {
            wrapper = document.querySelector(wrapper);
          }
          this.wrapper = wrapper;
          if (!(this.wrapper instanceof HTMLElement)) {
            throw new Error("Invalid argument given for `wrapper`");
          }
          this.initializeTranslations(options);
          this.setDefaultOptions();
          this.buildOptions(options);
          this.prepare();
          this.initializeComponents();
          if (this.options.data) {
            this.refresh();
            this.columnmanager.applyDefaultSortOrder();
          }
        }
        initializeTranslations(options) {
          this.language = options.language || "en";
          this.translationManager = new TranslationManager(this.language);
          if (options.translations) {
            this.translationManager.addTranslations(options.translations);
          }
        }
        setDefaultOptions() {
          this.DEFAULT_OPTIONS = getDefaultOptions(this);
        }
        buildOptions(options) {
          this.options = this.options || {};
          this.options = Object.assign({}, this.DEFAULT_OPTIONS, this.options || {}, options);
          options.headerDropdown = options.headerDropdown || [];
          this.options.headerDropdown = [
            ...this.DEFAULT_OPTIONS.headerDropdown,
            ...options.headerDropdown
          ];
          this.events = Object.assign({}, this.DEFAULT_OPTIONS.events, this.options.events || {}, options.events || {});
          this.fireEvent = this.fireEvent.bind(this);
        }
        prepare() {
          this.prepareDom();
          this.unfreeze();
        }
        initializeComponents() {
          let components = Object.assign({}, defaultComponents, this.options.overrideComponents);
          let {
            Style: Style$$1,
            Keyboard: Keyboard$$1,
            DataManager: DataManager$$1,
            RowManager: RowManager$$1,
            ColumnManager: ColumnManager$$1,
            CellManager: CellManager$$1,
            BodyRenderer: BodyRenderer$$1
          } = components;
          this.style = new Style$$1(this);
          this.keyboard = new Keyboard$$1(this.wrapper);
          this.datamanager = new DataManager$$1(this.options);
          this.rowmanager = new RowManager$$1(this);
          this.columnmanager = new ColumnManager$$1(this);
          this.cellmanager = new CellManager$$1(this);
          this.bodyRenderer = new BodyRenderer$$1(this);
        }
        prepareDom() {
          this.wrapper.innerHTML = `
            <div class="datatable" dir="${this.options.direction}">
                <div class="dt-header"></div>
                <div class="dt-scrollable"></div>
                <div class="dt-footer"></div>
                <div class="dt-freeze">
                    <span class="dt-freeze__message">
                        ${this.options.freezeMessage}
                    </span>
                </div>
                <div class="dt-toast"></div>
                <div class="dt-dropdown-container"></div>
                <textarea class="dt-paste-target"></textarea>
            </div>
        `;
          this.datatableWrapper = $2(".datatable", this.wrapper);
          this.header = $2(".dt-header", this.wrapper);
          this.footer = $2(".dt-footer", this.wrapper);
          this.bodyScrollable = $2(".dt-scrollable", this.wrapper);
          this.freezeContainer = $2(".dt-freeze", this.wrapper);
          this.toastMessage = $2(".dt-toast", this.wrapper);
          this.pasteTarget = $2(".dt-paste-target", this.wrapper);
          this.dropdownContainer = $2(".dt-dropdown-container", this.wrapper);
        }
        refresh(data, columns) {
          this.datamanager.init(data, columns);
          this.render();
          this.setDimensions();
        }
        destroy() {
          this.wrapper.innerHTML = "";
          this.style.destroy();
          this.fireEvent("onDestroy");
        }
        appendRows(rows) {
          this.datamanager.appendRows(rows);
          this.rowmanager.refreshRows();
        }
        refreshRow(row, rowIndex) {
          this.rowmanager.refreshRow(row, rowIndex);
        }
        render() {
          this.renderHeader();
          this.renderBody();
        }
        renderHeader() {
          this.columnmanager.renderHeader();
        }
        renderBody() {
          this.bodyRenderer.render();
        }
        setDimensions() {
          this.style.setDimensions();
        }
        showToastMessage(message, hideAfter) {
          this.bodyRenderer.showToastMessage(message, hideAfter);
        }
        clearToastMessage() {
          this.bodyRenderer.clearToastMessage();
        }
        getColumn(colIndex) {
          return this.datamanager.getColumn(colIndex);
        }
        getColumns() {
          return this.datamanager.getColumns();
        }
        getRows() {
          return this.datamanager.getRows();
        }
        getCell(colIndex, rowIndex) {
          return this.datamanager.getCell(colIndex, rowIndex);
        }
        getColumnHeaderElement(colIndex) {
          return this.columnmanager.getColumnHeaderElement(colIndex);
        }
        getViewportHeight() {
          if (!this.viewportHeight) {
            this.viewportHeight = $2.style(this.bodyScrollable, "height");
          }
          return this.viewportHeight;
        }
        sortColumn(colIndex, sortOrder) {
          this.columnmanager.sortColumn(colIndex, sortOrder);
        }
        removeColumn(colIndex) {
          this.columnmanager.removeColumn(colIndex);
        }
        scrollToLastColumn() {
          this.datatableWrapper.scrollLeft = 9999;
        }
        freeze() {
          $2.style(this.freezeContainer, {
            display: ""
          });
        }
        unfreeze() {
          $2.style(this.freezeContainer, {
            display: "none"
          });
        }
        updateOptions(options) {
          this.buildOptions(options);
        }
        fireEvent(eventName, ...args) {
          const handlers = [
            ...this._internalEventHandlers[eventName] || [],
            this.events[eventName]
          ].filter(Boolean);
          for (let handler of handlers) {
            handler.apply(this, args);
          }
        }
        on(event, handler) {
          this._internalEventHandlers = this._internalEventHandlers || {};
          this._internalEventHandlers[event] = this._internalEventHandlers[event] || [];
          this._internalEventHandlers[event].push(handler);
        }
        log() {
          if (this.options.logs) {
            console.log.apply(console, arguments);
          }
        }
        translate(str, args) {
          return this.translationManager.translate(str, args);
        }
      };
      DataTable2.instances = 0;
      var name = "frappe-datatable";
      var version = "0.0.0-development";
      var description = "A modern datatable library for the web";
      var main = "dist/frappe-datatable.cjs.js";
      var unpkg = "dist/frappe-datatable.min.js";
      var jsdelivr = "dist/frappe-datatable.min.js";
      var scripts = { "start": "yarn run dev", "build": "rollup -c && NODE_ENV=production rollup -c", "dev": "rollup -c -w", "cy:server": "http-server -p 8989", "cy:open": "cypress open", "cy:run": "cypress run", "test": "start-server-and-test cy:server http://localhost:8989 cy:run", "test-local": "start-server-and-test cy:server http://localhost:8989 cy:open", "travis-deploy-once": "travis-deploy-once", "semantic-release": "semantic-release", "lint": "eslint src", "lint-and-build": "yarn lint && yarn build", "commit": "npx git-cz" };
      var files = ["dist", "src"];
      var devDependencies = { "autoprefixer": "^9.0.0", "chai": "3.5.0", "cypress": "^9.2.0", "cz-conventional-changelog": "^2.1.0", "deepmerge": "^2.0.1", "eslint": "^5.0.1", "eslint-config-airbnb": "^16.1.0", "eslint-config-airbnb-base": "^12.1.0", "eslint-plugin-import": "^2.11.0", "http-server": "^0.11.1", "mocha": "3.3.0", "postcss-custom-properties": "^7.0.0", "postcss-nested": "^3.0.0", "rollup": "^0.59.4", "rollup-plugin-commonjs": "^8.3.0", "rollup-plugin-eslint": "^4.0.0", "rollup-plugin-json": "^2.3.0", "rollup-plugin-node-resolve": "^3.0.3", "rollup-plugin-postcss": "^1.2.8", "rollup-plugin-uglify-es": "^0.0.1", "semantic-release": "^17.1.1", "start-server-and-test": "^1.4.1", "travis-deploy-once": "^5.0.1" };
      var repository = { "type": "git", "url": "https://github.com/frappe/datatable.git" };
      var keywords = ["datatable", "data", "grid", "table"];
      var author = "Faris Ansari";
      var license = "MIT";
      var bugs = { "url": "https://github.com/frappe/datatable/issues" };
      var homepage = "https://frappe.io/datatable";
      var dependencies = { "hyperlist": "^1.0.0-beta", "lodash": "^4.17.5", "sortablejs": "^1.7.0" };
      var config = { "commitizen": { "path": "cz-conventional-changelog" } };
      var packageJson = {
        name,
        version,
        description,
        main,
        unpkg,
        jsdelivr,
        scripts,
        files,
        devDependencies,
        repository,
        keywords,
        author,
        license,
        bugs,
        homepage,
        dependencies,
        config
      };
      DataTable2.__version__ = packageJson.version;
      module.exports = DataTable2;
    }
  });

  // ../engr/engr/public/js/taxes_and_totals.js
  erpnext.taxes_and_totals = class TaxesAndTotals extends erpnext.payments {
    setup() {
      this.fetch_round_off_accounts();
    }
    apply_pricing_rule_on_item(item) {
      let effective_item_rate = item.price_list_rate;
      let item_rate = item.rate;
      if (in_list(["Sales Order", "Quotation"], item.parenttype) && item.blanket_order_rate) {
        effective_item_rate = item.blanket_order_rate;
      }
      if (item.margin_type == "Percentage") {
        item.rate_with_margin = flt(effective_item_rate) + flt(effective_item_rate) * (flt(item.margin_rate_or_amount) / 100);
      } else {
        item.rate_with_margin = flt(effective_item_rate) + flt(item.margin_rate_or_amount);
      }
      item.base_rate_with_margin = flt(item.rate_with_margin) * flt(this.frm.doc.conversion_rate);
      item_rate = flt(item.rate_with_margin, precision("rate", item));
      if (item.discount_percentage) {
        item.discount_amount = flt(item.rate_with_margin) * flt(item.discount_percentage) / 100;
      }
      if (item.discount_amount) {
        item_rate = flt(item.rate_with_margin - item.discount_amount, precision("rate", item));
        item.discount_percentage = 100 * flt(item.discount_amount) / flt(item.rate_with_margin);
      }
      frappe.model.set_value(item.doctype, item.name, "rate", item_rate);
    }
    calculate_taxes_and_totals(update_paid_amount) {
      this.discount_amount_applied = false;
      this._calculate_taxes_and_totals();
      this.calculate_discount_amount();
      if (in_list(["Sales Invoice", "POS Invoice", "Purchase Invoice"], this.frm.doc.doctype) && this.frm.doc.docstatus < 2 && !this.frm.doc.is_return) {
        this.calculate_total_advance(update_paid_amount);
      }
      if (in_list(["Sales Invoice", "POS Invoice"], this.frm.doc.doctype) && this.frm.doc.is_pos && this.frm.doc.is_return) {
        this.update_paid_amount_for_return();
      }
      if (in_list(["Quotation", "Sales Order", "Delivery Note", "Sales Invoice", "Proforma Invoice"], this.frm.doc.doctype)) {
        this.calculate_commission();
        this.calculate_contribution();
      }
      if (this.frm.doc.doctype === "Purchase Invoice" && this.frm.doc.is_return && this.frm.doc.grand_total > this.frm.doc.paid_amount) {
        this.frm.doc.paid_amount = flt(this.frm.doc.grand_total, precision("grand_total"));
      }
      this.frm.refresh_fields();
    }
    calculate_discount_amount() {
      if (frappe.meta.get_docfield(this.frm.doc.doctype, "discount_amount")) {
        this.calculate_item_values();
        this.calculate_net_total();
        this.set_discount_amount();
        this.apply_discount_amount();
      }
    }
    _calculate_taxes_and_totals() {
      this.validate_conversion_rate();
      this.calculate_item_values();
      this.initialize_taxes();
      this.determine_exclusive_rate();
      this.calculate_net_total();
      this.calculate_taxes();
      this.manipulate_grand_total_for_inclusive_tax();
      this.calculate_totals();
      this._cleanup();
    }
    validate_conversion_rate() {
      this.frm.doc.conversion_rate = flt(this.frm.doc.conversion_rate, cur_frm ? precision("conversion_rate") : 9);
      var conversion_rate_label = frappe.meta.get_label(this.frm.doc.doctype, "conversion_rate", this.frm.doc.name);
      var company_currency = this.get_company_currency();
      if (!this.frm.doc.conversion_rate) {
        if (this.frm.doc.currency == company_currency) {
          this.frm.set_value("conversion_rate", 1);
        } else {
          const subs = [conversion_rate_label, this.frm.doc.currency, company_currency];
          const err_message = __("{0} is mandatory. Maybe Currency Exchange record is not created for {1} to {2}", subs);
          frappe.throw(err_message);
        }
      }
    }
    calculate_item_values() {
      let me = this;
      if (!this.discount_amount_applied) {
        $.each(this.frm.doc["items"] || [], function(i, item) {
          frappe.model.round_floats_in(item);
          item.net_rate = item.rate;
          if (!item.qty && me.frm.doc.is_return) {
            item.amount = flt(item.rate * -1, precision("amount", item));
          } else if (item.uom == "Percent") {
            item.amount = flt(item.rate * item.qty / 100, precision("amount", item));
          } else {
            item.amount = flt(item.rate * item.qty, precision("amount", item));
          }
          item.net_amount = item.amount;
          item.item_tax_amount = 0;
          item.total_weight = flt(item.weight_per_unit * item.stock_qty);
          me.set_in_company_currency(item, ["price_list_rate", "rate", "amount", "net_rate", "net_amount"]);
        });
      }
    }
    set_in_company_currency(doc, fields) {
      var me = this;
      $.each(fields, function(i, f) {
        doc["base_" + f] = flt(flt(doc[f], precision(f, doc)) * me.frm.doc.conversion_rate, precision("base_" + f, doc));
      });
    }
    initialize_taxes() {
      var me = this;
      $.each(this.frm.doc["taxes"] || [], function(i, tax) {
        tax.item_wise_tax_detail = {};
        var tax_fields = [
          "total",
          "tax_amount_after_discount_amount",
          "tax_amount_for_current_item",
          "grand_total_for_current_item",
          "tax_fraction_for_current_item",
          "grand_total_fraction_for_current_item"
        ];
        if (cstr(tax.charge_type) != "Actual" && !(me.discount_amount_applied && me.frm.doc.apply_discount_on == "Grand Total")) {
          tax_fields.push("tax_amount");
        }
        $.each(tax_fields, function(i2, fieldname) {
          tax[fieldname] = 0;
        });
        if (!this.discount_amount_applied && cur_frm) {
          cur_frm.cscript.validate_taxes_and_charges(tax.doctype, tax.name);
          me.validate_inclusive_tax(tax);
        }
        frappe.model.round_floats_in(tax);
      });
    }
    fetch_round_off_accounts() {
      let me = this;
      frappe.flags.round_off_applicable_accounts = [];
      if (me.frm.doc.company) {
        return frappe.call({
          "method": "erpnext.controllers.taxes_and_totals.get_round_off_applicable_accounts",
          "args": {
            "company": me.frm.doc.company,
            "account_list": frappe.flags.round_off_applicable_accounts
          },
          callback: function(r) {
            frappe.flags.round_off_applicable_accounts.push(r.message);
          }
        });
      }
    }
    determine_exclusive_rate() {
      var me = this;
      var has_inclusive_tax = false;
      $.each(me.frm.doc["taxes"] || [], function(i, row) {
        if (cint(row.included_in_print_rate))
          has_inclusive_tax = true;
      });
      if (has_inclusive_tax == false)
        return;
      $.each(me.frm.doc["items"] || [], function(n, item) {
        var item_tax_map = me._load_item_tax_rate(item.item_tax_rate);
        var cumulated_tax_fraction = 0;
        var total_inclusive_tax_amount_per_qty = 0;
        $.each(me.frm.doc["taxes"] || [], function(i, tax) {
          var current_tax_fraction = me.get_current_tax_fraction(tax, item_tax_map);
          tax.tax_fraction_for_current_item = current_tax_fraction[0];
          var inclusive_tax_amount_per_qty = current_tax_fraction[1];
          if (i == 0) {
            tax.grand_total_fraction_for_current_item = 1 + tax.tax_fraction_for_current_item;
          } else {
            tax.grand_total_fraction_for_current_item = me.frm.doc["taxes"][i - 1].grand_total_fraction_for_current_item + tax.tax_fraction_for_current_item;
          }
          cumulated_tax_fraction += tax.tax_fraction_for_current_item;
          total_inclusive_tax_amount_per_qty += inclusive_tax_amount_per_qty * flt(item.qty);
        });
        if (!me.discount_amount_applied && item.qty && (total_inclusive_tax_amount_per_qty || cumulated_tax_fraction)) {
          var amount = flt(item.amount) - total_inclusive_tax_amount_per_qty;
          item.net_amount = flt(amount / (1 + cumulated_tax_fraction));
          item.net_rate = item.qty ? flt(item.net_amount / item.qty, precision("net_rate", item)) : 0;
          me.set_in_company_currency(item, ["net_rate", "net_amount"]);
        }
      });
    }
    get_current_tax_fraction(tax, item_tax_map) {
      var current_tax_fraction = 0;
      var inclusive_tax_amount_per_qty = 0;
      if (cint(tax.included_in_print_rate)) {
        var tax_rate = this._get_tax_rate(tax, item_tax_map);
        if (tax.charge_type == "On Net Total") {
          current_tax_fraction = tax_rate / 100;
        } else if (tax.charge_type == "On Previous Row Amount") {
          current_tax_fraction = tax_rate / 100 * this.frm.doc["taxes"][cint(tax.row_id) - 1].tax_fraction_for_current_item;
        } else if (tax.charge_type == "On Previous Row Total") {
          current_tax_fraction = tax_rate / 100 * this.frm.doc["taxes"][cint(tax.row_id) - 1].grand_total_fraction_for_current_item;
        } else if (tax.charge_type == "On Item Quantity") {
          inclusive_tax_amount_per_qty = flt(tax_rate);
        }
      }
      if (tax.add_deduct_tax && tax.add_deduct_tax == "Deduct") {
        current_tax_fraction *= -1;
        inclusive_tax_amount_per_qty *= -1;
      }
      return [current_tax_fraction, inclusive_tax_amount_per_qty];
    }
    _get_tax_rate(tax, item_tax_map) {
      return Object.keys(item_tax_map).indexOf(tax.account_head) != -1 ? flt(item_tax_map[tax.account_head], precision("rate", tax)) : tax.rate;
    }
    calculate_net_total() {
      var me = this;
      this.frm.doc.total_qty = this.frm.doc.total = this.frm.doc.base_total = this.frm.doc.net_total = this.frm.doc.base_net_total = 0;
      $.each(this.frm.doc["items"] || [], function(i, item) {
        me.frm.doc.total += item.amount;
        me.frm.doc.total_qty += item.qty;
        me.frm.doc.base_total += item.base_amount;
        me.frm.doc.net_total += item.net_amount;
        me.frm.doc.base_net_total += item.base_net_amount;
      });
      frappe.model.round_floats_in(this.frm.doc, ["total", "base_total", "net_total", "base_net_total"]);
    }
    add_taxes_from_item_tax_template(item_tax_map) {
      let me = this;
      if (item_tax_map && cint(frappe.defaults.get_default("add_taxes_from_item_tax_template"))) {
        if (typeof item_tax_map == "string") {
          item_tax_map = JSON.parse(item_tax_map);
        }
        $.each(item_tax_map, function(tax, rate) {
          let found = (me.frm.doc.taxes || []).find((d) => d.account_head === tax);
          if (!found) {
            let child = frappe.model.add_child(me.frm.doc, "taxes");
            child.charge_type = "On Net Total";
            child.account_head = tax;
            child.rate = 0;
          }
        });
      }
    }
    calculate_taxes() {
      var me = this;
      this.frm.doc.rounding_adjustment = 0;
      var actual_tax_dict = {};
      $.each(this.frm.doc["taxes"] || [], function(i, tax) {
        if (tax.charge_type == "Actual") {
          actual_tax_dict[tax.idx] = flt(tax.tax_amount, precision("tax_amount", tax));
        }
      });
      $.each(this.frm.doc["items"] || [], function(n, item) {
        var item_tax_map = me._load_item_tax_rate(item.item_tax_rate);
        $.each(me.frm.doc["taxes"] || [], function(i, tax) {
          var current_tax_amount = me.get_current_tax_amount(item, tax, item_tax_map);
          if (tax.charge_type == "Actual") {
            actual_tax_dict[tax.idx] -= current_tax_amount;
            if (n == me.frm.doc["items"].length - 1) {
              current_tax_amount += actual_tax_dict[tax.idx];
            }
          }
          if (tax.charge_type != "Actual" && !(me.discount_amount_applied && me.frm.doc.apply_discount_on == "Grand Total")) {
            tax.tax_amount += current_tax_amount;
          }
          tax.tax_amount_for_current_item = current_tax_amount;
          tax.tax_amount_after_discount_amount += current_tax_amount;
          if (tax.category) {
            current_tax_amount = tax.category == "Valuation" ? 0 : current_tax_amount;
            current_tax_amount *= tax.add_deduct_tax == "Deduct" ? -1 : 1;
          }
          if (i == 0) {
            tax.grand_total_for_current_item = flt(item.net_amount + current_tax_amount);
          } else {
            tax.grand_total_for_current_item = flt(me.frm.doc["taxes"][i - 1].grand_total_for_current_item + current_tax_amount);
          }
          if (n == me.frm.doc["items"].length - 1) {
            me.round_off_totals(tax);
            me.set_in_company_currency(tax, ["tax_amount", "tax_amount_after_discount_amount"]);
            me.round_off_base_values(tax);
            me.set_cumulative_total(i, tax);
            me.set_in_company_currency(tax, ["total"]);
            if (i == me.frm.doc["taxes"].length - 1 && me.discount_amount_applied && me.frm.doc.apply_discount_on == "Grand Total" && me.frm.doc.discount_amount) {
              me.frm.doc.rounding_adjustment = flt(me.frm.doc.grand_total - flt(me.frm.doc.discount_amount) - tax.total, precision("rounding_adjustment"));
            }
          }
        });
      });
    }
    set_cumulative_total(row_idx, tax) {
      var tax_amount = tax.tax_amount_after_discount_amount;
      if (tax.category == "Valuation") {
        tax_amount = 0;
      }
      if (tax.add_deduct_tax == "Deduct") {
        tax_amount = -1 * tax_amount;
      }
      if (row_idx == 0) {
        tax.total = flt(this.frm.doc.net_total + tax_amount, precision("total", tax));
      } else {
        tax.total = flt(this.frm.doc["taxes"][row_idx - 1].total + tax_amount, precision("total", tax));
      }
    }
    _load_item_tax_rate(item_tax_rate) {
      return item_tax_rate ? JSON.parse(item_tax_rate) : {};
    }
    get_current_tax_amount(item, tax, item_tax_map) {
      var tax_rate = this._get_tax_rate(tax, item_tax_map);
      var current_tax_amount = 0;
      if (["On Previous Row Amount", "On Previous Row Total"].includes(tax.charge_type)) {
        if (tax.idx === 1) {
          frappe.throw(__("Cannot select charge type as 'On Previous Row Amount' or 'On Previous Row Total' for first row"));
        }
        if (!tax.row_id) {
          tax.row_id = tax.idx - 1;
        }
      }
      if (tax.charge_type == "Actual") {
        var actual = flt(tax.tax_amount, precision("tax_amount", tax));
        current_tax_amount = this.frm.doc.net_total ? item.net_amount / this.frm.doc.net_total * actual : 0;
      } else if (tax.charge_type == "On Net Total") {
        current_tax_amount = tax_rate / 100 * item.net_amount;
      } else if (tax.charge_type == "On Previous Row Amount") {
        current_tax_amount = tax_rate / 100 * this.frm.doc["taxes"][cint(tax.row_id) - 1].tax_amount_for_current_item;
      } else if (tax.charge_type == "On Previous Row Total") {
        current_tax_amount = tax_rate / 100 * this.frm.doc["taxes"][cint(tax.row_id) - 1].grand_total_for_current_item;
      } else if (tax.charge_type == "On Item Quantity") {
        current_tax_amount = tax_rate * item.qty;
      }
      this.set_item_wise_tax(item, tax, tax_rate, current_tax_amount);
      return current_tax_amount;
    }
    set_item_wise_tax(item, tax, tax_rate, current_tax_amount) {
      let tax_detail = tax.item_wise_tax_detail;
      let key = item.item_code || item.item_name;
      if (typeof tax_detail == "string") {
        tax.item_wise_tax_detail = JSON.parse(tax.item_wise_tax_detail);
        tax_detail = tax.item_wise_tax_detail;
      }
      let item_wise_tax_amount = current_tax_amount * this.frm.doc.conversion_rate;
      if (tax_detail && tax_detail[key])
        item_wise_tax_amount += tax_detail[key][1];
      tax_detail[key] = [tax_rate, flt(item_wise_tax_amount, precision("base_tax_amount", tax))];
    }
    round_off_totals(tax) {
      if (frappe.flags.round_off_applicable_accounts.includes(tax.account_head)) {
        tax.tax_amount = Math.round(tax.tax_amount);
        tax.tax_amount_after_discount_amount = Math.round(tax.tax_amount_after_discount_amount);
      }
      tax.tax_amount = flt(tax.tax_amount, precision("tax_amount", tax));
      tax.tax_amount_after_discount_amount = flt(tax.tax_amount_after_discount_amount, precision("tax_amount", tax));
    }
    round_off_base_values(tax) {
      if (frappe.flags.round_off_applicable_accounts.includes(tax.account_head)) {
        tax.base_tax_amount = Math.round(tax.base_tax_amount);
        tax.base_tax_amount_after_discount_amount = Math.round(tax.base_tax_amount_after_discount_amount);
      }
    }
    manipulate_grand_total_for_inclusive_tax() {
      var me = this;
      if (this.frm.doc["taxes"] && this.frm.doc["taxes"].length) {
        var any_inclusive_tax = false;
        $.each(this.frm.doc.taxes || [], function(i, d) {
          if (cint(d.included_in_print_rate))
            any_inclusive_tax = true;
        });
        if (any_inclusive_tax) {
          var last_tax = me.frm.doc["taxes"].slice(-1)[0];
          var non_inclusive_tax_amount = frappe.utils.sum($.map(this.frm.doc.taxes || [], function(d) {
            if (!d.included_in_print_rate) {
              return flt(d.tax_amount_after_discount_amount);
            }
          }));
          var diff = me.frm.doc.total + non_inclusive_tax_amount - flt(last_tax.total, precision("grand_total"));
          if (me.discount_amount_applied && me.frm.doc.discount_amount) {
            diff -= flt(me.frm.doc.discount_amount);
          }
          diff = flt(diff, precision("rounding_adjustment"));
          if (diff && Math.abs(diff) <= 5 / Math.pow(10, precision("tax_amount", last_tax))) {
            me.frm.doc.rounding_adjustment = diff;
          }
        }
      }
    }
    calculate_totals() {
      var me = this;
      var tax_count = this.frm.doc["taxes"] ? this.frm.doc["taxes"].length : 0;
      this.frm.doc.grand_total = flt(tax_count ? this.frm.doc["taxes"][tax_count - 1].total + flt(this.frm.doc.rounding_adjustment) : this.frm.doc.net_total);
      if (in_list(["Quotation", "Sales Order", "Delivery Note", "Sales Invoice", "POS Invoice", "Proforma Invoice"], this.frm.doc.doctype)) {
        this.frm.doc.base_grand_total = this.frm.doc.total_taxes_and_charges ? flt(this.frm.doc.grand_total * this.frm.doc.conversion_rate) : this.frm.doc.base_net_total;
      } else {
        this.frm.doc.taxes_and_charges_added = this.frm.doc.taxes_and_charges_deducted = 0;
        if (tax_count) {
          $.each(this.frm.doc["taxes"] || [], function(i, tax) {
            if (in_list(["Valuation and Total", "Total"], tax.category)) {
              if (tax.add_deduct_tax == "Add") {
                me.frm.doc.taxes_and_charges_added += flt(tax.tax_amount_after_discount_amount);
              } else {
                me.frm.doc.taxes_and_charges_deducted += flt(tax.tax_amount_after_discount_amount);
              }
            }
          });
          frappe.model.round_floats_in(this.frm.doc, ["taxes_and_charges_added", "taxes_and_charges_deducted"]);
        }
        this.frm.doc.base_grand_total = flt(this.frm.doc.taxes_and_charges_added || this.frm.doc.taxes_and_charges_deducted ? flt(this.frm.doc.grand_total * this.frm.doc.conversion_rate) : this.frm.doc.base_net_total);
        this.set_in_company_currency(this.frm.doc, ["taxes_and_charges_added", "taxes_and_charges_deducted"]);
      }
      this.frm.doc.total_taxes_and_charges = flt(this.frm.doc.grand_total - this.frm.doc.net_total - flt(this.frm.doc.rounding_adjustment), precision("total_taxes_and_charges"));
      this.set_in_company_currency(this.frm.doc, ["total_taxes_and_charges", "rounding_adjustment"]);
      frappe.model.round_floats_in(this.frm.doc, ["grand_total", "base_grand_total"]);
      this.set_rounded_total();
    }
    set_rounded_total() {
      var disable_rounded_total = 0;
      if (frappe.meta.get_docfield(this.frm.doc.doctype, "disable_rounded_total", this.frm.doc.name)) {
        disable_rounded_total = this.frm.doc.disable_rounded_total;
      } else if (frappe.sys_defaults.disable_rounded_total) {
        disable_rounded_total = frappe.sys_defaults.disable_rounded_total;
      }
      if (cint(disable_rounded_total)) {
        this.frm.doc.rounded_total = 0;
        this.frm.doc.base_rounded_total = 0;
        return;
      }
      if (frappe.meta.get_docfield(this.frm.doc.doctype, "rounded_total", this.frm.doc.name)) {
        this.frm.doc.rounded_total = round_based_on_smallest_currency_fraction(this.frm.doc.grand_total, this.frm.doc.currency, precision("rounded_total"));
        this.frm.doc.rounding_adjustment += flt(this.frm.doc.rounded_total - this.frm.doc.grand_total, precision("rounding_adjustment"));
        this.set_in_company_currency(this.frm.doc, ["rounding_adjustment", "rounded_total"]);
      }
    }
    _cleanup() {
      this.frm.doc.base_in_words = this.frm.doc.in_words = "";
      if (this.frm.doc["items"] && this.frm.doc["items"].length) {
        if (!frappe.meta.get_docfield(this.frm.doc["items"][0].doctype, "item_tax_amount", this.frm.doctype)) {
          $.each(this.frm.doc["items"] || [], function(i, item) {
            delete item["item_tax_amount"];
          });
        }
      }
      if (this.frm.doc["taxes"] && this.frm.doc["taxes"].length) {
        var temporary_fields = [
          "tax_amount_for_current_item",
          "grand_total_for_current_item",
          "tax_fraction_for_current_item",
          "grand_total_fraction_for_current_item"
        ];
        if (!frappe.meta.get_docfield(this.frm.doc["taxes"][0].doctype, "tax_amount_after_discount_amount", this.frm.doctype)) {
          temporary_fields.push("tax_amount_after_discount_amount");
        }
        $.each(this.frm.doc["taxes"] || [], function(i, tax) {
          $.each(temporary_fields, function(i2, fieldname) {
            delete tax[fieldname];
          });
          tax.item_wise_tax_detail = JSON.stringify(tax.item_wise_tax_detail);
        });
      }
    }
    set_discount_amount() {
      if (this.frm.doc.additional_discount_percentage) {
        this.frm.doc.discount_amount = flt(flt(this.frm.doc[frappe.scrub(this.frm.doc.apply_discount_on)]) * this.frm.doc.additional_discount_percentage / 100, precision("discount_amount"));
      }
    }
    apply_discount_amount() {
      var me = this;
      var distributed_amount = 0;
      this.frm.doc.base_discount_amount = 0;
      if (this.frm.doc.discount_amount) {
        if (!this.frm.doc.apply_discount_on)
          frappe.throw(__("Please select Apply Discount On"));
        this.frm.doc.base_discount_amount = flt(this.frm.doc.discount_amount * this.frm.doc.conversion_rate, precision("base_discount_amount"));
        var total_for_discount_amount = this.get_total_for_discount_amount();
        var net_total = 0;
        if (total_for_discount_amount) {
          $.each(this.frm.doc["items"] || [], function(i, item) {
            distributed_amount = flt(me.frm.doc.discount_amount) * item.net_amount / total_for_discount_amount;
            item.net_amount = flt(item.net_amount - distributed_amount, precision("base_amount", item));
            net_total += item.net_amount;
            if ((!(me.frm.doc.taxes || []).length || total_for_discount_amount == me.frm.doc.net_total || me.frm.doc.apply_discount_on == "Net Total") && i == (me.frm.doc.items || []).length - 1) {
              var discount_amount_loss = flt(me.frm.doc.net_total - net_total - me.frm.doc.discount_amount, precision("net_total"));
              item.net_amount = flt(item.net_amount + discount_amount_loss, precision("net_amount", item));
            }
            item.net_rate = item.qty ? flt(item.net_amount / item.qty, precision("net_rate", item)) : 0;
            me.set_in_company_currency(item, ["net_rate", "net_amount"]);
          });
          this.discount_amount_applied = true;
          this._calculate_taxes_and_totals();
        }
      }
    }
    get_total_for_discount_amount() {
      if (this.frm.doc.apply_discount_on == "Net Total") {
        return this.frm.doc.net_total;
      } else {
        var total_actual_tax = 0;
        var actual_taxes_dict = {};
        $.each(this.frm.doc["taxes"] || [], function(i, tax) {
          if (in_list(["Actual", "On Item Quantity"], tax.charge_type)) {
            var tax_amount = tax.category == "Valuation" ? 0 : tax.tax_amount;
            tax_amount *= tax.add_deduct_tax == "Deduct" ? -1 : 1;
            actual_taxes_dict[tax.idx] = tax_amount;
          } else if (actual_taxes_dict[tax.row_id] !== null) {
            var actual_tax_amount = flt(actual_taxes_dict[tax.row_id]) * flt(tax.rate) / 100;
            actual_taxes_dict[tax.idx] = actual_tax_amount;
          }
        });
        $.each(actual_taxes_dict, function(key, value) {
          if (value)
            total_actual_tax += value;
        });
        return flt(this.frm.doc.grand_total - total_actual_tax, precision("grand_total"));
      }
    }
    calculate_total_advance(update_paid_amount) {
      var total_allocated_amount = frappe.utils.sum($.map(this.frm.doc["advances"] || [], function(adv) {
        return flt(adv.allocated_amount, precision("allocated_amount", adv));
      }));
      this.frm.doc.total_advance = flt(total_allocated_amount, precision("total_advance"));
      this.calculate_outstanding_amount(update_paid_amount);
    }
    is_internal_invoice() {
      if (["Sales Invoice", "Purchase Invoice"].includes(this.frm.doc.doctype)) {
        if (this.frm.doc.company === this.frm.doc.represents_company) {
          return true;
        }
      }
      return false;
    }
    calculate_outstanding_amount(update_paid_amount) {
      if (in_list(["Sales Invoice", "POS Invoice"], this.frm.doc.doctype) && this.frm.doc.is_return) {
        this.calculate_paid_amount();
      }
      if (this.frm.doc.is_return || this.frm.doc.docstatus > 0 || this.is_internal_invoice())
        return;
      frappe.model.round_floats_in(this.frm.doc, ["grand_total", "total_advance", "write_off_amount"]);
      if (in_list(["Sales Invoice", "POS Invoice", "Purchase Invoice"], this.frm.doc.doctype)) {
        var grand_total = this.frm.doc.rounded_total || this.frm.doc.grand_total;
        if (this.frm.doc.party_account_currency == this.frm.doc.currency) {
          var total_amount_to_pay = flt(grand_total - this.frm.doc.total_advance - this.frm.doc.write_off_amount, precision("grand_total"));
        } else {
          var total_amount_to_pay = flt(flt(grand_total * this.frm.doc.conversion_rate, precision("grand_total")) - this.frm.doc.total_advance - this.frm.doc.base_write_off_amount, precision("base_grand_total"));
        }
        frappe.model.round_floats_in(this.frm.doc, ["paid_amount"]);
        this.set_in_company_currency(this.frm.doc, ["paid_amount"]);
        if (this.frm.refresh_field) {
          this.frm.refresh_field("paid_amount");
          this.frm.refresh_field("base_paid_amount");
        }
        if (in_list(["Sales Invoice", "POS Invoice"], this.frm.doc.doctype)) {
          let total_amount_for_payment = this.frm.doc.redeem_loyalty_points && this.frm.doc.loyalty_amount ? flt(total_amount_to_pay - this.frm.doc.loyalty_amount, precision("base_grand_total")) : total_amount_to_pay;
          this.set_default_payment(total_amount_for_payment, update_paid_amount);
          this.calculate_paid_amount();
        }
        this.calculate_change_amount();
        var paid_amount = this.frm.doc.party_account_currency == this.frm.doc.currency ? this.frm.doc.paid_amount : this.frm.doc.base_paid_amount;
        this.frm.doc.outstanding_amount = flt(total_amount_to_pay - flt(paid_amount) + flt(this.frm.doc.change_amount * this.frm.doc.conversion_rate), precision("outstanding_amount"));
      }
    }
    update_paid_amount_for_return() {
      var grand_total = this.frm.doc.rounded_total || this.frm.doc.grand_total;
      if (this.frm.doc.party_account_currency == this.frm.doc.currency) {
        var total_amount_to_pay = flt(grand_total - this.frm.doc.total_advance - this.frm.doc.write_off_amount, precision("grand_total"));
      } else {
        var total_amount_to_pay = flt(flt(grand_total * this.frm.doc.conversion_rate, precision("grand_total")) - this.frm.doc.total_advance - this.frm.doc.base_write_off_amount, precision("base_grand_total"));
      }
      this.frm.doc.payments.find((pay) => {
        if (pay.default) {
          pay.amount = total_amount_to_pay;
        } else {
          pay.amount = 0;
        }
      });
      this.frm.refresh_fields();
      this.calculate_paid_amount();
    }
    set_default_payment(total_amount_to_pay, update_paid_amount) {
      var me = this;
      var payment_status = true;
      if (this.frm.doc.is_pos && (update_paid_amount === void 0 || update_paid_amount)) {
        $.each(this.frm.doc["payments"] || [], function(index, data) {
          if (data.default && payment_status && total_amount_to_pay > 0) {
            let base_amount = flt(total_amount_to_pay, precision("base_amount", data));
            frappe.model.set_value(data.doctype, data.name, "base_amount", base_amount);
            let amount = flt(total_amount_to_pay / me.frm.doc.conversion_rate, precision("amount", data));
            frappe.model.set_value(data.doctype, data.name, "amount", amount);
            payment_status = false;
          } else if (me.frm.doc.paid_amount) {
            frappe.model.set_value(data.doctype, data.name, "amount", 0);
          }
        });
      }
    }
    calculate_paid_amount() {
      var me = this;
      var paid_amount = 0;
      var base_paid_amount = 0;
      if (this.frm.doc.is_pos) {
        $.each(this.frm.doc["payments"] || [], function(index, data) {
          data.base_amount = flt(data.amount * me.frm.doc.conversion_rate, precision("base_amount", data));
          paid_amount += data.amount;
          base_paid_amount += data.base_amount;
        });
      } else if (!this.frm.doc.is_return) {
        this.frm.doc.payments = [];
      }
      if (this.frm.doc.redeem_loyalty_points && this.frm.doc.loyalty_amount) {
        base_paid_amount += this.frm.doc.loyalty_amount;
        paid_amount += flt(this.frm.doc.loyalty_amount / me.frm.doc.conversion_rate, precision("paid_amount"));
      }
      this.frm.set_value("paid_amount", flt(paid_amount, precision("paid_amount")));
      this.frm.set_value("base_paid_amount", flt(base_paid_amount, precision("base_paid_amount")));
    }
    calculate_change_amount() {
      this.frm.doc.change_amount = 0;
      this.frm.doc.base_change_amount = 0;
      if (in_list(["Sales Invoice", "POS Invoice"], this.frm.doc.doctype) && this.frm.doc.paid_amount > this.frm.doc.grand_total && !this.frm.doc.is_return) {
        var payment_types = $.map(this.frm.doc.payments, function(d) {
          return d.type;
        });
        if (in_list(payment_types, "Cash")) {
          var grand_total = this.frm.doc.rounded_total || this.frm.doc.grand_total;
          var base_grand_total = this.frm.doc.base_rounded_total || this.frm.doc.base_grand_total;
          this.frm.doc.change_amount = flt(this.frm.doc.paid_amount - grand_total + this.frm.doc.write_off_amount, precision("change_amount"));
          this.frm.doc.base_change_amount = flt(this.frm.doc.base_paid_amount - base_grand_total + this.frm.doc.base_write_off_amount, precision("base_change_amount"));
        }
      }
    }
    calculate_write_off_amount() {
      if (this.frm.doc.paid_amount > this.frm.doc.grand_total) {
        this.frm.doc.write_off_amount = flt(this.frm.doc.grand_total - this.frm.doc.paid_amount + this.frm.doc.change_amount, precision("write_off_amount"));
        this.frm.doc.base_write_off_amount = flt(this.frm.doc.write_off_amount * this.frm.doc.conversion_rate, precision("base_write_off_amount"));
      } else {
        this.frm.doc.paid_amount = 0;
      }
      this.calculate_outstanding_amount(false);
    }
  };

  // ../engr/engr/public/js/transaction.js
  frappe.provide("erpnext.accounts.dimensions");
  erpnext.TransactionController = class TransactionController extends erpnext.taxes_and_totals {
    setup() {
      super.setup();
      let me = this;
      frappe.flags.hide_serial_batch_dialog = true;
      frappe.ui.form.on(this.frm.doctype + " Item", "rate", function(frm, cdt, cdn) {
        var item = frappe.get_doc(cdt, cdn);
        var has_margin_field = frappe.meta.has_field(cdt, "margin_type");
        frappe.model.round_floats_in(item, ["rate", "price_list_rate"]);
        if (item.price_list_rate) {
          if (item.rate > item.price_list_rate && has_margin_field) {
            item.discount_percentage = 0;
            item.margin_type = "Amount";
            item.margin_rate_or_amount = flt(item.rate - item.price_list_rate, precision("margin_rate_or_amount", item));
            item.rate_with_margin = item.rate;
          } else {
            item.discount_percentage = flt((1 - item.rate / item.price_list_rate) * 100, precision("discount_percentage", item));
            item.discount_amount = flt(item.price_list_rate) - flt(item.rate);
            item.margin_type = "";
            item.margin_rate_or_amount = 0;
            item.rate_with_margin = 0;
          }
        } else {
          item.discount_percentage = 0;
          item.margin_type = "";
          item.margin_rate_or_amount = 0;
          item.rate_with_margin = 0;
        }
        item.base_rate_with_margin = item.rate_with_margin * flt(frm.doc.conversion_rate);
        cur_frm.cscript.set_gross_profit(item);
        cur_frm.cscript.calculate_taxes_and_totals();
        cur_frm.cscript.calculate_stock_uom_rate(frm, cdt, cdn);
      });
      frappe.ui.form.on(this.frm.cscript.tax_table, "rate", function(frm, cdt, cdn) {
        cur_frm.cscript.calculate_taxes_and_totals();
      });
      frappe.ui.form.on(this.frm.cscript.tax_table, "tax_amount", function(frm, cdt, cdn) {
        cur_frm.cscript.calculate_taxes_and_totals();
      });
      frappe.ui.form.on(this.frm.cscript.tax_table, "row_id", function(frm, cdt, cdn) {
        cur_frm.cscript.calculate_taxes_and_totals();
      });
      frappe.ui.form.on(this.frm.cscript.tax_table, "included_in_print_rate", function(frm, cdt, cdn) {
        cur_frm.cscript.set_dynamic_labels();
        cur_frm.cscript.calculate_taxes_and_totals();
      });
      frappe.ui.form.on(this.frm.doctype, "apply_discount_on", function(frm) {
        if (frm.doc.additional_discount_percentage) {
          frm.trigger("additional_discount_percentage");
        } else {
          cur_frm.cscript.calculate_taxes_and_totals();
        }
      });
      frappe.ui.form.on(this.frm.doctype, "additional_discount_percentage", function(frm) {
        if (!frm.doc.apply_discount_on) {
          frappe.msgprint(__("Please set 'Apply Additional Discount On'"));
          return;
        }
        frm.via_discount_percentage = true;
        if (frm.doc.additional_discount_percentage && frm.doc.discount_amount) {
          frm.doc.discount_amount = 0;
          frm.cscript.calculate_taxes_and_totals();
        }
        var total = flt(frm.doc[frappe.model.scrub(frm.doc.apply_discount_on)]);
        var discount_amount = flt(total * flt(frm.doc.additional_discount_percentage) / 100, precision("discount_amount"));
        frm.set_value("discount_amount", discount_amount).then(() => delete frm.via_discount_percentage);
      });
      frappe.ui.form.on(this.frm.doctype, "discount_amount", function(frm) {
        frm.cscript.set_dynamic_labels();
        if (!frm.via_discount_percentage) {
          frm.doc.additional_discount_percentage = 0;
        }
        frm.cscript.calculate_taxes_and_totals();
      });
      frappe.ui.form.on(this.frm.doctype + " Item", {
        items_add: function(frm, cdt, cdn) {
          var item = frappe.get_doc(cdt, cdn);
          if (!item.warehouse && frm.doc.set_warehouse) {
            item.warehouse = frm.doc.set_warehouse;
          }
          if (!item.target_warehouse && frm.doc.set_target_warehouse) {
            item.target_warehouse = frm.doc.set_target_warehouse;
          }
          if (!item.from_warehouse && frm.doc.set_from_warehouse) {
            item.from_warehouse = frm.doc.set_from_warehouse;
          }
          erpnext.accounts.dimensions.copy_dimension_from_first_row(frm, cdt, cdn, "items");
        }
      });
      if (this.frm.fields_dict["items"].grid.get_field("batch_no")) {
        this.frm.set_query("batch_no", "items", function(doc, cdt, cdn) {
          return me.set_query_for_batch(doc, cdt, cdn);
        });
      }
      if (this.frm.docstatus < 2 && this.frm.fields_dict["payment_terms_template"] && this.frm.fields_dict["payment_schedule"] && this.frm.doc.payment_terms_template && !this.frm.doc.payment_schedule.length) {
        this.frm.trigger("payment_terms_template");
      }
      if (this.frm.fields_dict["taxes"]) {
        this["taxes_remove"] = this.calculate_taxes_and_totals;
      }
      if (this.frm.fields_dict["items"]) {
        this["items_remove"] = this.calculate_net_weight;
      }
      if (this.frm.fields_dict["recurring_print_format"]) {
        this.frm.set_query("recurring_print_format", function(doc) {
          return {
            filters: [
              ["Print Format", "doc_type", "=", cur_frm.doctype]
            ]
          };
        });
      }
      if (this.frm.fields_dict["return_against"]) {
        this.frm.set_query("return_against", function(doc) {
          var filters = {
            "docstatus": 1,
            "is_return": 0,
            "company": doc.company
          };
          if (me.frm.fields_dict["customer"] && doc.customer)
            filters["customer"] = doc.customer;
          if (me.frm.fields_dict["supplier"] && doc.supplier)
            filters["supplier"] = doc.supplier;
          return {
            filters
          };
        });
      }
      if (this.frm.fields_dict["items"].grid.get_field("expense_account")) {
        this.frm.set_query("expense_account", "items", function(doc) {
          return {
            filters: {
              "company": doc.company
            }
          };
        });
      }
      if (frappe.meta.get_docfield(this.frm.doc.doctype, "pricing_rules")) {
        this.frm.set_indicator_formatter("pricing_rule", function(doc) {
          return doc.rule_applied ? "green" : "red";
        });
      }
      let batch_no_field = this.frm.get_docfield("items", "batch_no");
      if (batch_no_field) {
        batch_no_field.get_route_options_for_new_doc = function(row) {
          return {
            "item": row.doc.item_code
          };
        };
      }
      if (this.frm.fields_dict["items"].grid.get_field("blanket_order")) {
        this.frm.set_query("blanket_order", "items", function(doc, cdt, cdn) {
          var item = locals[cdt][cdn];
          return {
            query: "erpnext.controllers.queries.get_blanket_orders",
            filters: {
              "company": doc.company,
              "blanket_order_type": doc.doctype === "Sales Order" ? "Selling" : "Purchasing",
              "item": item.item_code
            }
          };
        });
      }
      if (this.frm.fields_dict.taxes_and_charges) {
        this.frm.set_query("taxes_and_charges", function() {
          return {
            filters: [
              ["company", "=", me.frm.doc.company],
              ["docstatus", "!=", 2]
            ]
          };
        });
      }
    }
    onload() {
      var me = this;
      if (this.frm.doc.__islocal) {
        var currency = frappe.defaults.get_user_default("currency");
        let set_value = (fieldname, value) => {
          if (me.frm.fields_dict[fieldname] && !me.frm.doc[fieldname]) {
            return me.frm.set_value(fieldname, value);
          }
        };
        this.frm.trigger("set_default_internal_warehouse");
        return frappe.run_serially([
          () => set_value("currency", currency),
          () => set_value("price_list_currency", currency),
          () => set_value("status", "Draft"),
          () => set_value("is_subcontracted", 0),
          () => {
            if (this.frm.doc.company && !this.frm.doc.amended_from) {
              this.frm.trigger("company");
            }
          }
        ]);
      }
    }
    is_return() {
      if (!this.frm.doc.is_return && this.frm.doc.return_against) {
        this.frm.set_value("return_against", "");
      }
    }
    setup_quality_inspection() {
      if (!in_list(["Delivery Note", "Sales Invoice", "Purchase Receipt", "Purchase Invoice"], this.frm.doc.doctype)) {
        return;
      }
      const me = this;
      if (!this.frm.is_new() && this.frm.doc.docstatus === 0) {
        this.frm.add_custom_button(__("Quality Inspection(s)"), () => {
          me.make_quality_inspection();
        }, __("Create"));
        this.frm.page.set_inner_btn_group_as_primary(__("Create"));
      }
      const inspection_type = in_list(["Purchase Receipt", "Purchase Invoice"], this.frm.doc.doctype) ? "Incoming" : "Outgoing";
      let quality_inspection_field = this.frm.get_docfield("items", "quality_inspection");
      quality_inspection_field.get_route_options_for_new_doc = function(row) {
        if (me.frm.is_new())
          return;
        return {
          "inspection_type": inspection_type,
          "reference_type": me.frm.doc.doctype,
          "reference_name": me.frm.doc.name,
          "item_code": row.doc.item_code,
          "description": row.doc.description,
          "item_serial_no": row.doc.serial_no ? row.doc.serial_no.split("\n")[0] : null,
          "batch_no": row.doc.batch_no
        };
      };
      this.frm.set_query("quality_inspection", "items", function(doc, cdt, cdn) {
        let d = locals[cdt][cdn];
        return {
          filters: {
            docstatus: 1,
            inspection_type,
            reference_name: doc.name,
            item_code: d.item_code
          }
        };
      });
    }
    make_payment_request() {
      var me = this;
      const payment_request_type = in_list(["Sales Order", "Sales Invoice"], this.frm.doc.doctype) ? "Inward" : "Outward";
      frappe.call({
        method: "erpnext.accounts.doctype.payment_request.payment_request.make_payment_request",
        args: {
          dt: me.frm.doc.doctype,
          dn: me.frm.doc.name,
          recipient_id: me.frm.doc.contact_email,
          payment_request_type,
          party_type: payment_request_type == "Outward" ? "Supplier" : "Customer",
          party: payment_request_type == "Outward" ? me.frm.doc.supplier : me.frm.doc.customer
        },
        callback: function(r) {
          if (!r.exc) {
            var doc = frappe.model.sync(r.message);
            frappe.set_route("Form", r.message.doctype, r.message.name);
          }
        }
      });
    }
    onload_post_render() {
      if (this.frm.doc.__islocal && !(this.frm.doc.taxes || []).length && !(this.frm.doc.__onload ? this.frm.doc.__onload.load_after_mapping : false)) {
        frappe.after_ajax(() => this.apply_default_taxes());
      } else if (this.frm.doc.__islocal && this.frm.doc.company && this.frm.doc["items"] && !this.frm.doc.is_pos) {
        frappe.after_ajax(() => this.calculate_taxes_and_totals());
      }
      if (frappe.meta.get_docfield(this.frm.doc.doctype + " Item", "item_code")) {
        this.setup_item_selector();
        this.frm.get_field("items").grid.set_multiple_add("item_code", "qty");
      }
    }
    refresh() {
      erpnext.toggle_naming_series();
      erpnext.hide_company();
      this.set_dynamic_labels();
      this.setup_sms();
      this.setup_quality_inspection();
      let scan_barcode_field = this.frm.get_field("scan_barcode");
      if (scan_barcode_field && scan_barcode_field.get_value()) {
        scan_barcode_field.set_value("");
        scan_barcode_field.set_new_description("");
        if (frappe.is_mobile()) {
          if (scan_barcode_field.$input_wrapper.find(".input-group").length)
            return;
          let $input_group = $('<div class="input-group">');
          scan_barcode_field.$input_wrapper.find(".control-input").append($input_group);
          $input_group.append(scan_barcode_field.$input);
          $(`<span class="input-group-btn" style="vertical-align: top">
						<button class="btn btn-default border" type="button">
							<i class="fa fa-camera text-muted"></i>
						</button>
					</span>`).on("click", ".btn", () => {
            frappe.barcode.scan_barcode().then((barcode) => {
              scan_barcode_field.set_value(barcode);
            });
          }).appendTo($input_group);
        }
      }
    }
    scan_barcode() {
      let scan_barcode_field = this.frm.fields_dict["scan_barcode"];
      let show_description = function(idx, exist = null) {
        if (exist) {
          frappe.show_alert({
            message: __("Row #{0}: Qty increased by 1", [idx]),
            indicator: "green"
          });
        } else {
          frappe.show_alert({
            message: __("Row #{0}: Item added", [idx]),
            indicator: "green"
          });
        }
      };
      if (this.frm.doc.scan_barcode) {
        frappe.call({
          method: "erpnext.selling.page.point_of_sale.point_of_sale.search_for_serial_or_batch_or_barcode_number",
          args: { search_value: this.frm.doc.scan_barcode }
        }).then((r) => {
          const data = r && r.message;
          if (!data || Object.keys(data).length === 0) {
            frappe.show_alert({
              message: __("Cannot find Item with this Barcode"),
              indicator: "red"
            });
            return;
          }
          let cur_grid = this.frm.fields_dict.items.grid;
          let row_to_modify = null;
          const existing_item_row = this.frm.doc.items.find((d) => d.item_code === data.item_code);
          const blank_item_row = this.frm.doc.items.find((d) => !d.item_code);
          if (existing_item_row) {
            row_to_modify = existing_item_row;
          } else if (blank_item_row) {
            row_to_modify = blank_item_row;
          }
          if (!row_to_modify) {
            row_to_modify = frappe.model.add_child(this.frm.doc, cur_grid.doctype, "items");
          }
          show_description(row_to_modify.idx, row_to_modify.item_code);
          this.frm.from_barcode = this.frm.from_barcode ? this.frm.from_barcode + 1 : 1;
          frappe.model.set_value(row_to_modify.doctype, row_to_modify.name, {
            item_code: data.item_code,
            qty: (row_to_modify.qty || 0) + 1
          });
          ["serial_no", "batch_no", "barcode"].forEach((field) => {
            if (data[field] && frappe.meta.has_field(row_to_modify.doctype, field)) {
              let value = row_to_modify[field] && field === "serial_no" ? row_to_modify[field] + "\n" + data[field] : data[field];
              frappe.model.set_value(row_to_modify.doctype, row_to_modify.name, field, value);
            }
          });
          scan_barcode_field.set_value("");
          refresh_field("items");
        });
      }
      return false;
    }
    apply_default_taxes() {
      var me = this;
      var taxes_and_charges_field = frappe.meta.get_docfield(me.frm.doc.doctype, "taxes_and_charges", me.frm.doc.name);
      if (!this.frm.doc.taxes_and_charges && this.frm.doc.taxes && this.frm.doc.taxes.length > 0) {
        return;
      }
      if (taxes_and_charges_field) {
        return frappe.call({
          method: "erpnext.controllers.accounts_controller.get_default_taxes_and_charges",
          args: {
            "master_doctype": taxes_and_charges_field.options,
            "tax_template": me.frm.doc.taxes_and_charges || "",
            "company": me.frm.doc.company
          },
          debounce: 2e3,
          callback: function(r) {
            if (!r.exc && r.message) {
              frappe.run_serially([
                () => {
                  if (r.message.taxes_and_charges) {
                    me.frm.doc.taxes_and_charges = r.message.taxes_and_charges;
                  }
                  if (r.message.taxes) {
                    me.frm.set_value("taxes", r.message.taxes);
                  }
                },
                () => me.set_dynamic_labels(),
                () => me.calculate_taxes_and_totals()
              ]);
            }
          }
        });
      }
    }
    setup_sms() {
      var me = this;
      let blacklist = ["Purchase Invoice", "BOM"];
      if (this.frm.doc.docstatus === 1 && !in_list(["Lost", "Stopped", "Closed"], this.frm.doc.status) && !blacklist.includes(this.frm.doctype)) {
        this.frm.page.add_menu_item(__("Send SMS"), function() {
          me.send_sms();
        });
      }
    }
    send_sms() {
      var sms_man = new erpnext.SMSManager(this.frm.doc);
    }
    barcode(doc, cdt, cdn) {
      var d = locals[cdt][cdn];
      if (d.barcode == "" || d.barcode == null) {
        d.item_code = "";
      }
      this.frm.from_barcode = this.frm.from_barcode ? this.frm.from_barcode + 1 : 1;
      this.item_code(doc, cdt, cdn);
    }
    item_code(doc, cdt, cdn) {
      var me = this;
      var item = frappe.get_doc(cdt, cdn);
      var update_stock = 0, show_batch_dialog = 0;
      if (["Sales Invoice"].includes(this.frm.doc.doctype)) {
        update_stock = cint(me.frm.doc.update_stock);
        show_batch_dialog = update_stock;
      } else if (this.frm.doc.doctype === "Purchase Receipt" && me.frm.doc.is_return || this.frm.doc.doctype === "Delivery Note") {
        show_batch_dialog = 1;
      }
      if (this.frm.from_barcode == 0) {
        item.barcode = null;
      }
      this.frm.from_barcode = this.frm.from_barcode - 1 >= 0 ? this.frm.from_barcode - 1 : 0;
      if (item.item_code || item.barcode || item.serial_no) {
        if (!this.validate_company_and_party()) {
          this.frm.fields_dict["items"].grid.grid_rows[item.idx - 1].remove();
        } else {
          return this.frm.call({
            method: "erpnext.stock.get_item_details.get_item_details",
            child: item,
            args: {
              doc: me.frm.doc,
              args: {
                item_code: item.item_code,
                barcode: item.barcode,
                serial_no: item.serial_no,
                batch_no: item.batch_no,
                set_warehouse: me.frm.doc.set_warehouse,
                warehouse: item.warehouse,
                customer: me.frm.doc.customer || me.frm.doc.party_name,
                quotation_to: me.frm.doc.quotation_to,
                supplier: me.frm.doc.supplier,
                currency: me.frm.doc.currency,
                update_stock,
                conversion_rate: me.frm.doc.conversion_rate,
                price_list: me.frm.doc.selling_price_list || me.frm.doc.buying_price_list,
                price_list_currency: me.frm.doc.price_list_currency,
                plc_conversion_rate: me.frm.doc.plc_conversion_rate,
                company: me.frm.doc.company,
                order_type: me.frm.doc.order_type,
                is_pos: cint(me.frm.doc.is_pos),
                is_return: cint(me.frm.doc.is_return),
                is_subcontracted: me.frm.doc.is_subcontracted,
                transaction_date: me.frm.doc.transaction_date || me.frm.doc.posting_date,
                ignore_pricing_rule: me.frm.doc.ignore_pricing_rule,
                doctype: me.frm.doc.doctype,
                name: me.frm.doc.name,
                project: item.project || me.frm.doc.project,
                qty: item.qty || 1,
                net_rate: item.rate,
                stock_qty: item.stock_qty,
                conversion_factor: item.conversion_factor,
                weight_per_unit: item.weight_per_unit,
                weight_uom: item.weight_uom,
                manufacturer: item.manufacturer,
                stock_uom: item.stock_uom,
                pos_profile: cint(me.frm.doc.is_pos) ? me.frm.doc.pos_profile : "",
                cost_center: item.cost_center,
                tax_category: me.frm.doc.tax_category,
                item_tax_template: item.item_tax_template,
                child_docname: item.name
              }
            },
            callback: function(r) {
              if (!r.exc) {
                frappe.run_serially([
                  () => {
                    var d = locals[cdt][cdn];
                    me.add_taxes_from_item_tax_template(d.item_tax_rate);
                    if (d.free_item_data) {
                      me.apply_product_discount(d);
                    }
                  },
                  () => {
                    if (me.frm.doc.is_internal_customer || me.frm.doc.is_internal_supplier) {
                      me.get_incoming_rate(item, me.frm.posting_date, me.frm.posting_time, me.frm.doc.doctype, me.frm.doc.company);
                    } else {
                      me.frm.script_manager.trigger("price_list_rate", cdt, cdn);
                    }
                  },
                  () => {
                    if (me.frm.doc.is_internal_customer || me.frm.doc.is_internal_supplier) {
                      me.calculate_taxes_and_totals();
                    }
                  },
                  () => me.toggle_conversion_factor(item),
                  () => {
                    if (show_batch_dialog)
                      return frappe.db.get_value("Item", item.item_code, ["has_batch_no", "has_serial_no"]).then((r2) => {
                        if (r2.message && (r2.message.has_batch_no || r2.message.has_serial_no)) {
                          frappe.flags.hide_serial_batch_dialog = false;
                        }
                      });
                  },
                  () => {
                    if (show_batch_dialog && !frappe.flags.hide_serial_batch_dialog)
                      return frappe.db.get_single_value("Stock Settings", "disable_serial_no_and_batch_selector").then((value) => {
                        if (value) {
                          frappe.flags.hide_serial_batch_dialog = true;
                        }
                      });
                  },
                  () => {
                    if (show_batch_dialog && !frappe.flags.hide_serial_batch_dialog) {
                      var d = locals[cdt][cdn];
                      $.each(r.message, function(k, v) {
                        if (!d[k])
                          d[k] = v;
                      });
                      if (d.has_batch_no && d.has_serial_no) {
                        d.batch_no = void 0;
                      }
                      erpnext.show_serial_batch_selector(me.frm, d, (item2) => {
                        me.frm.script_manager.trigger("qty", item2.doctype, item2.name);
                        if (!me.frm.doc.set_warehouse)
                          me.frm.script_manager.trigger("warehouse", item2.doctype, item2.name);
                      }, void 0, !frappe.flags.hide_serial_batch_dialog);
                    }
                  },
                  () => me.conversion_factor(doc, cdt, cdn, true),
                  () => me.remove_pricing_rule(item),
                  () => {
                    if (item.apply_rule_on_other_items) {
                      let key = item.name;
                      me.apply_rule_on_other_items({ key: item });
                    }
                  },
                  () => {
                    var company_currency = me.get_company_currency();
                    me.update_item_grid_labels(company_currency);
                  }
                ]);
              }
            }
          });
        }
      }
    }
    price_list_rate(doc, cdt, cdn) {
      var item = frappe.get_doc(cdt, cdn);
      frappe.model.round_floats_in(item, ["price_list_rate", "discount_percentage"]);
      if (in_list(["Quotation Item", "Sales Order Item", "Delivery Note Item", "Sales Invoice Item", "POS Invoice Item", "Purchase Invoice Item", "Purchase Order Item", "Purchase Receipt Item", "Proforma Invoice Item"]), cdt)
        this.apply_pricing_rule_on_item(item);
      else
        item.rate = flt(item.price_list_rate * (1 - item.discount_percentage / 100), precision("rate", item));
      this.calculate_taxes_and_totals();
    }
    margin_rate_or_amount(doc, cdt, cdn) {
      let item = frappe.get_doc(cdt, cdn);
      this.apply_pricing_rule_on_item(item);
      this.calculate_taxes_and_totals();
      cur_frm.refresh_fields();
    }
    margin_type(doc, cdt, cdn) {
      let item = frappe.get_doc(cdt, cdn);
      if (!item.margin_type) {
        frappe.model.set_value(cdt, cdn, "margin_rate_or_amount", 0);
      } else {
        this.apply_pricing_rule_on_item(item, doc, cdt, cdn);
        this.calculate_taxes_and_totals();
        cur_frm.refresh_fields();
      }
    }
    get_incoming_rate(item, posting_date, posting_time, voucher_type, company) {
      let item_args = {
        "item_code": item.item_code,
        "warehouse": in_list("Purchase Receipt", "Purchase Invoice") ? item.from_warehouse : item.warehouse,
        "posting_date": posting_date,
        "posting_time": posting_time,
        "qty": item.qty * item.conversion_factor,
        "serial_no": item.serial_no,
        "voucher_type": voucher_type,
        "company": company,
        "allow_zero_valuation_rate": item.allow_zero_valuation_rate
      };
      frappe.call({
        method: "erpnext.stock.utils.get_incoming_rate",
        args: {
          args: item_args
        },
        callback: function(r) {
          frappe.model.set_value(item.doctype, item.name, "rate", r.message * item.conversion_factor);
        }
      });
    }
    serial_no(doc, cdt, cdn) {
      var me = this;
      var item = frappe.get_doc(cdt, cdn);
      if (item && item.doctype === "Purchase Receipt Item Supplied") {
        return;
      }
      if (item && item.serial_no) {
        if (!item.item_code) {
          this.frm.trigger("item_code", cdt, cdn);
        } else {
          item.serial_no = item.serial_no.replace(/,/g, "\n");
          item.conversion_factor = item.conversion_factor || 1;
          refresh_field("serial_no", item.name, item.parentfield);
          if (!doc.is_return && cint(frappe.user_defaults.set_qty_in_transactions_based_on_serial_no_input)) {
            setTimeout(() => {
              me.update_qty(cdt, cdn);
            }, 1e4);
          }
        }
      }
    }
    update_qty(cdt, cdn) {
      var valid_serial_nos = [];
      var serialnos = [];
      var item = frappe.get_doc(cdt, cdn);
      serialnos = item.serial_no.split("\n");
      for (var i = 0; i < serialnos.length; i++) {
        if (serialnos[i] != "") {
          valid_serial_nos.push(serialnos[i]);
        }
      }
      frappe.model.set_value(item.doctype, item.name, "qty", valid_serial_nos.length / item.conversion_factor);
      frappe.model.set_value(item.doctype, item.name, "stock_qty", valid_serial_nos.length);
    }
    validate() {
      this.calculate_taxes_and_totals(false);
    }
    update_stock() {
      this.frm.trigger("set_default_internal_warehouse");
    }
    set_default_internal_warehouse() {
      let me = this;
      if (this.frm.doc.doctype === "Sales Invoice" && me.frm.doc.update_stock || this.frm.doc.doctype == "Delivery Note") {
        if (this.frm.doc.is_internal_customer && this.frm.doc.company === this.frm.doc.represents_company) {
          frappe.db.get_value("Company", this.frm.doc.company, "default_in_transit_warehouse", function(value) {
            me.frm.set_value("set_target_warehouse", value.default_in_transit_warehouse);
          });
        }
      }
      if (this.frm.doc.doctype === "Purchase Invoice" && me.frm.doc.update_stock || this.frm.doc.doctype == "Purchase Receipt") {
        if (this.frm.doc.is_internal_supplier && this.frm.doc.company === this.frm.doc.represents_company) {
          frappe.db.get_value("Company", this.frm.doc.company, "default_in_transit_warehouse", function(value) {
            me.frm.set_value("set_from_warehouse", value.default_in_transit_warehouse);
          });
        }
      }
    }
    company() {
      var me = this;
      var set_pricing = function() {
        if (me.frm.doc.company && me.frm.fields_dict.currency) {
          var company_currency = me.get_company_currency();
          var company_doc = frappe.get_doc(":Company", me.frm.doc.company);
          if (!me.frm.doc.currency) {
            me.frm.set_value("currency", company_currency);
          }
          if (me.frm.doc.currency == company_currency) {
            me.frm.set_value("conversion_rate", 1);
          }
          if (me.frm.doc.price_list_currency == company_currency) {
            me.frm.set_value("plc_conversion_rate", 1);
          }
          if (company_doc.default_letter_head) {
            if (me.frm.fields_dict.letter_head) {
              me.frm.set_value("letter_head", company_doc.default_letter_head);
            }
          }
          let selling_doctypes_for_tc = ["Sales Invoice", "Quotation", "Sales Order", "Delivery Note", "Proforma Invoice"];
          if (company_doc.default_selling_terms && frappe.meta.has_field(me.frm.doc.doctype, "tc_name") && selling_doctypes_for_tc.indexOf(me.frm.doc.doctype) != -1) {
            me.frm.set_value("tc_name", company_doc.default_selling_terms);
          }
          let buying_doctypes_for_tc = [
            "Request for Quotation",
            "Supplier Quotation",
            "Purchase Order",
            "Material Request",
            "Purchase Receipt"
          ];
          if (company_doc.default_buying_terms && frappe.meta.has_field(me.frm.doc.doctype, "tc_name") && buying_doctypes_for_tc.indexOf(me.frm.doc.doctype) != -1) {
            me.frm.set_value("tc_name", company_doc.default_buying_terms);
          }
          frappe.run_serially([
            () => me.frm.script_manager.trigger("currency"),
            () => me.update_item_tax_map(),
            () => me.apply_default_taxes(),
            () => me.apply_pricing_rule()
          ]);
        }
      };
      var set_party_account = function(set_pricing2) {
        if (in_list(["Sales Invoice", "Purchase Invoice"], me.frm.doc.doctype)) {
          if (me.frm.doc.doctype == "Sales Invoice") {
            var party_type = "Customer";
            var party_account_field = "debit_to";
          } else {
            var party_type = "Supplier";
            var party_account_field = "credit_to";
          }
          var party = me.frm.doc[frappe.model.scrub(party_type)];
          if (party && me.frm.doc.company) {
            return frappe.call({
              method: "erpnext.accounts.party.get_party_account",
              args: {
                company: me.frm.doc.company,
                party_type,
                party
              },
              callback: function(r) {
                if (!r.exc && r.message) {
                  me.frm.set_value(party_account_field, r.message);
                  set_pricing2();
                }
              }
            });
          } else {
            set_pricing2();
          }
        } else {
          set_pricing2();
        }
      };
      if (frappe.meta.get_docfield(this.frm.doctype, "shipping_address") && in_list(["Purchase Order", "Purchase Receipt", "Purchase Invoice"], this.frm.doctype)) {
        erpnext.utils.get_shipping_address(this.frm, function() {
          set_party_account(set_pricing);
        });
        frappe.call({
          "method": "frappe.contacts.doctype.address.address.get_default_address",
          "args": {
            "doctype": "Company",
            "name": this.frm.doc.company
          },
          "callback": function(r) {
            me.frm.set_value("billing_address", r.message);
          }
        });
      } else {
        set_party_account(set_pricing);
      }
      if (this.frm.doc.company) {
        erpnext.last_selected_company = this.frm.doc.company;
      }
    }
    transaction_date() {
      if (this.frm.doc.transaction_date) {
        this.frm.transaction_date = this.frm.doc.transaction_date;
        frappe.ui.form.trigger(this.frm.doc.doctype, "currency");
      }
    }
    posting_date() {
      var me = this;
      if (this.frm.doc.posting_date) {
        this.frm.posting_date = this.frm.doc.posting_date;
        if (this.frm.doc.doctype == "Sales Invoice" && this.frm.doc.customer || this.frm.doc.doctype == "Purchase Invoice" && this.frm.doc.supplier) {
          return frappe.call({
            method: "erpnext.accounts.party.get_due_date",
            args: {
              "posting_date": me.frm.doc.posting_date,
              "party_type": me.frm.doc.doctype == "Sales Invoice" ? "Customer" : "Supplier",
              "bill_date": me.frm.doc.bill_date,
              "party": me.frm.doc.doctype == "Sales Invoice" ? me.frm.doc.customer : me.frm.doc.supplier,
              "company": me.frm.doc.company
            },
            callback: function(r, rt) {
              if (r.message) {
                me.frm.doc.due_date = r.message;
                refresh_field("due_date");
                frappe.ui.form.trigger(me.frm.doc.doctype, "currency");
                me.recalculate_terms();
              }
            }
          });
        } else {
          frappe.ui.form.trigger(me.frm.doc.doctype, "currency");
        }
      }
    }
    due_date() {
      if (this.frm.doc.due_date && !this.frm.updating_party_details && !this.frm.doc.is_pos) {
        if (this.frm.doc.payment_terms_template || this.frm.doc.payment_schedule && this.frm.doc.payment_schedule.length) {
          var message1 = "";
          var message2 = "";
          var final_message = __("Please clear the") + " ";
          if (this.frm.doc.payment_terms_template) {
            message1 = __("selected Payment Terms Template");
            final_message = final_message + message1;
          }
          if ((this.frm.doc.payment_schedule || []).length) {
            message2 = __("Payment Schedule Table");
            if (message1.length !== 0)
              message2 = " and " + message2;
            final_message = final_message + message2;
          }
          frappe.msgprint(final_message);
        }
      }
    }
    bill_date() {
      this.posting_date();
    }
    recalculate_terms() {
      const doc = this.frm.doc;
      if (doc.payment_terms_template) {
        this.payment_terms_template();
      } else if (doc.payment_schedule) {
        const me = this;
        doc.payment_schedule.forEach(function(term) {
          if (term.payment_term) {
            me.payment_term(doc, term.doctype, term.name);
          } else {
            frappe.model.set_value(term.doctype, term.name, "due_date", doc.posting_date || doc.transaction_date);
          }
        });
      }
    }
    get_company_currency() {
      return erpnext.get_currency(this.frm.doc.company);
    }
    contact_person() {
      erpnext.utils.get_contact_details(this.frm);
    }
    currency() {
      var transaction_date = this.frm.doc.transaction_date || this.frm.doc.posting_date;
      var me = this;
      this.set_dynamic_labels();
      var company_currency = this.get_company_currency();
      if (this.frm.doc.currency && this.frm.doc.currency !== company_currency && !this.frm.doc.ignore_pricing_rule) {
        this.get_exchange_rate(transaction_date, this.frm.doc.currency, company_currency, function(exchange_rate) {
          if (exchange_rate != me.frm.doc.conversion_rate) {
            me.set_margin_amount_based_on_currency(exchange_rate);
            me.set_actual_charges_based_on_currency(exchange_rate);
            me.frm.set_value("conversion_rate", exchange_rate);
          }
        });
      } else {
        this.conversion_rate();
      }
    }
    conversion_rate() {
      const me = this.frm;
      if (this.frm.doc.currency === this.get_company_currency()) {
        this.frm.set_value("conversion_rate", 1);
      }
      if (this.frm.doc.currency === this.frm.doc.price_list_currency && this.frm.doc.plc_conversion_rate !== this.frm.doc.conversion_rate) {
        this.frm.set_value("plc_conversion_rate", this.frm.doc.conversion_rate);
      }
      if (flt(this.frm.doc.conversion_rate) > 0) {
        if (this.frm.doc.ignore_pricing_rule) {
          this.calculate_taxes_and_totals();
        } else if (!this.in_apply_price_list) {
          this.apply_price_list();
        }
      }
      this.frm.set_df_property("conversion_rate", "read_only", erpnext.stale_rate_allowed() ? 0 : 1);
    }
    shipping_rule() {
      var me = this;
      if (this.frm.doc.shipping_rule) {
        return this.frm.call({
          doc: this.frm.doc,
          method: "apply_shipping_rule",
          callback: function(r) {
            if (!r.exc) {
              me.calculate_taxes_and_totals();
            }
          }
        }).fail(() => this.frm.set_value("shipping_rule", ""));
      } else {
        me.calculate_taxes_and_totals();
      }
    }
    set_margin_amount_based_on_currency(exchange_rate) {
      if (in_list(["Quotation", "Sales Order", "Delivery Note", "Sales Invoice", "Purchase Invoice", "Purchase Order", "Purchase Receipt", "Proforma Invoice"]), this.frm.doc.doctype) {
        var me = this;
        $.each(this.frm.doc.items || [], function(i, d) {
          if (d.margin_type == "Amount") {
            frappe.model.set_value(d.doctype, d.name, "margin_rate_or_amount", flt(d.margin_rate_or_amount) / flt(exchange_rate));
          }
        });
      }
    }
    set_actual_charges_based_on_currency(exchange_rate) {
      var me = this;
      $.each(this.frm.doc.taxes || [], function(i, d) {
        if (d.charge_type == "Actual") {
          frappe.model.set_value(d.doctype, d.name, "tax_amount", flt(d.tax_amount) / flt(exchange_rate));
        }
      });
    }
    get_exchange_rate(transaction_date, from_currency, to_currency, callback) {
      var args;
      if (["Quotation", "Sales Order", "Delivery Note", "Sales Invoice", "Proforma Invoice"].includes(this.frm.doctype)) {
        args = "for_selling";
      } else if (["Purchase Order", "Purchase Receipt", "Purchase Invoice"].includes(this.frm.doctype)) {
        args = "for_buying";
      }
      if (!transaction_date || !from_currency || !to_currency)
        return;
      return frappe.call({
        method: "erpnext.setup.utils.get_exchange_rate",
        args: {
          transaction_date,
          from_currency,
          to_currency,
          args
        },
        freeze: true,
        freeze_message: __("Fetching exchange rates ..."),
        callback: function(r) {
          callback(flt(r.message));
        }
      });
    }
    price_list_currency() {
      var me = this;
      this.set_dynamic_labels();
      var company_currency = this.get_company_currency();
      if (this.frm.doc.price_list_currency !== company_currency && !this.frm.doc.ignore_pricing_rule) {
        this.get_exchange_rate(this.frm.doc.posting_date, this.frm.doc.price_list_currency, company_currency, function(exchange_rate) {
          me.frm.set_value("plc_conversion_rate", exchange_rate);
        });
      } else {
        this.plc_conversion_rate();
      }
    }
    plc_conversion_rate() {
      if (this.frm.doc.price_list_currency === this.get_company_currency()) {
        this.frm.set_value("plc_conversion_rate", 1);
      } else if (this.frm.doc.price_list_currency === this.frm.doc.currency && this.frm.doc.plc_conversion_rate && cint(this.frm.doc.plc_conversion_rate) != 1 && cint(this.frm.doc.plc_conversion_rate) != cint(this.frm.doc.conversion_rate)) {
        this.frm.set_value("conversion_rate", this.frm.doc.plc_conversion_rate);
      }
      if (!this.in_apply_price_list) {
        this.apply_price_list(null, true);
      }
    }
    uom(doc, cdt, cdn) {
      var me = this;
      var item = frappe.get_doc(cdt, cdn);
      if (item.item_code && item.uom) {
        return this.frm.call({
          method: "erpnext.stock.get_item_details.get_conversion_factor",
          args: {
            item_code: item.item_code,
            uom: item.uom
          },
          callback: function(r) {
            if (!r.exc) {
              frappe.model.set_value(cdt, cdn, "conversion_factor", r.message.conversion_factor);
            }
          }
        });
      }
      me.calculate_stock_uom_rate(doc, cdt, cdn);
    }
    conversion_factor(doc, cdt, cdn, dont_fetch_price_list_rate) {
      if (frappe.meta.get_docfield(cdt, "stock_qty", cdn)) {
        var item = frappe.get_doc(cdt, cdn);
        frappe.model.round_floats_in(item, ["qty", "conversion_factor"]);
        item.stock_qty = flt(item.qty * item.conversion_factor, precision("stock_qty", item));
        refresh_field("stock_qty", item.name, item.parentfield);
        this.toggle_conversion_factor(item);
        if (doc.doctype != "Material Request") {
          item.total_weight = flt(item.stock_qty * item.weight_per_unit);
          refresh_field("total_weight", item.name, item.parentfield);
          this.calculate_net_weight();
        }
        if (frappe.flags.dont_fetch_price_list_rate) {
          return;
        }
        if (!dont_fetch_price_list_rate && frappe.meta.has_field(doc.doctype, "price_list_currency")) {
          this.apply_price_list(item, true);
        }
        this.calculate_stock_uom_rate(doc, cdt, cdn);
      }
    }
    batch_no(doc, cdt, cdn) {
      let item = frappe.get_doc(cdt, cdn);
      this.apply_price_list(item, true);
    }
    toggle_conversion_factor(item) {
      if (this.frm.get_field("items").grid.fields_map.conversion_factor) {
        this.frm.fields_dict.items.grid.toggle_enable("conversion_factor", item.uom != item.stock_uom && !frappe.meta.get_docfield(cur_frm.fields_dict.items.grid.doctype, "conversion_factor").read_only ? true : false);
      }
    }
    qty(doc, cdt, cdn) {
      let item = frappe.get_doc(cdt, cdn);
      this.conversion_factor(doc, cdt, cdn, true);
      this.calculate_stock_uom_rate(doc, cdt, cdn);
      this.apply_pricing_rule(item, true);
    }
    calculate_stock_uom_rate(doc, cdt, cdn) {
      let item = frappe.get_doc(cdt, cdn);
      item.stock_uom_rate = flt(item.rate) / flt(item.conversion_factor);
      refresh_field("stock_uom_rate", item.name, item.parentfield);
    }
    service_stop_date(frm, cdt, cdn) {
      var child = locals[cdt][cdn];
      if (child.service_stop_date) {
        let start_date = Date.parse(child.service_start_date);
        let end_date = Date.parse(child.service_end_date);
        let stop_date = Date.parse(child.service_stop_date);
        if (stop_date < start_date) {
          frappe.model.set_value(cdt, cdn, "service_stop_date", "");
          frappe.throw(__("Service Stop Date cannot be before Service Start Date"));
        } else if (stop_date > end_date) {
          frappe.model.set_value(cdt, cdn, "service_stop_date", "");
          frappe.throw(__("Service Stop Date cannot be after Service End Date"));
        }
      }
    }
    service_start_date(frm, cdt, cdn) {
      var child = locals[cdt][cdn];
      if (child.service_start_date) {
        frappe.call({
          "method": "erpnext.stock.get_item_details.calculate_service_end_date",
          args: { "args": child },
          callback: function(r) {
            frappe.model.set_value(cdt, cdn, "service_end_date", r.message.service_end_date);
          }
        });
      }
    }
    calculate_net_weight() {
      var me = this;
      this.frm.doc.total_net_weight = 0;
      $.each(this.frm.doc["items"] || [], function(i, item) {
        me.frm.doc.total_net_weight += flt(item.total_weight);
      });
      refresh_field("total_net_weight");
      this.shipping_rule();
    }
    set_dynamic_labels() {
      this.frm.toggle_reqd("plc_conversion_rate", !!(this.frm.doc.price_list_name && this.frm.doc.price_list_currency));
      var company_currency = this.get_company_currency();
      this.change_form_labels(company_currency);
      this.change_grid_labels(company_currency);
      this.frm.refresh_fields();
    }
    change_form_labels(company_currency) {
      var me = this;
      this.frm.set_currency_labels([
        "base_total",
        "base_net_total",
        "base_total_taxes_and_charges",
        "base_discount_amount",
        "base_grand_total",
        "base_rounded_total",
        "base_in_words",
        "base_taxes_and_charges_added",
        "base_taxes_and_charges_deducted",
        "total_amount_to_pay",
        "base_paid_amount",
        "base_write_off_amount",
        "base_change_amount",
        "base_operating_cost",
        "base_raw_material_cost",
        "base_total_cost",
        "base_scrap_material_cost",
        "base_rounding_adjustment"
      ], company_currency);
      this.frm.set_currency_labels([
        "total",
        "net_total",
        "total_taxes_and_charges",
        "discount_amount",
        "grand_total",
        "taxes_and_charges_added",
        "taxes_and_charges_deducted",
        "rounded_total",
        "in_words",
        "paid_amount",
        "write_off_amount",
        "operating_cost",
        "scrap_material_cost",
        "rounding_adjustment",
        "raw_material_cost",
        "total_cost"
      ], this.frm.doc.currency);
      this.frm.set_currency_labels(["outstanding_amount", "total_advance"], this.frm.doc.party_account_currency);
      cur_frm.set_df_property("conversion_rate", "description", "1 " + this.frm.doc.currency + " = [?] " + company_currency);
      if (this.frm.doc.price_list_currency && this.frm.doc.price_list_currency != company_currency) {
        cur_frm.set_df_property("plc_conversion_rate", "description", "1 " + this.frm.doc.price_list_currency + " = [?] " + company_currency);
      }
      this.frm.toggle_display([
        "conversion_rate",
        "base_total",
        "base_net_total",
        "base_total_taxes_and_charges",
        "base_taxes_and_charges_added",
        "base_taxes_and_charges_deducted",
        "base_grand_total",
        "base_rounded_total",
        "base_in_words",
        "base_discount_amount",
        "base_paid_amount",
        "base_write_off_amount",
        "base_operating_cost",
        "base_raw_material_cost",
        "base_total_cost",
        "base_scrap_material_cost",
        "base_rounding_adjustment"
      ], this.frm.doc.currency != company_currency);
      this.frm.toggle_display(["plc_conversion_rate", "price_list_currency"], this.frm.doc.price_list_currency != company_currency);
      var show = cint(cur_frm.doc.discount_amount) || (cur_frm.doc.taxes || []).filter(function(d) {
        return d.included_in_print_rate === 1;
      }).length;
      if (frappe.meta.get_docfield(cur_frm.doctype, "net_total"))
        cur_frm.toggle_display("net_total", show);
      if (frappe.meta.get_docfield(cur_frm.doctype, "base_net_total"))
        cur_frm.toggle_display("base_net_total", show && me.frm.doc.currency != company_currency);
    }
    change_grid_labels(company_currency) {
      var me = this;
      this.update_item_grid_labels(company_currency);
      this.toggle_item_grid_columns(company_currency);
      if (this.frm.doc.operations && this.frm.doc.operations.length > 0) {
        this.frm.set_currency_labels(["operating_cost", "hour_rate"], this.frm.doc.currency, "operations");
        this.frm.set_currency_labels(["base_operating_cost", "base_hour_rate"], company_currency, "operations");
        var item_grid = this.frm.fields_dict["operations"].grid;
        $.each(["base_operating_cost", "base_hour_rate"], function(i, fname) {
          if (frappe.meta.get_docfield(item_grid.doctype, fname))
            item_grid.set_column_disp(fname, me.frm.doc.currency != company_currency);
        });
      }
      if (this.frm.doc.scrap_items && this.frm.doc.scrap_items.length > 0) {
        this.frm.set_currency_labels(["rate", "amount"], this.frm.doc.currency, "scrap_items");
        this.frm.set_currency_labels(["base_rate", "base_amount"], company_currency, "scrap_items");
        var item_grid = this.frm.fields_dict["scrap_items"].grid;
        $.each(["base_rate", "base_amount"], function(i, fname) {
          if (frappe.meta.get_docfield(item_grid.doctype, fname))
            item_grid.set_column_disp(fname, me.frm.doc.currency != company_currency);
        });
      }
      if (this.frm.doc.taxes && this.frm.doc.taxes.length > 0) {
        this.frm.set_currency_labels(["tax_amount", "total", "tax_amount_after_discount"], this.frm.doc.currency, "taxes");
        this.frm.set_currency_labels(["base_tax_amount", "base_total", "base_tax_amount_after_discount"], company_currency, "taxes");
      }
      if (this.frm.doc.advances && this.frm.doc.advances.length > 0) {
        this.frm.set_currency_labels(["advance_amount", "allocated_amount"], this.frm.doc.party_account_currency, "advances");
      }
      this.update_payment_schedule_grid_labels(company_currency);
    }
    update_item_grid_labels(company_currency) {
      this.frm.set_currency_labels([
        "base_rate",
        "base_net_rate",
        "base_price_list_rate",
        "base_amount",
        "base_net_amount",
        "base_rate_with_margin"
      ], company_currency, "items");
      this.frm.set_currency_labels([
        "rate",
        "net_rate",
        "price_list_rate",
        "amount",
        "net_amount",
        "stock_uom_rate",
        "rate_with_margin"
      ], this.frm.doc.currency, "items");
    }
    update_payment_schedule_grid_labels(company_currency) {
      const me = this;
      if (this.frm.doc.payment_schedule && this.frm.doc.payment_schedule.length > 0) {
        this.frm.set_currency_labels(["base_payment_amount", "base_outstanding", "base_paid_amount"], company_currency, "payment_schedule");
        this.frm.set_currency_labels(["payment_amount", "outstanding", "paid_amount"], this.frm.doc.currency, "payment_schedule");
        var schedule_grid = this.frm.fields_dict["payment_schedule"].grid;
        $.each(["base_payment_amount", "base_outstanding", "base_paid_amount"], function(i, fname) {
          if (frappe.meta.get_docfield(schedule_grid.doctype, fname))
            schedule_grid.set_column_disp(fname, me.frm.doc.currency != company_currency);
        });
      }
    }
    toggle_item_grid_columns(company_currency) {
      const me = this;
      var item_grid = this.frm.fields_dict["items"].grid;
      $.each(["base_rate", "base_price_list_rate", "base_amount", "base_rate_with_margin"], function(i, fname) {
        if (frappe.meta.get_docfield(item_grid.doctype, fname))
          item_grid.set_column_disp(fname, me.frm.doc.currency != company_currency);
      });
      var show = cint(cur_frm.doc.discount_amount) || (cur_frm.doc.taxes || []).filter(function(d) {
        return d.included_in_print_rate === 1;
      }).length;
      $.each(["net_rate", "net_amount"], function(i, fname) {
        if (frappe.meta.get_docfield(item_grid.doctype, fname))
          item_grid.set_column_disp(fname, show);
      });
      $.each(["base_net_rate", "base_net_amount"], function(i, fname) {
        if (frappe.meta.get_docfield(item_grid.doctype, fname))
          item_grid.set_column_disp(fname, show && me.frm.doc.currency != company_currency);
      });
    }
    recalculate() {
      this.calculate_taxes_and_totals();
    }
    recalculate_values() {
      this.calculate_taxes_and_totals();
    }
    calculate_charges() {
      this.calculate_taxes_and_totals();
    }
    ignore_pricing_rule() {
      if (this.frm.doc.ignore_pricing_rule) {
        var me = this;
        var item_list = [];
        $.each(this.frm.doc["items"] || [], function(i, d) {
          if (d.item_code && !d.is_free_item) {
            item_list.push({
              "doctype": d.doctype,
              "name": d.name,
              "item_code": d.item_code,
              "pricing_rules": d.pricing_rules,
              "parenttype": d.parenttype,
              "parent": d.parent
            });
          }
        });
        return this.frm.call({
          method: "erpnext.accounts.doctype.pricing_rule.pricing_rule.remove_pricing_rules",
          args: { item_list },
          callback: function(r) {
            if (!r.exc && r.message) {
              r.message.forEach((row_item) => {
                me.remove_pricing_rule(row_item);
              });
              me._set_values_for_item_list(r.message);
              me.calculate_taxes_and_totals();
              if (me.frm.doc.apply_discount_on)
                me.frm.trigger("apply_discount_on");
            }
          }
        });
      } else {
        this.apply_pricing_rule();
      }
    }
    apply_pricing_rule(item, calculate_taxes_and_totals) {
      var me = this;
      var args = this._get_args(item);
      if (!(args.items && args.items.length)) {
        if (calculate_taxes_and_totals)
          me.calculate_taxes_and_totals();
        return;
      }
      return this.frm.call({
        method: "erpnext.accounts.doctype.pricing_rule.pricing_rule.apply_pricing_rule",
        args: { args, doc: me.frm.doc },
        callback: function(r) {
          if (!r.exc && r.message) {
            me._set_values_for_item_list(r.message);
            if (item)
              me.set_gross_profit(item);
            if (me.frm.doc.apply_discount_on)
              me.frm.trigger("apply_discount_on");
          }
        }
      });
    }
    _get_args(item) {
      var me = this;
      return {
        "items": this._get_item_list(item),
        "customer": me.frm.doc.customer || me.frm.doc.party_name,
        "quotation_to": me.frm.doc.quotation_to,
        "customer_group": me.frm.doc.customer_group,
        "territory": me.frm.doc.territory,
        "supplier": me.frm.doc.supplier,
        "supplier_group": me.frm.doc.supplier_group,
        "currency": me.frm.doc.currency,
        "conversion_rate": me.frm.doc.conversion_rate,
        "price_list": me.frm.doc.selling_price_list || me.frm.doc.buying_price_list,
        "price_list_currency": me.frm.doc.price_list_currency,
        "plc_conversion_rate": me.frm.doc.plc_conversion_rate,
        "company": me.frm.doc.company,
        "transaction_date": me.frm.doc.transaction_date || me.frm.doc.posting_date,
        "campaign": me.frm.doc.campaign,
        "sales_partner": me.frm.doc.sales_partner,
        "ignore_pricing_rule": me.frm.doc.ignore_pricing_rule,
        "doctype": me.frm.doc.doctype,
        "name": me.frm.doc.name,
        "is_return": cint(me.frm.doc.is_return),
        "update_stock": in_list(["Sales Invoice", "Purchase Invoice"], me.frm.doc.doctype) ? cint(me.frm.doc.update_stock) : 0,
        "conversion_factor": me.frm.doc.conversion_factor,
        "pos_profile": me.frm.doc.doctype == "Sales Invoice" ? me.frm.doc.pos_profile : "",
        "coupon_code": me.frm.doc.coupon_code
      };
    }
    _get_item_list(item) {
      var item_list = [];
      var append_item = function(d) {
        if (d.item_code) {
          item_list.push({
            "doctype": d.doctype,
            "name": d.name,
            "child_docname": d.name,
            "item_code": d.item_code,
            "item_group": d.item_group,
            "brand": d.brand,
            "qty": d.qty,
            "stock_qty": d.stock_qty,
            "uom": d.uom,
            "stock_uom": d.stock_uom,
            "parenttype": d.parenttype,
            "parent": d.parent,
            "pricing_rules": d.pricing_rules,
            "warehouse": d.warehouse,
            "serial_no": d.serial_no,
            "batch_no": d.batch_no,
            "price_list_rate": d.price_list_rate,
            "conversion_factor": d.conversion_factor || 1
          });
          if (in_list(["Quotation Item", "Sales Order Item", "Delivery Note Item", "Sales Invoice Item", "Purchase Invoice Item", "Purchase Order Item", "Purchase Receipt Item", "Proforma Invoice Item"]), d.doctype) {
            item_list[0]["margin_type"] = d.margin_type;
            item_list[0]["margin_rate_or_amount"] = d.margin_rate_or_amount;
          }
        }
      };
      if (item) {
        append_item(item);
      } else {
        $.each(this.frm.doc["items"] || [], function(i, d) {
          append_item(d);
        });
      }
      return item_list;
    }
    _set_values_for_item_list(children) {
      var me = this;
      var price_list_rate_changed = false;
      var items_rule_dict = {};
      for (var i = 0, l = children.length; i < l; i++) {
        var d = children[i];
        var existing_pricing_rule = frappe.model.get_value(d.doctype, d.name, "pricing_rules");
        for (var k in d) {
          var v = d[k];
          if (["doctype", "name"].indexOf(k) === -1) {
            if (k == "price_list_rate") {
              if (flt(v) != flt(d.price_list_rate))
                price_list_rate_changed = true;
            }
            if (k !== "free_item_data") {
              frappe.model.set_value(d.doctype, d.name, k, v);
            }
          }
        }
        if (!me.frm.doc.ignore_pricing_rule && existing_pricing_rule && !d.pricing_rules) {
          me.apply_price_list(frappe.get_doc(d.doctype, d.name));
        } else if (!d.pricing_rules) {
          me.remove_pricing_rule(frappe.get_doc(d.doctype, d.name));
        }
        if (d.free_item_data) {
          me.apply_product_discount(d);
        }
        if (d.apply_rule_on_other_items) {
          items_rule_dict[d.name] = d;
        }
      }
      me.apply_rule_on_other_items(items_rule_dict);
      if (!price_list_rate_changed)
        me.calculate_taxes_and_totals();
    }
    apply_rule_on_other_items(args) {
      const me = this;
      const fields = ["discount_percentage", "pricing_rules", "discount_amount", "rate"];
      for (var k in args) {
        let data = args[k];
        if (data && data.apply_rule_on_other_items) {
          me.frm.doc.items.forEach((d) => {
            if (in_list(data.apply_rule_on_other_items, d[data.apply_rule_on])) {
              for (var k2 in data) {
                if (in_list(fields, k2) && data[k2] && (data.price_or_product_discount === "price" || k2 === "pricing_rules")) {
                  frappe.model.set_value(d.doctype, d.name, k2, data[k2]);
                }
              }
            }
          });
        }
      }
    }
    apply_product_discount(args) {
      const items = this.frm.doc.items.filter((d) => d.is_free_item) || [];
      const exist_items = items.map((row) => (row.item_code, row.pricing_rules));
      args.free_item_data.forEach((pr_row) => {
        let row_to_modify = {};
        if (!items || !in_list(exist_items, (pr_row.item_code, pr_row.pricing_rules))) {
          row_to_modify = frappe.model.add_child(this.frm.doc, this.frm.doc.doctype + " Item", "items");
        } else if (items) {
          row_to_modify = items.filter((d) => d.item_code === pr_row.item_code && d.pricing_rules === pr_row.pricing_rules)[0];
        }
        for (let key in pr_row) {
          row_to_modify[key] = pr_row[key];
        }
      });
      args.free_item_data = "";
      refresh_field("items");
    }
    apply_price_list(item, reset_plc_conversion) {
      if (!reset_plc_conversion) {
        this.frm.set_value("plc_conversion_rate", "");
      }
      var me = this;
      var args = this._get_args(item);
      if (!(args.items && args.items.length || args.price_list)) {
        return;
      }
      if (me.in_apply_price_list == true)
        return;
      me.in_apply_price_list = true;
      return this.frm.call({
        method: "erpnext.stock.get_item_details.apply_price_list",
        args: { args },
        callback: function(r) {
          if (!r.exc) {
            frappe.run_serially([
              () => me.frm.set_value("price_list_currency", r.message.parent.price_list_currency),
              () => me.frm.set_value("plc_conversion_rate", r.message.parent.plc_conversion_rate),
              () => {
                if (args.items.length) {
                  me._set_values_for_item_list(r.message.children);
                }
              },
              () => {
                me.in_apply_price_list = false;
              }
            ]);
          } else {
            me.in_apply_price_list = false;
          }
        }
      }).always(() => {
        me.in_apply_price_list = false;
      });
    }
    remove_pricing_rule(item) {
      let me = this;
      const fields = [
        "discount_percentage",
        "discount_amount",
        "margin_rate_or_amount",
        "rate_with_margin"
      ];
      if (item.remove_free_item) {
        var items = [];
        me.frm.doc.items.forEach((d) => {
          if (d.item_code != item.remove_free_item || !d.is_free_item) {
            items.push(d);
          }
        });
        me.frm.doc.items = items;
        refresh_field("items");
      } else if (item.applied_on_items && item.apply_on) {
        const applied_on_items = item.applied_on_items.split(",");
        me.frm.doc.items.forEach((row) => {
          if (applied_on_items.includes(row[item.apply_on])) {
            fields.forEach((f) => {
              row[f] = 0;
            });
            ["pricing_rules", "margin_type"].forEach((field) => {
              if (row[field]) {
                row[field] = "";
              }
            });
          }
        });
        me.trigger_price_list_rate();
      }
    }
    trigger_price_list_rate() {
      var me = this;
      this.frm.doc.items.forEach((child_row) => {
        me.frm.script_manager.trigger("price_list_rate", child_row.doctype, child_row.name);
      });
    }
    validate_company_and_party() {
      var me = this;
      var valid = true;
      $.each(["company", "customer"], function(i, fieldname) {
        if (frappe.meta.has_field(me.frm.doc.doctype, fieldname) && me.frm.doc.doctype != "Purchase Order") {
          if (!me.frm.doc[fieldname]) {
            frappe.msgprint(__("Please specify") + ": " + frappe.meta.get_label(me.frm.doc.doctype, fieldname, me.frm.doc.name) + ". " + __("It is needed to fetch Item Details."));
            valid = false;
          }
        }
      });
      return valid;
    }
    get_terms() {
      var me = this;
      erpnext.utils.get_terms(this.frm.doc.tc_name, this.frm.doc, function(r) {
        if (!r.exc) {
          me.frm.set_value("terms", r.message);
        }
      });
    }
    taxes_and_charges() {
      var me = this;
      if (this.frm.doc.taxes_and_charges) {
        return this.frm.call({
          method: "erpnext.controllers.accounts_controller.get_taxes_and_charges",
          args: {
            "master_doctype": frappe.meta.get_docfield(this.frm.doc.doctype, "taxes_and_charges", this.frm.doc.name).options,
            "master_name": this.frm.doc.taxes_and_charges
          },
          callback: function(r) {
            if (!r.exc) {
              if (me.frm.doc.shipping_rule && me.frm.doc.taxes) {
                for (let tax of r.message) {
                  me.frm.add_child("taxes", tax);
                }
                refresh_field("taxes");
              } else {
                me.frm.set_value("taxes", r.message);
                me.calculate_taxes_and_totals();
              }
            }
          }
        });
      }
    }
    tax_category() {
      var me = this;
      if (me.frm.updating_party_details)
        return;
      frappe.run_serially([
        () => this.update_item_tax_map(),
        () => erpnext.utils.set_taxes(this.frm, "tax_category")
      ]);
    }
    update_item_tax_map() {
      let me = this;
      let item_codes = [];
      let item_rates = {};
      let item_tax_templates = {};
      $.each(this.frm.doc.items || [], function(i, item) {
        if (item.item_code) {
          item_codes.push([item.item_code, item.name]);
          item_rates[item.name] = item.net_rate;
          item_tax_templates[item.name] = item.item_tax_template;
        }
      });
      if (item_codes.length) {
        return this.frm.call({
          method: "erpnext.stock.get_item_details.get_item_tax_info",
          args: {
            company: me.frm.doc.company,
            tax_category: cstr(me.frm.doc.tax_category),
            item_codes,
            item_rates,
            item_tax_templates
          },
          callback: function(r) {
            if (!r.exc) {
              $.each(me.frm.doc.items || [], function(i, item) {
                if (item.name && r.message.hasOwnProperty(item.name) && r.message[item.name].item_tax_template) {
                  item.item_tax_template = r.message[item.name].item_tax_template;
                  item.item_tax_rate = r.message[item.name].item_tax_rate;
                  me.add_taxes_from_item_tax_template(item.item_tax_rate);
                }
              });
            }
          }
        });
      }
    }
    item_tax_template(doc, cdt, cdn) {
      var me = this;
      if (me.frm.updating_party_details)
        return;
      var item = frappe.get_doc(cdt, cdn);
      if (item.item_tax_template) {
        return this.frm.call({
          method: "erpnext.stock.get_item_details.get_item_tax_map",
          args: {
            company: me.frm.doc.company,
            item_tax_template: item.item_tax_template,
            as_json: true
          },
          callback: function(r) {
            if (!r.exc) {
              item.item_tax_rate = r.message;
              me.calculate_taxes_and_totals();
            }
          }
        });
      } else {
        item.item_tax_rate = "{}";
        me.calculate_taxes_and_totals();
      }
    }
    is_recurring() {
      if (this.frm.doc.is_recurring && this.frm.doc.__islocal) {
        frappe.msgprint(__("Please set recurring after saving"));
        this.frm.set_value("is_recurring", 0);
        return;
      }
      if (this.frm.doc.is_recurring) {
        if (!this.frm.doc.recurring_id) {
          this.frm.set_value("recurring_id", this.frm.doc.name);
        }
        var owner_email = this.frm.doc.owner == "Administrator" ? frappe.user_info("Administrator").email : this.frm.doc.owner;
        this.frm.doc.notification_email_address = $.map([
          cstr(owner_email),
          cstr(this.frm.doc.contact_email)
        ], function(v) {
          return v || null;
        }).join(", ");
        this.frm.doc.repeat_on_day_of_month = frappe.datetime.str_to_obj(this.frm.doc.posting_date).getDate();
      }
      refresh_many(["notification_email_address", "repeat_on_day_of_month"]);
    }
    from_date() {
      if (this.frm.doc.from_date) {
        var recurring_type_map = {
          "Monthly": 1,
          "Quarterly": 3,
          "Half-yearly": 6,
          "Yearly": 12
        };
        var months = recurring_type_map[this.frm.doc.recurring_type];
        if (months) {
          var to_date = frappe.datetime.add_months(this.frm.doc.from_date, months);
          this.frm.doc.to_date = frappe.datetime.add_days(to_date, -1);
          refresh_field("to_date");
        }
      }
    }
    set_gross_profit(item) {
      if (["Sales Order", "Quotation", "Proforma Invoice"].includes(this.frm.doc.doctype) && item.valuation_rate) {
        var rate = flt(item.rate) * flt(this.frm.doc.conversion_rate || 1);
        item.gross_profit = flt((rate - item.valuation_rate) * item.stock_qty, precision("amount", item));
      }
    }
    setup_item_selector() {
      return;
    }
    get_advances() {
      if (!this.frm.is_return) {
        return this.frm.call({
          method: "set_advances",
          doc: this.frm.doc,
          callback: function(r, rt) {
            refresh_field("advances");
          }
        });
      }
    }
    make_payment_entry() {
      return frappe.call({
        method: cur_frm.cscript.get_method_for_payment(),
        args: {
          "dt": cur_frm.doc.doctype,
          "dn": cur_frm.doc.name
        },
        callback: function(r) {
          var doclist = frappe.model.sync(r.message);
          frappe.set_route("Form", doclist[0].doctype, doclist[0].name);
        }
      });
    }
    make_quality_inspection() {
      let data = [];
      const fields = [
        {
          label: "Items",
          fieldtype: "Table",
          fieldname: "items",
          cannot_add_rows: true,
          in_place_edit: true,
          data,
          get_data: () => {
            return data;
          },
          fields: [
            {
              fieldtype: "Data",
              fieldname: "docname",
              hidden: true
            },
            {
              fieldtype: "Read Only",
              fieldname: "item_code",
              label: __("Item Code"),
              in_list_view: true
            },
            {
              fieldtype: "Read Only",
              fieldname: "item_name",
              label: __("Item Name"),
              in_list_view: true
            },
            {
              fieldtype: "Float",
              fieldname: "qty",
              label: __("Accepted Quantity"),
              in_list_view: true,
              read_only: true
            },
            {
              fieldtype: "Float",
              fieldname: "sample_size",
              label: __("Sample Size"),
              reqd: true,
              in_list_view: true
            },
            {
              fieldtype: "Data",
              fieldname: "description",
              label: __("Description"),
              hidden: true
            },
            {
              fieldtype: "Data",
              fieldname: "serial_no",
              label: __("Serial No"),
              hidden: true
            },
            {
              fieldtype: "Data",
              fieldname: "batch_no",
              label: __("Batch No"),
              hidden: true
            }
          ]
        }
      ];
      const me = this;
      const dialog2 = new frappe.ui.Dialog({
        title: __("Select Items for Quality Inspection"),
        fields,
        primary_action: function() {
          const data2 = dialog2.get_values();
          frappe.call({
            method: "erpnext.controllers.stock_controller.make_quality_inspections",
            args: {
              doctype: me.frm.doc.doctype,
              docname: me.frm.doc.name,
              items: data2.items
            },
            freeze: true,
            callback: function(r) {
              if (r.message.length > 0) {
                if (r.message.length === 1) {
                  frappe.set_route("Form", "Quality Inspection", r.message[0]);
                } else {
                  frappe.route_options = {
                    "reference_type": me.frm.doc.doctype,
                    "reference_name": me.frm.doc.name
                  };
                  frappe.set_route("List", "Quality Inspection");
                }
              }
              dialog2.hide();
            }
          });
        },
        primary_action_label: __("Create")
      });
      this.frm.doc.items.forEach((item) => {
        if (!item.quality_inspection) {
          let dialog_items = dialog2.fields_dict.items;
          dialog_items.df.data.push({
            "docname": item.name,
            "item_code": item.item_code,
            "item_name": item.item_name,
            "qty": item.qty,
            "description": item.description,
            "serial_no": item.serial_no,
            "batch_no": item.batch_no
          });
          dialog_items.grid.refresh();
        }
      });
      data = dialog2.fields_dict.items.df.data;
      if (!data.length) {
        frappe.msgprint(__("All items in this document already have a linked Quality Inspection."));
      } else {
        dialog2.show();
      }
    }
    get_method_for_payment() {
      var method = "erpnext.accounts.doctype.payment_entry.payment_entry.get_payment_entry";
      if (cur_frm.doc.__onload && cur_frm.doc.__onload.make_payment_via_journal_entry) {
        if (in_list(["Sales Invoice", "Purchase Invoice"], cur_frm.doc.doctype)) {
          method = "erpnext.accounts.doctype.journal_entry.journal_entry.get_payment_entry_against_invoice";
        } else {
          method = "erpnext.accounts.doctype.journal_entry.journal_entry.get_payment_entry_against_order";
        }
      }
      return method;
    }
    set_query_for_batch(doc, cdt, cdn) {
      var me = this;
      var item = frappe.get_doc(cdt, cdn);
      if (!item.item_code) {
        frappe.throw(__("Please enter Item Code to get batch no"));
      } else if (doc.doctype == "Purchase Receipt" || doc.doctype == "Purchase Invoice" && doc.update_stock) {
        return {
          filters: { "item": item.item_code }
        };
      } else {
        let filters = {
          "item_code": item.item_code,
          "posting_date": me.frm.doc.posting_date || frappe.datetime.nowdate()
        };
        if (doc.is_return) {
          filters["is_return"] = 1;
        }
        if (item.warehouse)
          filters["warehouse"] = item.warehouse;
        return {
          query: "erpnext.controllers.queries.get_batch_no",
          filters
        };
      }
    }
    set_query_for_item_tax_template(doc, cdt, cdn) {
      var item = frappe.get_doc(cdt, cdn);
      if (!item.item_code) {
        return doc.company ? { filters: { company: doc.company } } : {};
      } else {
        let filters = {
          "item_code": item.item_code,
          "valid_from": ["<=", doc.transaction_date || doc.bill_date || doc.posting_date],
          "item_group": item.item_group
        };
        if (doc.tax_category)
          filters["tax_category"] = doc.tax_category;
        if (doc.company)
          filters["company"] = doc.company;
        return {
          query: "erpnext.controllers.queries.get_tax_template",
          filters
        };
      }
    }
    payment_terms_template() {
      var me = this;
      const doc = this.frm.doc;
      if (doc.payment_terms_template && doc.doctype !== "Delivery Note") {
        var posting_date = doc.posting_date || doc.transaction_date;
        frappe.call({
          method: "erpnext.controllers.accounts_controller.get_payment_terms",
          args: {
            terms_template: doc.payment_terms_template,
            posting_date,
            grand_total: doc.rounded_total || doc.grand_total,
            base_grand_total: doc.base_rounded_total || doc.base_grand_total,
            bill_date: doc.bill_date
          },
          callback: function(r) {
            if (r.message && !r.exc) {
              me.frm.set_value("payment_schedule", r.message);
              const company_currency = me.get_company_currency();
              me.update_payment_schedule_grid_labels(company_currency);
            }
          }
        });
      }
    }
    payment_term(doc, cdt, cdn) {
      const me = this;
      var row = locals[cdt][cdn];
      if (row.payment_term) {
        frappe.call({
          method: "erpnext.controllers.accounts_controller.get_payment_term_details",
          args: {
            term: row.payment_term,
            bill_date: this.frm.doc.bill_date,
            posting_date: this.frm.doc.posting_date || this.frm.doc.transaction_date,
            grand_total: this.frm.doc.rounded_total || this.frm.doc.grand_total,
            base_grand_total: this.frm.doc.base_rounded_total || this.frm.doc.base_grand_total
          },
          callback: function(r) {
            if (r.message && !r.exc) {
              for (var d in r.message) {
                frappe.model.set_value(cdt, cdn, d, r.message[d]);
                const company_currency = me.get_company_currency();
                me.update_payment_schedule_grid_labels(company_currency);
              }
            }
          }
        });
      }
    }
    against_blanket_order(doc, cdt, cdn) {
      var item = locals[cdt][cdn];
      if (!item.against_blanket_order) {
        frappe.model.set_value(this.frm.doctype + " Item", item.name, "blanket_order", null);
        frappe.model.set_value(this.frm.doctype + " Item", item.name, "blanket_order_rate", 0);
      }
    }
    blanket_order(doc, cdt, cdn) {
      var me = this;
      var item = locals[cdt][cdn];
      if (item.blanket_order && (item.parenttype == "Sales Order" || item.parenttype == "Purchase Order")) {
        frappe.call({
          method: "erpnext.stock.get_item_details.get_blanket_order_details",
          args: {
            args: {
              item_code: item.item_code,
              customer: doc.customer,
              supplier: doc.supplier,
              company: doc.company,
              transaction_date: doc.transaction_date,
              blanket_order: item.blanket_order
            }
          },
          callback: function(r) {
            if (!r.message) {
              frappe.throw(__("Invalid Blanket Order for the selected Customer and Item"));
            } else {
              frappe.run_serially([
                () => frappe.model.set_value(cdt, cdn, "blanket_order_rate", r.message.blanket_order_rate),
                () => me.frm.script_manager.trigger("price_list_rate", cdt, cdn)
              ]);
            }
          }
        });
      }
    }
    set_reserve_warehouse() {
      this.autofill_warehouse(this.frm.doc.supplied_items, "reserve_warehouse", this.frm.doc.set_reserve_warehouse);
    }
    set_warehouse() {
      this.autofill_warehouse(this.frm.doc.items, "warehouse", this.frm.doc.set_warehouse);
    }
    set_target_warehouse() {
      this.autofill_warehouse(this.frm.doc.items, "target_warehouse", this.frm.doc.set_target_warehouse);
    }
    set_from_warehouse() {
      this.autofill_warehouse(this.frm.doc.items, "from_warehouse", this.frm.doc.set_from_warehouse);
    }
    autofill_warehouse(child_table, warehouse_field, warehouse) {
      if (warehouse && child_table && child_table.length) {
        let doctype = child_table[0].doctype;
        $.each(child_table || [], function(i, item) {
          frappe.model.set_value(doctype, item.name, warehouse_field, warehouse);
        });
      }
    }
    coupon_code() {
      var me = this;
      frappe.run_serially([
        () => this.frm.doc.ignore_pricing_rule = 1,
        () => me.ignore_pricing_rule(),
        () => this.frm.doc.ignore_pricing_rule = 0,
        () => me.apply_pricing_rule()
      ]);
    }
  };
  erpnext.show_serial_batch_selector = function(frm, d, callback, on_close, show_dialog) {
    let warehouse, receiving_stock, existing_stock;
    if (frm.doc.is_return) {
      if (["Purchase Receipt", "Purchase Invoice"].includes(frm.doc.doctype)) {
        existing_stock = true;
        warehouse = d.warehouse;
      } else if (["Delivery Note", "Sales Invoice"].includes(frm.doc.doctype)) {
        receiving_stock = true;
      }
    } else {
      if (frm.doc.doctype == "Stock Entry") {
        if (frm.doc.purpose == "Material Receipt") {
          receiving_stock = true;
        } else {
          existing_stock = true;
          warehouse = d.s_warehouse;
        }
      } else {
        existing_stock = true;
        warehouse = d.warehouse;
      }
    }
    if (!warehouse) {
      if (receiving_stock) {
        warehouse = ["like", ""];
      } else if (existing_stock) {
        warehouse = ["!=", ""];
      }
    }
    frappe.require("assets/erpnext/js/utils/serial_no_batch_selector.js", function() {
      new erpnext.SerialNoBatchSelector({
        frm,
        item: d,
        warehouse_details: {
          type: "Warehouse",
          name: warehouse
        },
        callback,
        on_close
      }, show_dialog);
    });
  };
  erpnext.apply_putaway_rule = (frm, purpose = null) => {
    if (!frm.doc.company) {
      frappe.throw({ message: __("Please select a Company first."), title: __("Mandatory") });
    }
    if (!frm.doc.items.length)
      return;
    frappe.call({
      method: "erpnext.stock.doctype.putaway_rule.putaway_rule.apply_putaway_rule",
      args: {
        doctype: frm.doctype,
        items: frm.doc.items,
        company: frm.doc.company,
        sync: true,
        purpose
      },
      callback: (result) => {
        if (!result.exc && result.message) {
          frm.clear_table("items");
          let items = result.message;
          items.forEach((row) => {
            delete row["name"];
            let child = frm.add_child("items");
            Object.assign(child, row);
            frm.script_manager.trigger("qty", child.doctype, child.name);
          });
          frm.get_field("items").grid.refresh();
        }
      }
    });
  };

  // ../engr/engr/public/js/frappe/report/query_report.js
  var import_frappe_datatable = __toESM(require_frappe_datatable_cjs());
  frappe.provide("frappe.widget.utils");
  frappe.provide("frappe.views");
  frappe.provide("frappe.query_reports");
  frappe.standard_pages["query-report"] = function() {
    var wrapper = frappe.container.add_page("query-report");
    frappe.ui.make_app_page({
      parent: wrapper,
      title: __("Query Report"),
      single_column: true
    });
    frappe.query_report = new frappe.views.QueryReport({
      parent: wrapper
    });
    $(wrapper).bind("show", function() {
      frappe.query_report.show();
    });
  };
  frappe.views.QueryReport = class QueryReport extends frappe.views.BaseList {
    show() {
      this.init().then(() => this.load());
    }
    init() {
      if (this.init_promise) {
        return this.init_promise;
      }
      let tasks = [
        this.setup_defaults,
        this.setup_page,
        this.setup_report_wrapper,
        this.setup_events
      ].map((fn) => fn.bind(this));
      this.init_promise = frappe.run_serially(tasks);
      return this.init_promise;
    }
    setup_defaults() {
      this.route = frappe.get_route();
      this.page_name = frappe.get_route_str();
      this.primary_action = null;
      this.refresh = frappe.utils.throttle(this.refresh, 300);
      this.menu_items = [];
    }
    update_url_with_filters() {
      if (frappe.get_route_str() == this.page_name) {
        window.history.replaceState(null, null, this.get_url_with_filters());
      }
    }
    get_url_with_filters() {
      const query_params = Object.entries(this.get_filter_values()).map(([field, value], _idx) => {
        if (Array.isArray(value)) {
          if (!value.length)
            return "";
          value = JSON.stringify(value);
        }
        return `${field}=${encodeURIComponent(value)}`;
      }).filter(Boolean).join("&");
      let full_url = window.location.href.replace(window.location.search, "");
      if (query_params) {
        full_url += "?" + query_params;
      }
      return full_url;
    }
    set_default_secondary_action() {
      this.refresh_button && this.refresh_button.remove();
      this.refresh_button = this.page.add_action_icon("refresh", () => {
        this.setup_progress_bar();
        this.refresh();
      });
    }
    get_no_result_message() {
      return `<div class="msg-box no-border">
			<div>
				<img src="/assets/frappe/images/ui-states/list-empty-state.svg" alt="Generic Empty State" class="null-state">
			</div>
			<p>${__("Nothing to show")}</p>
		</div>`;
    }
    setup_events() {
      frappe.realtime.on("report_generated", (data) => {
        this.toggle_primary_button_disabled(false);
        if (data.report_name) {
          this.prepared_report_action = "Rebuild";
          if (data.name == this.prepared_report_doc_name) {
            this.refresh();
          } else {
            let alert_message = `Report ${this.report_name} generated.
						<a href="#query-report/${this.report_name}/?prepared_report_name=${data.name}">View</a>`;
            frappe.show_alert({ message: alert_message, indicator: "orange" });
          }
        }
      });
      this.page.wrapper.on("click", "[data-action]", (e) => {
        let action_name = $(e.currentTarget).data("action");
        let action = this[action_name];
        if (action.call) {
          action.call(this, e);
        }
      });
    }
    load() {
      if (frappe.get_route().length < 2) {
        this.toggle_nothing_to_show(true);
        return;
      }
      let route_options = {};
      route_options = Object.assign(route_options, frappe.route_options);
      if (this.report_name !== frappe.get_route()[1]) {
        this.load_report(route_options);
      } else if (frappe.has_route_options()) {
        this.refresh_report(route_options);
      } else {
      }
    }
    load_report(route_options) {
      this.page.clear_inner_toolbar();
      this.route = frappe.get_route();
      this.page_name = frappe.get_route_str();
      this.report_name = this.route[1];
      this.page_title = __(this.report_name);
      this.show_save = false;
      this.menu_items = this.get_menu_items();
      this.datatable = null;
      this.prepared_report_action = "New";
      frappe.run_serially([
        () => this.get_report_doc(),
        () => this.get_report_settings(),
        () => this.setup_progress_bar(),
        () => this.setup_page_head(),
        () => this.refresh_report(route_options),
        () => this.add_chart_buttons_to_toolbar(true),
        () => this.add_card_button_to_toolbar(true)
      ]);
    }
    add_card_button_to_toolbar() {
      this.page.add_inner_button(__("Create Card"), () => {
        this.add_card_to_dashboard();
      });
    }
    add_chart_buttons_to_toolbar(show) {
      if (show) {
        this.create_chart_button && this.create_chart_button.remove();
        this.create_chart_button = this.page.add_button(__("Set Chart"), () => {
          this.open_create_chart_dialog();
        });
        if (this.chart_fields || this.chart_options) {
          this.add_to_dashboard_button && this.add_to_dashboard_button.remove();
          this.add_to_dashboard_button = this.page.add_button(__("Add Chart to Dashboard"), () => {
            this.add_chart_to_dashboard();
          });
        }
      } else {
        this.create_chart_button && this.create_chart_button.remove();
        this.add_to_dashboard_button && this.add_to_dashboard_button.remove();
      }
    }
    add_card_to_dashboard() {
      let field_options = frappe.report_utils.get_field_options_from_report(this.columns, this.raw_data);
      const dashboard_field = frappe.dashboard_utils.get_dashboard_link_field();
      const set_standard = frappe.boot.developer_mode;
      const dialog2 = new frappe.ui.Dialog({
        title: __("Create Card"),
        fields: [
          {
            fieldname: "report_field",
            label: __("Field"),
            fieldtype: "Select",
            options: field_options.numeric_fields
          },
          {
            fieldname: "cb_1",
            fieldtype: "Column Break"
          },
          {
            fieldname: "report_function",
            label: __("Function"),
            options: ["Sum", "Average", "Minimum", "Maximum"],
            fieldtype: "Select"
          },
          {
            fieldname: "sb_1",
            label: __("Add to Dashboard"),
            fieldtype: "Section Break"
          },
          dashboard_field,
          {
            fieldname: "cb_2",
            fieldtype: "Column Break"
          },
          {
            fieldname: "label",
            label: __("Card Label"),
            fieldtype: "Data"
          }
        ],
        primary_action_label: __("Add"),
        primary_action: (values) => {
          if (!values.label) {
            values.label = `${values.report_function} of ${toTitle(values.report_field)}`;
          }
          this.create_number_card(values, values.dashboard, values.label, set_standard);
          dialog2.hide();
        }
      });
      dialog2.show();
    }
    add_chart_to_dashboard() {
      if (this.chart_fields || this.chart_options) {
        const dashboard_field = frappe.dashboard_utils.get_dashboard_link_field();
        const set_standard = frappe.boot.developer_mode;
        const dialog2 = new frappe.ui.Dialog({
          title: __("Create Chart"),
          fields: [
            {
              fieldname: "dashboard_chart_name",
              label: "Chart Name",
              fieldtype: "Data"
            },
            dashboard_field
          ],
          primary_action_label: __("Add"),
          primary_action: (values) => {
            this.create_dashboard_chart(this.chart_fields || this.chart_options, values.dashboard, values.dashboard_chart_name, set_standard);
            dialog2.hide();
          }
        });
        dialog2.show();
      } else {
        frappe.msgprint(__("Please Set Chart"));
      }
    }
    create_number_card(values, dashboard_name, card_name, set_standard) {
      let args = {
        dashboard: dashboard_name || null,
        type: "Report",
        report_name: this.report_name,
        filters_json: JSON.stringify(this.get_filter_values()),
        set_standard
      };
      Object.assign(args, values);
      this.add_to_dashboard("frappe.desk.doctype.number_card.number_card.create_report_number_card", args, dashboard_name, card_name, "Number Card");
    }
    create_dashboard_chart(chart_args, dashboard_name, chart_name, set_standard) {
      let args = {
        dashboard: dashboard_name || null,
        chart_type: "Report",
        report_name: this.report_name,
        type: chart_args.chart_type || frappe.model.unscrub(chart_args.type),
        color: chart_args.color,
        filters_json: JSON.stringify(this.get_filter_values()),
        custom_options: {},
        set_standard
      };
      for (let key in chart_args) {
        if (key != "data") {
          args["custom_options"][key] = chart_args[key];
        }
      }
      if (this.chart_fields) {
        let x_field_title = toTitle(chart_args.x_field);
        let y_field_title = toTitle(chart_args.y_fields[0]);
        chart_name = chart_name || `${this.report_name}: ${x_field_title} vs ${y_field_title}`;
        Object.assign(args, {
          chart_name,
          x_field: chart_args.x_field,
          y_axis: chart_args.y_axis_fields.map((f) => {
            return { y_field: f.y_field, color: f.color };
          }),
          use_report_chart: 0
        });
      } else {
        chart_name = chart_name || this.report_name;
        Object.assign(args, {
          chart_name,
          use_report_chart: 1
        });
      }
      this.add_to_dashboard("frappe.desk.doctype.dashboard_chart.dashboard_chart.create_report_chart", args, dashboard_name, chart_name, "Dashboard Chart");
    }
    add_to_dashboard(method, args, dashboard_name, name, doctype) {
      frappe.xcall(method, { args }).then(() => {
        let message;
        if (dashboard_name) {
          let dashboard_route_html = `<a href="#dashboard-view/${dashboard_name}">${dashboard_name}</a>`;
          message = __("New {0} {1} added to Dashboard {2}", [
            __(doctype),
            name,
            dashboard_route_html
          ]);
        } else {
          message = __("New {0} {1} created", [__(doctype), name]);
        }
        frappe.msgprint(message, __("New {0} Created", [__(doctype)]));
      });
    }
    refresh_report(route_options) {
      this.toggle_message(true);
      this.toggle_report(false);
      return frappe.run_serially([
        () => this.setup_filters(),
        () => this.set_route_filters(route_options),
        () => this.page.clear_custom_actions(),
        () => this.report_settings.onload && this.report_settings.onload(this),
        () => this.refresh()
      ]);
    }
    get_report_doc() {
      return frappe.model.with_doc("Report", this.report_name).then((doc) => {
        this.report_doc = doc;
      }).then(() => frappe.model.with_doctype(this.report_doc.ref_doctype));
    }
    get_report_settings() {
      return new Promise((resolve, reject) => {
        if (frappe.query_reports[this.report_name]) {
          this.report_settings = frappe.query_reports[this.report_name];
          resolve();
        } else {
          frappe.xcall("frappe.desk.query_report.get_script", {
            report_name: this.report_name
          }).then((settings) => {
            frappe.dom.eval(settings.script || "");
            frappe.after_ajax(() => {
              this.report_settings = this.get_local_report_settings();
              this.report_settings.html_format = settings.html_format;
              this.report_settings.execution_time = settings.execution_time || 0;
              frappe.query_reports[this.report_name] = this.report_settings;
              if (this.report_doc.filters && !this.report_settings.filters) {
                this.report_settings.filters = this.report_doc.filters;
              }
              resolve();
            });
          }).catch(reject);
        }
      });
    }
    get_local_report_settings() {
      let report_script_name = this.report_doc.report_type === "Custom Report" ? this.report_doc.reference_report : this.report_name;
      return frappe.query_reports[report_script_name] || {};
    }
    setup_progress_bar() {
      let seconds_elapsed = 0;
      const execution_time = this.report_settings.execution_time || 0;
      if (execution_time < 5)
        return;
      this.interval = setInterval(function() {
        seconds_elapsed += 1;
        frappe.show_progress(__("Preparing Report"), seconds_elapsed, execution_time);
      }, 1e3);
    }
    refresh_filters_dependency() {
      this.filters.forEach((filter) => {
        filter.guardian_has_value = true;
        if (filter.df.depends_on) {
          filter.guardian_has_value = this.evaluate_depends_on_value(filter.df.depends_on, filter.df.label);
          if (filter.guardian_has_value) {
            if (filter.df.hidden_due_to_dependency) {
              filter.df.hidden_due_to_dependency = false;
              this.toggle_filter_display(filter.df.fieldname, false);
            }
          } else {
            if (!filter.df.hidden_due_to_dependency) {
              filter.df.hidden_due_to_dependency = true;
              this.toggle_filter_display(filter.df.fieldname, true);
              filter.set_value(filter.df.default || null);
            }
          }
        }
      });
    }
    evaluate_depends_on_value(expression, filter_label) {
      let out = null;
      let doc = this.get_filter_values();
      if (doc) {
        if (typeof expression === "boolean") {
          out = expression;
        } else if (expression.substr(0, 5) == "eval:") {
          try {
            out = frappe.utils.eval(expression.substr(5), { doc });
          } catch (e) {
            frappe.throw(__('Invalid "depends_on" expression set in filter {0}', [filter_label]));
          }
        } else {
          var value = doc[expression];
          if ($.isArray(value)) {
            out = !!value.length;
          } else {
            out = !!value;
          }
        }
      }
      return out;
    }
    setup_filters() {
      this.clear_filters();
      const { filters = [] } = this.report_settings;
      let filter_area = this.page.page_form;
      this.filters = filters.map((df) => {
        if (df.fieldtype === "Break")
          return;
        let f = this.page.add_field(df, filter_area);
        if (df.default) {
          f.set_input(df.default);
        }
        if (df.get_query)
          f.get_query = df.get_query;
        if (df.on_change)
          f.on_change = df.on_change;
        df.onchange = () => {
          this.refresh_filters_dependency();
          let current_filters = this.get_filter_values();
          if (this.previous_filters && JSON.stringify(this.previous_filters) === JSON.stringify(current_filters)) {
            return;
          }
          this.previous_filters = current_filters;
          setTimeout(() => this.previous_filters = null, 1e4);
          if (f.on_change) {
            f.on_change(this);
          } else {
            if (this.prepared_report) {
              this.reset_report_view();
            } else if (!this._no_refresh) {
              this.refresh();
            }
          }
        };
        f = Object.assign(f, df);
        return f;
      }).filter(Boolean);
      this.refresh_filters_dependency();
      if (this.filters.length === 0) {
        this.page.hide_form();
      } else {
        this.page.show_form();
      }
    }
    set_filters(filters) {
      this.filters.map((f) => {
        f.set_input(filters[f.fieldname]);
      });
    }
    set_route_filters(route_options) {
      if (!route_options)
        route_options = frappe.route_options;
      if (route_options) {
        const fields = Object.keys(route_options);
        const filters_to_set = this.filters.filter((f) => fields.includes(f.df.fieldname));
        const promises = filters_to_set.map((f) => {
          return () => {
            let value = route_options[f.df.fieldname];
            if (typeof value === "string" && value[0] === "[") {
              value = JSON.parse(value);
            }
            f.set_value(value);
          };
        });
        promises.push(() => {
          frappe.route_options = null;
        });
        return frappe.run_serially(promises);
      }
    }
    clear_filters() {
      this.page.clear_fields();
    }
    refresh() {
      this.toggle_message(true);
      this.toggle_report(false);
      let filters = this.get_filter_values(true);
      this.show_loading_screen();
      if (this.last_ajax) {
        this.last_ajax.abort();
      }
      const query_params = this.get_query_params();
      if (query_params.prepared_report_name) {
        filters.prepared_report_name = query_params.prepared_report_name;
      }
      return new Promise((resolve) => {
        this.last_ajax = frappe.call({
          method: "frappe.desk.query_report.run",
          type: "GET",
          args: {
            report_name: this.report_name,
            filters,
            is_tree: this.report_settings.tree,
            parent_field: this.report_settings.parent_field
          },
          callback: resolve,
          always: () => this.page.btn_secondary.prop("disabled", false)
        });
      }).then((r) => {
        let data = r.message;
        this.hide_status();
        clearInterval(this.interval);
        this.execution_time = data.execution_time || 0.1;
        if (data.prepared_report) {
          this.prepared_report = true;
          this.prepared_report_document = data.doc;
          if (query_params.prepared_report_name) {
            this.prepared_report_action = "Edit";
            const filters_from_report = JSON.parse(data.doc.filters);
            Object.values(this.filters).forEach(function(field) {
              if (filters_from_report[field.fieldname]) {
                field.set_input(filters_from_report[field.fieldname]);
              }
              if (field.input) {
                field.input.disabled = true;
              }
            });
          }
          this.add_prepared_report_buttons(data.doc);
        }
        if (data.report_summary) {
          this.$summary.empty();
          this.render_summary(data.report_summary);
        }
        if (data.message && !data.prepared_report)
          this.show_status(data.message);
        this.toggle_message(false);
        if (data.result && data.result.length) {
          this.prepare_report_data(data);
          this.chart_options = this.get_chart_options(data);
          this.$chart.empty();
          if (this.chart_options) {
            this.render_chart(this.chart_options);
          } else {
            this.$chart.empty();
            if (this.chart_fields) {
              this.chart_options = frappe.report_utils.make_chart_options(this.columns, this.raw_data, this.chart_fields);
              this.chart_options && this.render_chart(this.chart_options);
            }
          }
          this.render_datatable();
          this.add_chart_buttons_to_toolbar(true);
          this.add_card_button_to_toolbar();
          this.$report.show();
        } else {
          this.data = [];
          this.toggle_nothing_to_show(true);
          this.add_chart_buttons_to_toolbar(false);
        }
        this.show_footer_message();
        frappe.hide_progress();
      }).finally(() => {
        this.hide_loading_screen();
        this.update_url_with_filters();
      });
    }
    render_summary(data) {
      data.forEach((summary) => {
        frappe.utils.build_summary_item(summary).appendTo(this.$summary);
      });
      this.$summary.show();
    }
    get_query_params() {
      const query_string = frappe.utils.get_query_string(frappe.get_route_str());
      const query_params = frappe.utils.get_query_params(query_string);
      return query_params;
    }
    add_prepared_report_buttons(doc) {
      if (doc) {
        this.page.add_inner_button(__("Download Report"), function() {
          window.open(frappe.urllib.get_full_url("/api/method/frappe.core.doctype.prepared_report.prepared_report.download_attachment?dn=" + encodeURIComponent(doc.name)));
        });
        const part1 = __("This report was generated {0}.", [
          frappe.datetime.comment_when(doc.report_end_time)
        ]);
        const part2 = __("To get the updated report, click on {0}.", [__("Rebuild")]);
        const part3 = __("See all past reports.");
        this.show_status(`
				<div class="indicator orange">
					<span>
						${part1}
						${part2}
						<a href="/app/List/Prepared%20Report?report_name=${this.report_name}"> ${part3}</a>
					</span>
				</div>
			`);
      }
      this.primary_action_map = {
        New: {
          label: __("Generate New Report"),
          click: () => {
            this.show_warning_or_generate_report();
          }
        },
        Edit: {
          label: __("Edit"),
          click: () => {
            frappe.set_route(frappe.get_route());
          }
        },
        Rebuild: {
          label: __("Rebuild"),
          click: () => {
            this.show_warning_or_generate_report();
          }
        }
      };
      let primary_action = this.primary_action_map[this.prepared_report_action];
      if (!this.primary_button || this.primary_button.text() !== primary_action.label) {
        this.primary_button = this.page.set_primary_action(primary_action.label, primary_action.click);
      }
    }
    toggle_primary_button_disabled(disable) {
      this.primary_button.prop("disabled", disable);
    }
    show_warning_or_generate_report() {
      frappe.xcall("frappe.core.doctype.prepared_report.prepared_report.get_reports_in_queued_state", {
        filters: this.get_filter_values(),
        report_name: this.report_name
      }).then((reports) => {
        this.queued_prepared_reports = reports;
        if (reports.length) {
          const message = this.get_queued_prepared_reports_warning_message(reports);
          this.prepared_report_dialog = frappe.warn(__("Reports already in Queue"), message, () => this.generate_background_report(), __("Proceed Anyway"), true);
          this.prepared_report_dialog.footer.prepend(`
					<button type="button" class="btn btn-sm btn-default pull-left" data-action="delete_old_queued_reports">
						${__("Delete and Generate New")}
					</button>`);
          frappe.utils.bind_actions_with_object(this.prepared_report_dialog.wrapper, this);
        } else {
          this.generate_background_report();
        }
      });
    }
    get_queued_prepared_reports_warning_message(reports) {
      const route = `/app/List/Prepared Report/List?status=Queued&report_name=${this.report_name}`;
      const report_link_html = reports.length == 1 ? `<a class="underline" href="${route}">${__("1 Report")}</a>` : `<a class="underline" href="${route}">${__("{0} Reports", [
        reports.length
      ])}</a>`;
      const no_of_reports_html = reports.length == 1 ? `${__("There is {0} with the same filters already in the queue:", [
        report_link_html
      ])}` : `${__("There are {0} with the same filters already in the queue:", [
        report_link_html
      ])}`;
      let warning_message = `
			<p>
				${__("Are you sure you want to generate a new report?")}
				${no_of_reports_html}
			</p>`;
      let get_item_html = (item) => `<a class="underline" href="/app/prepared-report/${item.name}">${item.name}</a>`;
      warning_message += reports.map(get_item_html).join(", ");
      return warning_message;
    }
    delete_old_queued_reports() {
      this.prepared_report_dialog.hide();
      frappe.xcall("frappe.core.doctype.prepared_report.prepared_report.delete_prepared_reports", {
        reports: this.queued_prepared_reports
      }).then(() => this.generate_background_report());
    }
    generate_background_report() {
      this.toggle_primary_button_disabled(true);
      let mandatory = this.filters.filter((f) => f.df.reqd);
      let missing_mandatory = mandatory.filter((f) => !f.get_value());
      if (!missing_mandatory.length) {
        let filters = this.get_filter_values(true);
        return new Promise((resolve) => frappe.call({
          method: "frappe.desk.query_report.background_enqueue_run",
          type: "GET",
          args: {
            report_name: this.report_name,
            filters
          },
          callback: resolve
        })).then((r) => {
          const data = r.message;
          this.prepared_report_doc_name = data.name;
          let alert_message = `<a href='/app/prepared-report/${data.name}'>` + __("Report initiated, click to view status") + `</a>`;
          frappe.show_alert({ message: alert_message, indicator: "orange" }, 10);
          this.toggle_nothing_to_show(true);
        });
      }
    }
    prepare_report_data(data) {
      this.raw_data = data;
      this.columns = this.prepare_columns(data.columns);
      this.custom_columns = [];
      this.data = this.prepare_data(data.result);
      this.linked_doctypes = this.get_linked_doctypes();
      this.tree_report = this.data.some((d) => "indent" in d);
    }
    render_datatable() {
      let data = this.data;
      let columns = this.columns.filter((col) => !col.hidden);
      if (this.raw_data.add_total_row && !this.report_settings.tree) {
        data = data.slice();
        data.splice(-1, 1);
      }
      this.$report.show();
      if (this.datatable && this.datatable.options && this.datatable.options.showTotalRow === this.raw_data.add_total_row) {
        this.datatable.options.treeView = this.tree_report;
        this.datatable.refresh(data, columns);
      } else {
        let datatable_options = {
          columns,
          data,
          inlineFilters: true,
          language: frappe.boot.lang,
          translations: frappe.utils.datatable.get_translations(),
          treeView: this.tree_report,
          layout: "fixed",
          cellHeight: 33,
          showTotalRow: this.raw_data.add_total_row && !this.report_settings.tree,
          direction: frappe.utils.is_rtl() ? "rtl" : "ltr",
          hooks: {
            columnTotal: frappe.utils.report_column_total
          }
        };
        if (this.report_settings.get_datatable_options) {
          datatable_options = this.report_settings.get_datatable_options(datatable_options);
        }
        this.datatable = new import_frappe_datatable.default(this.$report[0], datatable_options);
      }
      if (typeof this.report_settings.initial_depth == "number") {
        this.datatable.rowmanager.setTreeDepth(this.report_settings.initial_depth);
      }
      if (this.report_settings.after_datatable_render) {
        this.report_settings.after_datatable_render(this.datatable);
      }
    }
    show_loading_screen() {
      const loading_state = `<div class="msg-box no-border">
			<div>
				<img src="/assets/frappe/images/ui-states/list-empty-state.svg" alt="Generic Empty State" class="null-state">
			</div>
			<p>${__("Loading")}...</p>
		</div>`;
      this.$loading.find("div").html(loading_state);
      this.$report.hide();
      this.$loading.show();
    }
    hide_loading_screen() {
      this.$loading.hide();
    }
    get_chart_options(data) {
      let options = this.report_settings.get_chart_data ? this.report_settings.get_chart_data(data.columns, data.result) : data.chart ? data.chart : void 0;
      if (!(options && options.data && options.data.labels && options.data.labels.length > 0))
        return;
      if (options.fieldtype) {
        options.tooltipOptions = {
          formatTooltipY: (d) => frappe.format(d, {
            fieldtype: options.fieldtype,
            options: options.options
          })
        };
      }
      options.axisOptions = {
        shortenYAxisNumbers: 1,
        numberFormatter: frappe.utils.format_chart_axis_number
      };
      options.height = 280;
      return options;
    }
    render_chart(options) {
      this.$chart.empty();
      this.$chart.show();
      this.chart = new frappe.Chart(this.$chart[0], options);
    }
    open_create_chart_dialog() {
      const me = this;
      let field_options = frappe.report_utils.get_field_options_from_report(this.columns, this.raw_data);
      function set_chart_values(values) {
        values.y_fields = [];
        values.colors = [];
        if (values.y_axis_fields) {
          values.y_axis_fields.map((f) => {
            values.y_fields.push(f.y_field);
            values.colors.push(f.color);
          });
        }
        values.y_fields = values.y_fields.map((d) => d.trim()).filter(Boolean);
        return values;
      }
      function preview_chart() {
        const wrapper = $(dialog2.fields_dict["chart_preview"].wrapper);
        let values = dialog2.get_values(true);
        values = set_chart_values(values);
        if (values.x_field && values.y_fields.length) {
          let options = frappe.report_utils.make_chart_options(me.columns, me.raw_data, values);
          me.chart_fields = values;
          wrapper.empty();
          new frappe.Chart(wrapper[0], options);
          wrapper.find(".chart-container .title, .chart-container .sub-title").hide();
          wrapper.show();
          dialog2.fields_dict["create_dashoard_chart"].df.hidden = 0;
          dialog2.refresh();
        } else {
          wrapper[0].innerHTML = `<div class="flex justify-center align-center text-muted" style="height: 120px; display: flex;">
					<div>${__("Please select X and Y fields")}</div>
				</div>`;
        }
      }
      const dialog2 = new frappe.ui.Dialog({
        title: __("Create Chart"),
        fields: [
          {
            fieldname: "x_field",
            label: "X Field",
            fieldtype: "Select",
            default: me.chart_fields ? me.chart_fields.x_field : null,
            options: field_options.non_numeric_fields
          },
          {
            fieldname: "cb_1",
            fieldtype: "Column Break"
          },
          {
            fieldname: "chart_type",
            label: "Type of Chart",
            fieldtype: "Select",
            options: ["Bar", "Line", "Percentage", "Pie", "Donut"],
            default: me.chart_fields ? me.chart_fields.chart_type : "Bar"
          },
          {
            fieldname: "sb_1",
            fieldtype: "Section Break",
            label: "Y Axis"
          },
          {
            fieldname: "y_axis_fields",
            fieldtype: "Table",
            fields: [
              {
                fieldtype: "Select",
                fieldname: "y_field",
                name: "y_field",
                label: __("Y Field"),
                options: field_options.numeric_fields,
                in_list_view: 1
              },
              {
                fieldtype: "Color",
                fieldname: "color",
                name: "color",
                label: __("Color"),
                in_list_view: 1
              }
            ]
          },
          {
            fieldname: "preview_chart_button",
            fieldtype: "Button",
            label: "Preview Chart",
            click: preview_chart
          },
          {
            fieldname: "sb_2",
            fieldtype: "Section Break",
            label: "Chart Preview"
          },
          {
            fieldname: "chart_preview",
            label: "Chart Preview",
            fieldtype: "HTML"
          },
          {
            fieldname: "create_dashoard_chart",
            label: "Add Chart to Dashboard",
            fieldtype: "Button",
            hidden: 1,
            click: () => {
              dialog2.hide();
              this.add_chart_to_dashboard();
            }
          }
        ],
        primary_action_label: __("Create"),
        primary_action: (values) => {
          values = set_chart_values(values);
          let options = frappe.report_utils.make_chart_options(this.columns, this.raw_data, values);
          me.chart_fields = values;
          let x_field_label = field_options.numeric_fields.filter((field) => field.value == values.y_fields[0])[0].label;
          let y_field_label = field_options.non_numeric_fields.filter((field) => field.value == values.x_field)[0].label;
          options.title = __("{0}: {1} vs {2}", [
            this.report_name,
            x_field_label,
            y_field_label
          ]);
          this.render_chart(options);
          this.add_chart_buttons_to_toolbar(true);
          dialog2.hide();
        }
      });
      dialog2.show();
      setTimeout(preview_chart, 500);
    }
    prepare_columns(columns) {
      return columns.map((column) => {
        column = frappe.report_utils.prepare_field_from_column(column);
        const format_cell = (value, row, column2, data) => {
          if (column2.isHeader && !data && this.data) {
            let index = 1;
            if (this.report_settings.get_datatable_options) {
              let datatable = this.report_settings.get_datatable_options({});
              if (datatable && datatable.checkboxColumn)
                index = 2;
            }
            if (column2.colIndex === index && !value) {
              value = "Total";
              column2 = { fieldtype: "Data" };
            } else if (in_list(["Currency", "Float"], column2.fieldtype)) {
              data = this.data[0];
            }
          }
          return frappe.format(value, column2, { for_print: false, always_show_decimals: true }, data);
        };
        let compareFn = null;
        if (column.fieldtype === "Date") {
          compareFn = (cell, keyword) => {
            if (!cell.content)
              return null;
            if (keyword.length !== "YYYY-MM-DD".length)
              return null;
            const keywordValue = frappe.datetime.user_to_obj(keyword);
            const cellValue = frappe.datetime.str_to_obj(cell.content);
            return [+cellValue, +keywordValue];
          };
        }
        return Object.assign(column, {
          id: column.fieldname,
          name: __(column.label, null, `Column of report '${this.report_name}'`),
          width: parseInt(column.width) || null,
          editable: false,
          compareValue: compareFn,
          format: (value, row, column2, data) => {
            if (this.report_settings.formatter) {
              return this.report_settings.formatter(value, row, column2, data, format_cell);
            }
            return format_cell(value, row, column2, data);
          }
        });
      });
    }
    prepare_data(data) {
      return data.map((row) => {
        let row_obj = {};
        if (Array.isArray(row)) {
          this.columns.forEach((column, i) => {
            row_obj[column.id] = row[i];
          });
          return row_obj;
        }
        return row;
      });
    }
    get_visible_columns() {
      const visible_column_ids = this.datatable.datamanager.getColumns(true).map((col) => col.id);
      return visible_column_ids.map((id) => this.columns.find((col) => col.id === id)).filter(Boolean);
    }
    get_filter_values(raise) {
      const mandatory = this.filters.filter((f) => f.df.reqd || f.df.mandatory);
      let missing_mandatory = mandatory.filter((f) => !f.get_value());
      console.log(mandatory);
      missing_mandatory = mandatory.filter((f) => console.log(f.get_value()));
      if (raise && missing_mandatory.length > 0) {
        let message = __("Please set filters");
        this.hide_loading_screen();
        this.toggle_message(raise, message);
        throw "Filter missing";
      }
      raise && this.toggle_message(false);
      const filters = this.filters.filter((f) => f.get_value()).map((f) => {
        var v = f.get_value();
        if (f.df.hidden)
          v = f.value;
        if (v === "%")
          v = null;
        if (f.df.wildcard_filter) {
          v = `%${v}%`;
        }
        return {
          [f.df.fieldname]: v
        };
      }).reduce((acc, f) => {
        Object.assign(acc, f);
        return acc;
      }, {});
      return filters;
    }
    get_filter(fieldname) {
      const field = (this.filters || []).find((f) => f.df.fieldname === fieldname);
      if (!field) {
        console.warn(`[Query Report] Invalid filter: ${fieldname}`);
      }
      return field;
    }
    get_filter_value(fieldname) {
      const field = this.get_filter(fieldname);
      return field ? field.get_value() : null;
    }
    set_filter_value(fieldname, value) {
      let field_value_map = {};
      if (typeof fieldname === "string") {
        field_value_map[fieldname] = value;
      } else {
        field_value_map = fieldname;
      }
      this._no_refresh = true;
      Object.keys(field_value_map).forEach((fieldname2, i, arr) => {
        const value2 = field_value_map[fieldname2];
        if (i === arr.length - 1) {
          this._no_refresh = false;
        }
        this.get_filter(fieldname2).set_value(value2);
      });
    }
    set_breadcrumbs() {
      if (!this.report_doc || !this.report_doc.ref_doctype)
        return;
      const ref_doctype = frappe.get_meta(this.report_doc.ref_doctype);
      frappe.breadcrumbs.add(ref_doctype.module);
    }
    make_access_log(method, file_format) {
      frappe.call("frappe.core.doctype.access_log.access_log.make_access_log", {
        doctype: this.doctype || "",
        report_name: this.report_name,
        filters: this.get_filter_values(),
        file_type: file_format,
        method
      });
    }
    print_report(print_settings) {
      const custom_format = this.report_settings.html_format || null;
      const filters_html = this.get_filters_html_for_print();
      const landscape = print_settings.orientation == "Landscape";
      this.make_access_log("Print", "PDF");
      frappe.render_grid({
        template: print_settings.columns ? "print_grid" : custom_format,
        title: __(this.report_name),
        subtitle: filters_html,
        print_settings,
        landscape,
        filters: this.get_filter_values(),
        data: this.get_data_for_print(),
        columns: this.get_columns_for_print(print_settings, custom_format),
        original_data: this.data,
        report: this
      });
    }
    pdf_report(print_settings) {
      const base_url = frappe.urllib.get_base_url();
      const print_css = frappe.boot.print_css;
      const landscape = print_settings.orientation == "Landscape";
      const custom_format = this.report_settings.html_format || null;
      const columns = this.get_columns_for_print(print_settings, custom_format);
      const data = this.get_data_for_print();
      const applied_filters = this.get_filter_values();
      const filters_html = this.get_filters_html_for_print();
      const template = print_settings.columns || !custom_format ? "print_grid" : custom_format;
      const content = frappe.render_template(template, {
        title: __(this.report_name),
        subtitle: filters_html,
        filters: applied_filters,
        data,
        original_data: this.data,
        columns,
        report: this
      });
      const html = frappe.render_template("print_template", {
        title: __(this.report_name),
        content,
        base_url,
        print_css,
        print_settings,
        landscape,
        columns,
        lang: frappe.boot.lang,
        layout_direction: frappe.utils.is_rtl() ? "rtl" : "ltr"
      });
      let filter_values = [], name_len = 0;
      for (var key of Object.keys(applied_filters)) {
        name_len = name_len + applied_filters[key].toString().length;
        if (name_len > 200)
          break;
        filter_values.push(applied_filters[key]);
      }
      print_settings.report_name = `${__(this.report_name)}_${filter_values.join("_")}.pdf`;
      frappe.render_pdf(html, print_settings);
    }
    get_filters_html_for_print() {
      const applied_filters = this.get_filter_values();
      return Object.keys(applied_filters).map((fieldname) => {
        const label = frappe.query_report.get_filter(fieldname).df.label;
        const value = applied_filters[fieldname];
        return `<h6>${__(label)}: ${value}</h6>`;
      }).join("");
    }
    export_report() {
      if (this.export_dialog) {
        this.export_dialog.clear();
        this.export_dialog.show();
        return;
      }
      let export_dialog_fields = [
        {
          label: __("Select File Format"),
          fieldname: "file_format",
          fieldtype: "Select",
          options: ["Excel", "CSV"],
          default: "Excel",
          reqd: 1
        }
      ];
      if (this.tree_report) {
        export_dialog_fields.push({
          label: __("Include indentation"),
          fieldname: "include_indentation",
          fieldtype: "Check"
        });
      }
      this.export_dialog = frappe.prompt(export_dialog_fields, ({ file_format, include_indentation }) => {
        this.make_access_log("Export", file_format);
        if (file_format === "CSV") {
          const column_row = this.columns.reduce((acc, col) => {
            if (!col.hidden) {
              acc.push(__(col.label));
            }
            return acc;
          }, []);
          const data = this.get_data_for_csv(include_indentation);
          const out = [column_row].concat(data);
          frappe.tools.downloadify(out, null, this.report_name);
        } else {
          let filters = this.get_filter_values(true);
          if (frappe.urllib.get_dict("prepared_report_name")) {
            filters = Object.assign(frappe.urllib.get_dict("prepared_report_name"), filters);
          }
          const visible_idx = this.datatable.bodyRenderer.visibleRowIndices;
          if (visible_idx.length + 1 === this.data.length) {
            visible_idx.push(visible_idx.length);
          }
          const args = {
            cmd: "frappe.desk.query_report.export_query",
            report_name: this.report_name,
            custom_columns: this.custom_columns.length ? this.custom_columns : [],
            file_format_type: file_format,
            filters,
            visible_idx,
            include_indentation
          };
          open_url_post(frappe.request.url, args);
        }
      }, __("Export Report: {0}", [this.report_name]), __("Download"));
    }
    get_data_for_csv(include_indentation) {
      const rows = this.datatable.bodyRenderer.visibleRows;
      if (this.raw_data.add_total_row) {
        rows.push(this.datatable.bodyRenderer.getTotalRow());
      }
      return rows.map((row) => {
        const standard_column_count = this.datatable.datamanager.getStandardColumnCount();
        return row.slice(standard_column_count).map((cell, i) => {
          if (cell.column.fieldtype === "Duration") {
            cell.content = frappe.utils.get_formatted_duration(cell.content);
          }
          if (include_indentation && i === 0) {
            cell.content = "   ".repeat(row.meta.indent) + (cell.content || "");
          }
          return cell.content || "";
        });
      });
    }
    get_data_for_print() {
      if (!this.data.length) {
        return [];
      }
      const rows = this.datatable.datamanager.rowViewOrder.map((index) => {
        if (this.datatable.bodyRenderer.visibleRowIndices.includes(index)) {
          return this.data[index];
        }
      }).filter(Boolean);
      if (this.raw_data.add_total_row) {
        let totalRow = this.datatable.bodyRenderer.getTotalRow().reduce((row, cell) => {
          row[cell.column.id] = cell.content;
          row.is_total_row = true;
          return row;
        }, {});
        rows.push(totalRow);
      }
      return rows;
    }
    get_columns_for_print(print_settings, custom_format) {
      let columns = [];
      if (print_settings && print_settings.columns) {
        columns = this.get_visible_columns().filter((column) => print_settings.columns.includes(column.fieldname));
      } else {
        columns = custom_format ? this.columns : this.get_visible_columns();
      }
      return columns;
    }
    get_menu_items() {
      let items = [
        {
          label: __("Refresh"),
          action: () => this.refresh(),
          class: "visible-xs"
        },
        {
          label: __("Edit"),
          action: () => frappe.set_route("Form", "Report", this.report_name),
          condition: () => frappe.user.is_report_manager(),
          standard: true
        },
        {
          label: __("Print"),
          action: () => {
            let dialog2 = frappe.ui.get_print_settings(false, (print_settings) => this.print_report(print_settings), this.report_doc.letter_head, this.get_visible_columns());
            this.add_portrait_warning(dialog2);
          },
          condition: () => frappe.model.can_print(this.report_doc.ref_doctype),
          standard: true
        },
        {
          label: __("PDF"),
          action: () => {
            let dialog2 = frappe.ui.get_print_settings(false, (print_settings) => this.pdf_report(print_settings), this.report_doc.letter_head, this.get_visible_columns());
            this.add_portrait_warning(dialog2);
          },
          condition: () => frappe.model.can_print(this.report_doc.ref_doctype),
          standard: true
        },
        {
          label: __("Export"),
          action: () => this.export_report(),
          condition: () => frappe.model.can_export(this.report_doc.ref_doctype),
          standard: true
        },
        {
          label: __("Setup Auto Email"),
          action: () => frappe.set_route("List", "Auto Email Report", { report: this.report_name }),
          standard: true
        },
        {
          label: __("Add Column"),
          action: () => {
            let d = new frappe.ui.Dialog({
              title: __("Add Column"),
              fields: [
                {
                  fieldtype: "Select",
                  fieldname: "doctype",
                  label: __("From Document Type"),
                  options: this.linked_doctypes.map((df) => ({
                    label: df.doctype,
                    value: df.doctype
                  })),
                  change: () => {
                    let doctype = d.get_value("doctype");
                    frappe.model.with_doctype(doctype, () => {
                      let options = frappe.meta.get_docfields(doctype).filter(frappe.model.is_value_type).map((df) => ({
                        label: df.label,
                        value: df.fieldname
                      }));
                      d.set_df_property("field", "options", options.sort(function(a, b) {
                        if (a.label < b.label) {
                          return -1;
                        }
                        if (a.label > b.label) {
                          return 1;
                        }
                        return 0;
                      }));
                    });
                  }
                },
                {
                  fieldtype: "Select",
                  label: __("Field"),
                  fieldname: "field",
                  options: []
                },
                {
                  fieldtype: "Select",
                  label: __("Insert After"),
                  fieldname: "insert_after",
                  options: this.columns.map((df) => df.label)
                }
              ],
              primary_action: (values) => {
                const custom_columns = [];
                let df = frappe.meta.get_docfield(values.doctype, values.field);
                const insert_after_index = this.columns.findIndex((column) => column.label === values.insert_after);
                custom_columns.push({
                  fieldname: df.fieldname,
                  fieldtype: df.fieldtype,
                  label: df.label,
                  insert_after_index,
                  link_field: this.doctype_field_map[values.doctype],
                  doctype: values.doctype,
                  options: df.options,
                  width: 100
                });
                this.custom_columns = this.custom_columns.concat(custom_columns);
                frappe.call({
                  method: "frappe.desk.query_report.get_data_for_custom_field",
                  args: {
                    field: values.field,
                    doctype: values.doctype
                  },
                  callback: (r) => {
                    const custom_data = r.message;
                    const link_field = this.doctype_field_map[values.doctype];
                    this.add_custom_column(custom_columns, custom_data, link_field, values.field, insert_after_index);
                    d.hide();
                  }
                });
                this.set_menu_items();
              }
            });
            d.show();
          },
          standard: true
        },
        {
          label: __("User Permissions"),
          action: () => frappe.set_route("List", "User Permission", {
            doctype: "Report",
            name: this.report_name
          }),
          condition: () => frappe.model.can_set_user_permissions("Report"),
          standard: true
        }
      ];
      if (frappe.user.is_report_manager()) {
        items.push({
          label: __("Save"),
          action: () => {
            let d = new frappe.ui.Dialog({
              title: __("Save Report"),
              fields: [
                {
                  fieldtype: "Data",
                  fieldname: "report_name",
                  label: __("Report Name"),
                  default: this.report_doc.is_standard == "No" ? this.report_name : "",
                  reqd: true
                }
              ],
              primary_action: (values) => {
                frappe.call({
                  method: "frappe.desk.query_report.save_report",
                  args: {
                    reference_report: this.report_name,
                    report_name: values.report_name,
                    columns: this.get_visible_columns()
                  },
                  callback: function(r) {
                    this.show_save = false;
                    d.hide();
                    frappe.set_route("query-report", r.message);
                  }
                });
              }
            });
            d.show();
          },
          standard: true
        });
      }
      return items;
    }
    add_portrait_warning(dialog2) {
      if (this.columns.length > 10) {
        dialog2.set_df_property("orientation", "change", () => {
          let value = dialog2.get_value("orientation");
          let description = value === "Portrait" ? __("Report with more than 10 columns looks better in Landscape mode.") : "";
          dialog2.set_df_property("orientation", "description", description);
        });
      }
    }
    add_custom_column(custom_column, custom_data, link_field, column_field, insert_after_index) {
      const column = this.prepare_columns(custom_column);
      this.columns.splice(insert_after_index + 1, 0, column[0]);
      this.data.forEach((row) => {
        row[column_field] = custom_data[row[link_field]];
      });
      this.render_datatable();
    }
    get_linked_doctypes() {
      let doctypes = [];
      let dynamic_links = [];
      let dynamic_doctypes = /* @__PURE__ */ new Set();
      this.doctype_field_map = {};
      this.columns.forEach((df) => {
        if (df.fieldtype == "Link" && df.options && df.options != "Currency") {
          doctypes.push({
            doctype: df.options,
            fieldname: df.fieldname
          });
        } else if (df.fieldtype == "Dynamic Link" && df.options) {
          dynamic_links.push({
            link_name: df.options,
            fieldname: df.fieldname
          });
        }
      });
      this.data.forEach((row) => {
        dynamic_links.forEach((field) => {
          if (row[field.link_name]) {
            dynamic_doctypes.add(row[field.link_name] + ":" + field.fieldname);
          }
        });
      });
      doctypes = doctypes.concat(Array.from(dynamic_doctypes).map((d) => {
        const doc_field_pair = d.split(":");
        return {
          doctype: doc_field_pair[0],
          fieldname: doc_field_pair[1]
        };
      }));
      doctypes.forEach((doc) => {
        this.doctype_field_map[doc.doctype] = doc.fieldname;
      });
      return doctypes;
    }
    setup_report_wrapper() {
      if (this.$report)
        return;
      $(".page-head-content").removeClass("border-bottom");
      let page_form = this.page.main.find(".page-form");
      this.$status = $(`<div class="form-message text-muted small"></div>`).hide().insertAfter(page_form);
      this.$summary = $(`<div class="report-summary"></div>`).hide().appendTo(this.page.main);
      this.$chart = $('<div class="chart-wrapper">').hide().appendTo(this.page.main);
      this.$loading = $(this.message_div("")).hide().appendTo(this.page.main);
      this.$report = $('<div class="report-wrapper">').appendTo(this.page.main);
      this.$message = $(this.message_div("")).hide().appendTo(this.page.main);
    }
    show_status(status_message) {
      this.$status.html(status_message).show();
    }
    hide_status() {
      this.$status.hide();
    }
    show_footer_message() {
      this.$report_footer && this.$report_footer.remove();
      this.$report_footer = $(`<div class="report-footer text-muted"></div>`).appendTo(this.page.main);
      if (this.tree_report) {
        this.$tree_footer = $(`<div class="tree-footer col-md-6">
				<button class="btn btn-xs btn-default" data-action="expand_all_rows">
					${__("Expand All")}</button>
				<button class="btn btn-xs btn-default" data-action="collapse_all_rows">
					${__("Collapse All")}</button>
			</div>`);
        $(this.$report_footer).append(this.$tree_footer);
        this.$tree_footer.find("[data-action=collapse_all_rows]").show();
        this.$tree_footer.find("[data-action=expand_all_rows]").hide();
      }
      const message = __("For comparison, use >5, <10 or =324. For ranges, use 5:10 (for values between 5 & 10).");
      const execution_time_msg = __("Execution Time: {0} sec", [this.execution_time || 0.1]);
      this.$report_footer.append(`<div class="col-md-12">
			<span">${message}</span><span class="pull-right">${execution_time_msg}</span>
		</div>`);
    }
    expand_all_rows() {
      this.$tree_footer.find("[data-action=expand_all_rows]").hide();
      this.datatable.rowmanager.expandAllNodes();
      this.$tree_footer.find("[data-action=collapse_all_rows]").show();
    }
    collapse_all_rows() {
      this.$tree_footer.find("[data-action=collapse_all_rows]").hide();
      this.datatable.rowmanager.collapseAllNodes();
      this.$tree_footer.find("[data-action=expand_all_rows]").show();
    }
    message_div(message) {
      return `<div class='flex justify-center align-center text-muted' style='height: 50vh;'>
			<div>${message}</div>
		</div>`;
    }
    reset_report_view() {
      this.hide_status();
      this.toggle_nothing_to_show(true);
      this.refresh();
    }
    toggle_nothing_to_show(flag) {
      let message = this.prepared_report && !this.prepared_report_document ? __("This is a background report. Please set the appropriate filters and then generate a new one.") : this.get_no_result_message();
      this.toggle_message(flag, message);
      if (flag && this.prepared_report) {
        this.prepared_report_action = "New";
        if (!this.primary_button.is(":visible")) {
          this.add_prepared_report_buttons();
        }
      }
    }
    toggle_message(flag, message) {
      if (flag) {
        this.$message.find("div").html(message);
        this.$message.show();
      } else {
        this.$message.hide();
      }
    }
    toggle_filter_display(fieldname, flag) {
      this.$page.find(`div[data-fieldname=${fieldname}]`).toggleClass("hide-control", flag);
    }
    toggle_report(flag) {
      this.$report.toggle(flag);
      this.$chart.toggle(flag);
      this.$summary.toggle(flag);
    }
    get_checked_items(only_docnames) {
      const indexes = this.datatable.rowmanager.getCheckedRows();
      return indexes.reduce((items, i) => {
        if (i === void 0)
          return items;
        const item = this.data[i];
        items.push(only_docnames ? item.name : item);
        return items;
      }, []);
    }
    get get_values() {
      return this.get_filter_values;
    }
  };

  // ../engr/engr/public/js/employee_analytics.js
  frappe.query_reports["Employee Analytics"] = {
    "filters": [
      {
        "fieldname": "company",
        "label": __("Company"),
        "fieldtype": "Link",
        "options": "Company",
        "default": frappe.defaults.get_user_default("Company"),
        "reqd": 1
      },
      {
        "fieldname": "parameter",
        "label": __("Parameter"),
        "fieldtype": "Select",
        "options": ["Branch", "Grade", "Department", "Designation", "Employment Type"],
        "default": "Branch",
        "reqd": 1
      }
    ]
  };

  // ../engr/engr/public/js/utils.js
  frappe.provide("erpnext");
  frappe.provide("erpnext.utils");
  $.extend(erpnext, {
    get_currency: function(company) {
      if (!company && cur_frm)
        company = cur_frm.doc.company;
      if (company)
        return frappe.get_doc(":Company", company).default_currency || frappe.boot.sysdefaults.currency;
      else
        return frappe.boot.sysdefaults.currency;
    },
    get_presentation_currency_list: () => {
      const docs = frappe.boot.docs;
      let currency_list = docs.filter((d) => d.doctype === ":Currency").map((d) => d.name);
      currency_list.unshift("");
      return currency_list;
    },
    toggle_naming_series: function() {
      if (cur_frm.fields_dict.naming_series) {
        cur_frm.toggle_display("naming_series", cur_frm.doc.__islocal ? true : false);
      }
    },
    hide_company: function() {
      if (cur_frm.fields_dict.company) {
        var companies = Object.keys(locals[":Company"] || {});
        if (companies.length === 1) {
          if (!cur_frm.doc.company)
            cur_frm.set_value("company", companies[0]);
          cur_frm.toggle_display("company", false);
        } else if (erpnext.last_selected_company) {
          if (!cur_frm.doc.company)
            cur_frm.set_value("company", erpnext.last_selected_company);
        }
      }
    },
    is_perpetual_inventory_enabled: function(company) {
      if (company) {
        return frappe.get_doc(":Company", company).enable_perpetual_inventory;
      }
    },
    stale_rate_allowed: () => {
      return cint(frappe.boot.sysdefaults.allow_stale);
    },
    setup_serial_or_batch_no: function() {
      let grid_row = cur_frm.open_grid_row();
      if (!grid_row || !grid_row.grid_form.fields_dict.serial_no || grid_row.grid_form.fields_dict.serial_no.get_status() !== "Write")
        return;
      frappe.model.get_value("Item", { "name": grid_row.doc.item_code }, ["has_serial_no", "has_batch_no"], ({ has_serial_no, has_batch_no }) => {
        Object.assign(grid_row.doc, { has_serial_no, has_batch_no });
        if (has_serial_no) {
          attach_selector_button(__("Add Serial No"), grid_row.grid_form.fields_dict.serial_no.$wrapper, this, grid_row);
        } else if (has_batch_no) {
          attach_selector_button(__("Pick Batch No"), grid_row.grid_form.fields_dict.batch_no.$wrapper, this, grid_row);
        }
      });
    },
    route_to_adjustment_jv: (args) => {
      frappe.model.with_doctype("Journal Entry", () => {
        let journal_entry = frappe.model.get_new_doc("Journal Entry");
        args.accounts.forEach((je_account) => {
          let child_row = frappe.model.add_child(journal_entry, "accounts");
          child_row.account = je_account.account;
          child_row.debit_in_account_currency = je_account.debit_in_account_currency;
          child_row.credit_in_account_currency = je_account.credit_in_account_currency;
          child_row.party_type = "";
        });
        frappe.set_route("Form", "Journal Entry", journal_entry.name);
      });
    },
    route_to_pending_reposts: (args) => {
      frappe.set_route("List", "Repost Item Valuation", args);
    }
  });
  $.extend(erpnext.utils, {
    set_party_dashboard_indicators: function(frm) {
      if (frm.doc.__onload && frm.doc.__onload.dashboard_info) {
        var company_wise_info = frm.doc.__onload.dashboard_info;
        if (company_wise_info.length > 1) {
          company_wise_info.forEach(function(info) {
            erpnext.utils.add_indicator_for_multicompany(frm, info);
          });
        } else if (company_wise_info.length === 1) {
          frm.dashboard.add_indicator(__("Annual Billing: {0}", [format_currency(company_wise_info[0].billing_this_year, company_wise_info[0].currency)]), "blue");
          frm.dashboard.add_indicator(__("Total Unpaid: {0}", [format_currency(company_wise_info[0].total_unpaid, company_wise_info[0].currency)]), company_wise_info[0].total_unpaid ? "orange" : "green");
          if (company_wise_info[0].loyalty_points) {
            frm.dashboard.add_indicator(__("Loyalty Points: {0}", [company_wise_info[0].loyalty_points]), "blue");
          }
        }
      }
    },
    add_indicator_for_multicompany: function(frm, info) {
      frm.dashboard.stats_area.show();
      frm.dashboard.stats_area_row.addClass("flex");
      frm.dashboard.stats_area_row.css("flex-wrap", "wrap");
      var color = info.total_unpaid ? "orange" : "green";
      var indicator = $('<div class="flex-column col-xs-6"><div style="margin-top:10px"><h6>' + info.company + '</h6></div><div class="badge-link small" style="margin-bottom:10px"><span class="indicator blue">Annual Billing: ' + format_currency(info.billing_this_year, info.currency) + '</span></div><div class="badge-link small" style="margin-bottom:10px"><span class="indicator ' + color + '">Total Unpaid: ' + format_currency(info.total_unpaid, info.currency) + "</span></div></div>").appendTo(frm.dashboard.stats_area_row);
      if (info.loyalty_points) {
        $('<div class="badge-link small" style="margin-bottom:10px"><span class="indicator blue">Loyalty Points: ' + info.loyalty_points + "</span></div>").appendTo(indicator);
      }
      return indicator;
    },
    get_party_name: function(party_type) {
      var dict = {
        "Customer": "customer_name",
        "Supplier": "supplier_name",
        "Employee": "employee_name",
        "Member": "member_name"
      };
      return dict[party_type];
    },
    copy_value_in_all_rows: function(doc, dt, dn, table_fieldname, fieldname) {
      var d = locals[dt][dn];
      if (d[fieldname]) {
        var cl = doc[table_fieldname] || [];
        for (var i = 0; i < cl.length; i++) {
          if (!cl[i][fieldname])
            cl[i][fieldname] = d[fieldname];
        }
      }
      refresh_field(table_fieldname);
    },
    get_terms: function(tc_name, doc, callback) {
      if (tc_name) {
        return frappe.call({
          method: "erpnext.setup.doctype.terms_and_conditions.terms_and_conditions.get_terms_and_conditions",
          args: {
            template_name: tc_name,
            doc
          },
          callback: function(r) {
            callback(r);
          }
        });
      }
    },
    make_bank_account: function(doctype, docname) {
      frappe.call({
        method: "erpnext.accounts.doctype.bank_account.bank_account.make_bank_account",
        args: {
          doctype,
          docname
        },
        freeze: true,
        callback: function(r) {
          var doclist = frappe.model.sync(r.message);
          frappe.set_route("Form", doclist[0].doctype, doclist[0].name);
        }
      });
    },
    add_dimensions: function(report_name, index) {
      let filters = frappe.query_reports[report_name].filters;
      frappe.call({
        method: "erpnext.accounts.doctype.accounting_dimension.accounting_dimension.get_dimensions",
        callback: function(r) {
          let accounting_dimensions = r.message[0];
          accounting_dimensions.forEach((dimension) => {
            let found = filters.some((el) => el.fieldname === dimension["fieldname"]);
            if (!found) {
              console.log("Called");
              filters.splice(index, 0, {
                "fieldname": dimension["fieldname"],
                "label": __(dimension["label"]),
                "fieldtype": "MultiSelectList",
                get_data: function(txt) {
                  return frappe.db.get_link_options(dimension["document_type"], txt);
                },
                "reqd": 1
              });
            }
          });
        }
      });
    },
    add_inventory_dimensions: function(report_name, index) {
      let filters = frappe.query_reports[report_name].filters;
      frappe.call({
        method: "erpnext.stock.doctype.inventory_dimension.inventory_dimension.get_inventory_dimensions",
        callback: function(r) {
          if (r.message && r.message.length) {
            r.message.forEach((dimension) => {
              let existing_filter = filters.filter((el) => el.fieldname === dimension["fieldname"]);
              if (!existing_filter.length) {
                filters.splice(index, 0, {
                  "fieldname": dimension["fieldname"],
                  "label": __(dimension["doctype"]),
                  "fieldtype": "MultiSelectList",
                  get_data: function(txt) {
                    return frappe.db.get_link_options(dimension["doctype"], txt);
                  }
                });
              } else {
                existing_filter[0]["fieldtype"] = "MultiSelectList";
                existing_filter[0]["get_data"] = function(txt) {
                  return frappe.db.get_link_options(dimension["doctype"], txt);
                };
              }
            });
          }
        }
      });
    },
    make_subscription: function(doctype, docname) {
      frappe.call({
        method: "frappe.automation.doctype.auto_repeat.auto_repeat.make_auto_repeat",
        args: {
          doctype,
          docname
        },
        callback: function(r) {
          var doclist = frappe.model.sync(r.message);
          frappe.set_route("Form", doclist[0].doctype, doclist[0].name);
        }
      });
    },
    make_pricing_rule: function(doctype, docname) {
      frappe.call({
        method: "erpnext.accounts.doctype.pricing_rule.pricing_rule.make_pricing_rule",
        args: {
          doctype,
          docname
        },
        callback: function(r) {
          var doclist = frappe.model.sync(r.message);
          frappe.set_route("Form", doclist[0].doctype, doclist[0].name);
        }
      });
    },
    first_row_is_empty: function(child_table) {
      if ($.isArray(child_table) && child_table.length > 0) {
        return !child_table[0].item_code;
      }
      return false;
    },
    remove_empty_first_row: function(frm, child_table_name) {
      const rows = frm["doc"][child_table_name];
      if (this.first_row_is_empty(rows)) {
        frm["doc"][child_table_name] = rows.splice(1);
      }
      return rows;
    },
    get_tree_options: function(option) {
      let unscrub_option = frappe.model.unscrub(option);
      let user_permission = frappe.defaults.get_user_permissions();
      let options;
      if (user_permission && user_permission[unscrub_option]) {
        options = user_permission[unscrub_option].map((perm) => perm.doc);
      } else {
        options = $.map(locals[`:${unscrub_option}`], function(c) {
          return c.name;
        }).sort();
      }
      return options.filter((value, index, self2) => self2.indexOf(value) === index);
    },
    get_tree_default: function(option) {
      let options = this.get_tree_options(option);
      if (options.includes(frappe.defaults.get_default(option))) {
        return frappe.defaults.get_default(option);
      } else {
        return options[0];
      }
    },
    overrides_parent_value_in_all_rows: function(doc, dt, dn, table_fieldname, fieldname, parent_fieldname) {
      if (doc[parent_fieldname]) {
        let cl = doc[table_fieldname] || [];
        for (let i = 0; i < cl.length; i++) {
          cl[i][fieldname] = doc[parent_fieldname];
        }
        frappe.refresh_field(table_fieldname);
      }
    },
    create_new_doc: function(doctype, update_fields) {
      frappe.model.with_doctype(doctype, function() {
        var new_doc = frappe.model.get_new_doc(doctype);
        for (let [key, value] of Object.entries(update_fields)) {
          new_doc[key] = value;
        }
        frappe.ui.form.make_quick_entry(doctype, null, null, new_doc);
      });
    },
    check_payments_app: () => {
      if (frappe.boot.versions && !frappe.boot.versions.payments) {
        const marketplace_link = '<a href="https://frappecloud.com/marketplace/apps/payments">Marketplace</a>';
        const github_link = '<a href="https://github.com/frappe/payments/">GitHub</a>';
        const msg = __("payments app is not installed. Please install it from {0} or {1}", [marketplace_link, github_link]);
        frappe.msgprint(msg);
      }
    }
  });
  erpnext.utils.select_alternate_items = function(opts) {
    const frm = opts.frm;
    const warehouse_field = opts.warehouse_field || "warehouse";
    const item_field = opts.item_field || "item_code";
    this.data = [];
    const dialog2 = new frappe.ui.Dialog({
      title: __("Select Alternate Item"),
      fields: [
        { fieldtype: "Section Break", label: __("Items") },
        {
          fieldname: "alternative_items",
          fieldtype: "Table",
          cannot_add_rows: true,
          in_place_edit: true,
          data: this.data,
          get_data: () => {
            return this.data;
          },
          fields: [{
            fieldtype: "Data",
            fieldname: "docname",
            hidden: 1
          }, {
            fieldtype: "Link",
            fieldname: "item_code",
            options: "Item",
            in_list_view: 1,
            read_only: 1,
            label: __("Item Code")
          }, {
            fieldtype: "Link",
            fieldname: "alternate_item",
            options: "Item",
            default: "",
            in_list_view: 1,
            label: __("Alternate Item"),
            onchange: function() {
              const item_code = this.get_value();
              const warehouse = this.grid_row.on_grid_fields_dict.warehouse.get_value();
              if (item_code && warehouse) {
                frappe.call({
                  method: "erpnext.stock.utils.get_latest_stock_qty",
                  args: {
                    item_code,
                    warehouse
                  },
                  callback: (r) => {
                    this.grid_row.on_grid_fields_dict.actual_qty.set_value(r.message || 0);
                  }
                });
              }
            },
            get_query: (e) => {
              return {
                query: "erpnext.stock.doctype.item_alternative.item_alternative.get_alternative_items",
                filters: {
                  item_code: e.item_code
                }
              };
            }
          }, {
            fieldtype: "Link",
            fieldname: "warehouse",
            options: "Warehouse",
            default: "",
            in_list_view: 1,
            label: __("Warehouse"),
            onchange: function() {
              const warehouse = this.get_value();
              const item_code = this.grid_row.on_grid_fields_dict.item_code.get_value();
              if (item_code && warehouse) {
                frappe.call({
                  method: "erpnext.stock.utils.get_latest_stock_qty",
                  args: {
                    item_code,
                    warehouse
                  },
                  callback: (r) => {
                    this.grid_row.on_grid_fields_dict.actual_qty.set_value(r.message || 0);
                  }
                });
              }
            }
          }, {
            fieldtype: "Float",
            fieldname: "actual_qty",
            default: 0,
            read_only: 1,
            in_list_view: 1,
            label: __("Available Qty")
          }]
        }
      ],
      primary_action: function() {
        const args = this.get_values()["alternative_items"];
        const alternative_items = args.filter((d) => {
          if (d.alternate_item && d.item_code != d.alternate_item) {
            return true;
          }
        });
        alternative_items.forEach((d) => {
          let row = frappe.get_doc(opts.child_doctype, d.docname);
          let qty = null;
          if (row.doctype === "Work Order Item") {
            qty = row.required_qty;
          } else {
            qty = row.qty;
          }
          row[item_field] = d.alternate_item;
          frappe.model.set_value(row.doctype, row.name, "qty", qty);
          frappe.model.set_value(row.doctype, row.name, opts.original_item_field, d.item_code);
          frm.trigger(item_field, row.doctype, row.name);
        });
        refresh_field(opts.child_docname);
        this.hide();
      },
      primary_action_label: __("Update")
    });
    frm.doc[opts.child_docname].forEach((d) => {
      if (!opts.condition || opts.condition(d)) {
        dialog2.fields_dict.alternative_items.df.data.push({
          "docname": d.name,
          "item_code": d[item_field],
          "warehouse": d[warehouse_field],
          "actual_qty": d.actual_qty
        });
      }
    });
    this.data = dialog2.fields_dict.alternative_items.df.data;
    dialog2.fields_dict.alternative_items.grid.refresh();
    dialog2.show();
  };
  erpnext.utils.update_child_items = function(opts) {
    const frm = opts.frm;
    const cannot_add_row = typeof opts.cannot_add_row === "undefined" ? true : opts.cannot_add_row;
    const child_docname = typeof opts.cannot_add_row === "undefined" ? "items" : opts.child_docname;
    const child_meta = frappe.get_meta(`${frm.doc.doctype} Item`);
    const get_precision = (fieldname) => child_meta.fields.find((f) => f.fieldname == fieldname).precision;
    this.data = frm.doc[opts.child_docname].map((d) => {
      return {
        "docname": d.name,
        "name": d.name,
        "item_code": d.item_code,
        "delivery_date": d.delivery_date,
        "schedule_date": d.schedule_date,
        "conversion_factor": d.conversion_factor,
        "qty": d.qty,
        "rate": d.rate,
        "uom": d.uom
      };
    });
    const fields = [{
      fieldtype: "Data",
      fieldname: "docname",
      read_only: 1,
      hidden: 1
    }, {
      fieldtype: "Link",
      fieldname: "item_code",
      options: "Item",
      in_list_view: 1,
      read_only: 0,
      disabled: 0,
      label: __("Item Code"),
      get_query: function() {
        let filters;
        if (frm.doc.doctype == "Sales Order") {
          filters = { "is_sales_item": 1 };
        } else if (frm.doc.doctype == "Purchase Order") {
          if (frm.doc.is_subcontracted) {
            if (frm.doc.is_old_subcontracting_flow) {
              filters = { "is_sub_contracted_item": 1 };
            } else {
              filters = { "is_stock_item": 0 };
            }
          } else {
            filters = { "is_purchase_item": 1 };
          }
        }
        return {
          query: "erpnext.controllers.queries.item_query",
          filters
        };
      }
    }, {
      fieldtype: "Link",
      fieldname: "uom",
      options: "UOM",
      read_only: 0,
      label: __("UOM"),
      reqd: 1,
      onchange: function() {
        frappe.call({
          method: "erpnext.stock.get_item_details.get_conversion_factor",
          args: { item_code: this.doc.item_code, uom: this.value },
          callback: (r) => {
            if (!r.exc) {
              if (this.doc.conversion_factor == r.message.conversion_factor)
                return;
              const docname = this.doc.docname;
              dialog.fields_dict.trans_items.df.data.some((doc) => {
                if (doc.docname == docname) {
                  doc.conversion_factor = r.message.conversion_factor;
                  dialog.fields_dict.trans_items.grid.refresh();
                  return true;
                }
              });
            }
          }
        });
      }
    }, {
      fieldtype: "Float",
      fieldname: "qty",
      default: 0,
      read_only: 0,
      in_list_view: 1,
      label: __("Qty"),
      precision: get_precision("qty")
    }, {
      fieldtype: "Currency",
      fieldname: "rate",
      options: "currency",
      default: 0,
      read_only: 0,
      in_list_view: 1,
      label: __("Rate"),
      precision: get_precision("rate")
    }];
    if (frm.doc.doctype == "Sales Order" || frm.doc.doctype == "Purchase Order") {
      fields.splice(2, 0, {
        fieldtype: "Date",
        fieldname: frm.doc.doctype == "Sales Order" ? "delivery_date" : "schedule_date",
        in_list_view: 1,
        label: frm.doc.doctype == "Sales Order" ? __("Delivery Date") : __("Reqd by date"),
        reqd: 1
      });
      fields.splice(3, 0, {
        fieldtype: "Float",
        fieldname: "conversion_factor",
        in_list_view: 1,
        label: __("Conversion Factor"),
        precision: get_precision("conversion_factor")
      });
    }
    new frappe.ui.Dialog({
      title: __("Update Items"),
      fields: [
        {
          fieldname: "trans_items",
          fieldtype: "Table",
          label: "Items",
          cannot_add_rows: cannot_add_row,
          in_place_edit: false,
          reqd: 1,
          data: this.data,
          get_data: () => {
            return this.data;
          },
          fields
        }
      ],
      primary_action: function() {
        const trans_items = this.get_values()["trans_items"].filter((item) => !!item.item_code);
        frappe.call({
          method: "erpnext.controllers.accounts_controller.update_child_qty_rate",
          freeze: true,
          args: {
            "parent_doctype": frm.doc.doctype,
            "trans_items": trans_items,
            "parent_doctype_name": frm.doc.name,
            "child_docname": child_docname
          },
          callback: function() {
            frm.reload_doc();
          }
        });
        this.hide();
        refresh_field("items");
      },
      primary_action_label: __("Update")
    }).show();
  };
  erpnext.utils.map_current_doc = function(opts) {
    function _map() {
      if ($.isArray(cur_frm.doc.items) && cur_frm.doc.items.length > 0) {
        if (!cur_frm.doc.items[0].item_code) {
          cur_frm.doc.items = cur_frm.doc.items.splice(1);
        }
        var items_doctype = frappe.meta.get_docfield(cur_frm.doctype, "items").options;
        var link_fieldname = null;
        frappe.get_meta(items_doctype).fields.forEach(function(d) {
          if (d.options === opts.source_doctype)
            link_fieldname = d.fieldname;
        });
        var already_set = false;
        var item_qty_map = {};
        $.each(cur_frm.doc.items, function(i, d) {
          opts.source_name.forEach(function(src) {
            if (d[link_fieldname] == src) {
              already_set = true;
              if (item_qty_map[d.item_code])
                item_qty_map[d.item_code] += flt(d.qty);
              else
                item_qty_map[d.item_code] = flt(d.qty);
            }
          });
        });
        if (already_set) {
          opts.source_name.forEach(function(src) {
            frappe.model.with_doc(opts.source_doctype, src, function(r) {
              var source_doc = frappe.model.get_doc(opts.source_doctype, src);
              $.each(source_doc.items || [], function(i, row) {
                if (row.qty > flt(item_qty_map[row.item_code])) {
                  already_set = false;
                  return false;
                }
              });
            });
            if (already_set) {
              frappe.msgprint(__("You have already selected items from {0} {1}", [opts.source_doctype, src]));
              return;
            }
          });
        }
      }
      return frappe.call({
        type: "POST",
        method: "frappe.model.mapper.map_docs",
        args: {
          "method": opts.method,
          "source_names": opts.source_name,
          "target_doc": cur_frm.doc,
          "args": opts.args
        },
        callback: function(r) {
          if (!r.exc) {
            var doc = frappe.model.sync(r.message);
            cur_frm.dirty();
            cur_frm.refresh();
          }
        }
      });
    }
    let query_args = {};
    if (opts.get_query_filters) {
      query_args.filters = opts.get_query_filters;
    }
    if (opts.get_query_method) {
      query_args.query = opts.get_query_method;
    }
    if (query_args.filters || query_args.query) {
      opts.get_query = () => query_args;
    }
    if (opts.source_doctype) {
      const d = new frappe.ui.form.MultiSelectDialog({
        doctype: opts.source_doctype,
        target: opts.target,
        date_field: opts.date_field || void 0,
        setters: opts.setters,
        get_query: opts.get_query,
        add_filters_group: 1,
        allow_child_item_selection: opts.allow_child_item_selection,
        child_fieldname: opts.child_fieldname,
        child_columns: opts.child_columns,
        size: opts.size,
        action: function(selections, args) {
          let values = selections;
          if (values.length === 0) {
            frappe.msgprint(__("Please select {0}", [opts.source_doctype]));
            return;
          }
          opts.source_name = values;
          if (opts.allow_child_item_selection) {
            opts.args = args;
          }
          d.dialog.hide();
          _map();
        }
      });
      return d;
    }
    if (opts.source_name) {
      opts.source_name = [opts.source_name];
      _map();
    }
  };
  frappe.form.link_formatters["Item"] = function(value, doc) {
    if (doc && value && doc.item_name && doc.item_name !== value && doc.item_code === value) {
      return value + ": " + doc.item_name;
    } else if (!value && doc.doctype && doc.item_name) {
      return doc.item_name;
    } else {
      return value;
    }
  };
  frappe.form.link_formatters["Employee"] = function(value, doc) {
    if (doc && value && doc.employee_name && doc.employee_name !== value && doc.employee === value) {
      return value + ": " + doc.employee_name;
    } else if (!value && doc.doctype && doc.employee_name) {
      return doc.employee;
    } else {
      return value;
    }
  };
  frappe.form.link_formatters["Project"] = function(value, doc) {
    if (doc && value && doc.project_name && doc.project_name !== value && doc.project === value) {
      return value + ": " + doc.project_name;
    } else if (!value && doc.doctype && doc.project_name) {
      return doc.project;
    } else {
      return value;
    }
  };
  $(document).on("app_ready", function() {
    if (!frappe.datetime.is_timezone_same()) {
      $.each([
        "Stock Reconciliation",
        "Stock Entry",
        "Stock Ledger Entry",
        "Delivery Note",
        "Purchase Receipt",
        "Sales Invoice"
      ], function(i, d) {
        frappe.ui.form.on(d, "onload", function(frm) {
          cur_frm.set_df_property("posting_time", "description", frappe.sys_defaults.time_zone);
        });
      });
    }
  });
  $(document).on("app_ready", function() {
    frappe.call({
      method: "erpnext.support.doctype.service_level_agreement.service_level_agreement.get_sla_doctypes",
      callback: function(r) {
        if (!r.message)
          return;
        $.each(r.message, function(_i, d) {
          frappe.ui.form.on(d, {
            onload: function(frm) {
              if (!frm.doc.service_level_agreement)
                return;
              frappe.call({
                method: "erpnext.support.doctype.service_level_agreement.service_level_agreement.get_service_level_agreement_filters",
                args: {
                  doctype: frm.doc.doctype,
                  name: frm.doc.service_level_agreement,
                  customer: frm.doc.customer
                },
                callback: function(r2) {
                  if (r2 && r2.message) {
                    frm.set_query("priority", function() {
                      return {
                        filters: {
                          "name": ["in", r2.message.priority]
                        }
                      };
                    });
                    frm.set_query("service_level_agreement", function() {
                      return {
                        filters: {
                          "name": ["in", r2.message.service_level_agreements]
                        }
                      };
                    });
                  }
                }
              });
            },
            refresh: function(frm) {
              if (frm.doc.status !== "Closed" && frm.doc.service_level_agreement && ["First Response Due", "Resolution Due"].includes(frm.doc.agreement_status)) {
                frappe.call({
                  "method": "frappe.client.get",
                  args: {
                    doctype: "Service Level Agreement",
                    name: frm.doc.service_level_agreement
                  },
                  callback: function(data) {
                    let statuses = data.message.pause_sla_on;
                    const hold_statuses = [];
                    $.each(statuses, (_i2, entry) => {
                      hold_statuses.push(entry.status);
                    });
                    if (hold_statuses.includes(frm.doc.status)) {
                      frm.dashboard.clear_headline();
                      let message = { "indicator": "orange", "msg": __("SLA is on hold since {0}", [moment(frm.doc.on_hold_since).fromNow(true)]) };
                      frm.dashboard.set_headline_alert('<div class="row"><div class="col-xs-12"><span class="indicator whitespace-nowrap ' + message.indicator + '"><span>' + message.msg + "</span></span> </div></div>");
                    } else {
                      set_time_to_resolve_and_response(frm, data.message.apply_sla_for_resolution);
                    }
                  }
                });
              } else if (frm.doc.service_level_agreement) {
                frm.dashboard.clear_headline();
                let agreement_status = frm.doc.agreement_status == "Fulfilled" ? { "indicator": "green", "msg": "Service Level Agreement has been fulfilled" } : { "indicator": "red", "msg": "Service Level Agreement Failed" };
                frm.dashboard.set_headline_alert('<div class="row"><div class="col-xs-12"><span class="indicator whitespace-nowrap ' + agreement_status.indicator + '"><span class="hidden-xs">' + agreement_status.msg + "</span></span> </div></div>");
              }
            }
          });
        });
      }
    });
  });
  function set_time_to_resolve_and_response(frm, apply_sla_for_resolution) {
    frm.dashboard.clear_headline();
    let time_to_respond;
    if (!frm.doc.first_responded_on) {
      time_to_respond = get_time_left(frm.doc.response_by, frm.doc.agreement_status);
    } else {
      time_to_respond = get_status(frm.doc.response_by, frm.doc.first_responded_on);
    }
    let alert = `
		<div class="row">
			<div class="col-xs-12 col-sm-6">
				<span class="indicator whitespace-nowrap ${time_to_respond.indicator}">
					<span>Time to Respond: ${time_to_respond.diff_display}</span>
				</span>
			</div>`;
    if (apply_sla_for_resolution) {
      let time_to_resolve;
      if (!frm.doc.resolution_date) {
        time_to_resolve = get_time_left(frm.doc.resolution_by, frm.doc.agreement_status);
      } else {
        time_to_resolve = get_status(frm.doc.resolution_by, frm.doc.resolution_date);
      }
      alert += `
			<div class="col-xs-12 col-sm-6">
				<span class="indicator whitespace-nowrap ${time_to_resolve.indicator}">
					<span>Time to Resolve: ${time_to_resolve.diff_display}</span>
				</span>
			</div>`;
    }
    alert += "</div>";
    frm.dashboard.set_headline_alert(alert);
  }
  function get_time_left(timestamp, agreement_status) {
    const diff = moment(timestamp).diff(moment());
    const diff_display = diff >= 44500 ? moment.duration(diff).humanize() : "Failed";
    let indicator = diff_display == "Failed" && agreement_status != "Fulfilled" ? "red" : "green";
    return { "diff_display": diff_display, "indicator": indicator };
  }
  function get_status(expected, actual) {
    const time_left = moment(expected).diff(moment(actual));
    if (time_left >= 0) {
      return { "diff_display": "Fulfilled", "indicator": "green" };
    } else {
      return { "diff_display": "Failed", "indicator": "red" };
    }
  }
  function attach_selector_button(inner_text, append_loction, context, grid_row) {
    let $btn_div = $("<div>").css({ "margin-bottom": "10px", "margin-top": "10px" }).appendTo(append_loction);
    let $btn = $(`<button class="btn btn-sm btn-default">${inner_text}</button>`).appendTo($btn_div);
    $btn.on("click", function() {
      context.show_serial_batch_selector(grid_row.frm, grid_row.doc, "", "", true);
    });
  }
})();
/**!
 * Sortable
 * @author	RubaXa   <trash@rubaxa.org>
 * @author	owenm    <owen23355@gmail.com>
 * @license MIT
 */
//# sourceMappingURL=engr.bundle.A77MGJZW.js.map
