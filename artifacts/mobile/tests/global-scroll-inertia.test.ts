import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { jsx } from "react/jsx-runtime";
import ts from "typescript";

const source = readFileSync(new URL("../lib/configure-scroll.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;

function setup(os: string, directClass = false) {
  const calls: any[] = [];
  class NativeScroll extends React.Component<any> {
    static defaultProps: any = { keyboardShouldPersistTaps: "never" };
    render() {
      calls.push(this.props);
      return React.createElement("div", { "data-rate": this.props.decelerationRate });
    }
  }
  const ScrollView = directClass ? NativeScroll : (props: any) => jsx(NativeScroll, props);
  const exported: any = {};
  new Function("exports", "require", compiled)(exported, (name: string) => {
    if (name === "react") return React;
    if (name === "react-native") return { Platform: { OS: os }, ScrollView };
    throw new Error(`Unexpected dependency ${name}`);
  });
  const render = (props: any = {}) => {
    renderToStaticMarkup(jsx(ScrollView, props));
    return calls.at(-1);
  };
  return { exported, render, NativeScroll, ScrollView };
}

test("native ScrollView class gets lower inertia on iPhone and Android with the JSX runtime", () => {
  for (const [os, expected, original] of [["ios", 0.995, 0.998], ["android", 0.97, 0.985]] as const) {
    const { render } = setup(os);
    const props = render();
    assert.equal(props.decelerationRate, expected);
    assert.ok(expected < original);
    assert.equal(props.keyboardShouldPersistTaps, "never");
    assert.equal(render({ decelerationRate: undefined }).decelerationRate, expected);
  }
});

test("explicit selector/carousel rates, paging, refs and gesture callbacks are preserved", () => {
  const { render } = setup("ios");
  const callback = () => {};
  const ref = { current: null };
  for (const rate of ["fast", "normal", 0, 0.99]) {
    const props = render({
      decelerationRate: rate, horizontal: true, pagingEnabled: true,
      snapToInterval: 38, scrollViewRef: ref, onScroll: callback, onScrollEndDrag: callback,
    });
    assert.equal(props.decelerationRate, rate);
    assert.equal(props.horizontal, true);
    assert.equal(props.pagingEnabled, true);
    assert.equal(props.snapToInterval, 38);
    assert.equal(props.scrollViewRef, ref);
    assert.equal(props.onScroll, callback);
    assert.equal(props.onScrollEndDrag, callback);
  }
});

test("lists and animated controls rendering the shared ScrollView inherit the new default", () => {
  const { ScrollView, NativeScroll } = setup("android");
  const List = () => jsx(ScrollView, { onScroll: () => {} });
  const AnimatedList = () => jsx(List, {});
  assert.match(renderToStaticMarkup(jsx(AnimatedList, {})), /data-rate="0.97"/);
  assert.equal(NativeScroll.defaultProps.decelerationRate, 0.97);
});

test("web scroll stays browser-controlled and installation can safely run again", () => {
  assert.equal(setup("web").render().decelerationRate, undefined);
  const { exported, render } = setup("ios", true);
  exported.installScrollDefaults();
  assert.equal(render().decelerationRate, 0.995);
});

test("defaults are installed before router screens mount without changing animation/drag code", () => {
  const layout = readFileSync(new URL("../app/_layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /import "@\/lib\/configure-scroll";/);
  assert.doesNotMatch(source, /scrollTo|PanResponder|scrollEventThrottle|onTouchMove|setInterval/);
});