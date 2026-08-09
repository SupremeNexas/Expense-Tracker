import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Mock HTMLCanvasElement.getContext for jsdom environments (WebGL / 2D)
if (typeof window !== 'undefined' && window.HTMLCanvasElement) {
  // @ts-ignore
  HTMLCanvasElement.prototype.getContext = () => ({
    getExtension: () => null,
    enable: () => {},
    disable: () => {},
    blendFunc: () => {},
    clearColor: () => {},
    viewport: () => {},
    createShader: () => ({}),
    shaderSource: () => {},
    compileShader: () => {},
    getShaderParameter: () => true,
    createProgram: () => ({}),
    attachShader: () => {},
    linkProgram: () => {},
    getProgramParameter: () => true,
    useProgram: () => {},
    createBuffer: () => ({}),
    bindBuffer: () => {},
    bufferData: () => {},
    createVertexArray: () => ({}),
    bindVertexArray: () => {},
    enableVertexAttribArray: () => {},
    vertexAttribPointer: () => {},
    drawArrays: () => {},
    getUniformLocation: () => ({}),
    getAttribLocation: () => 0,
    uniform1f: () => {},
    uniform2f: () => {},
    uniform3f: () => {},
    uniform4f: () => {},
    uniformMatrix4fv: () => {},
    deleteShader: () => {},
    deleteProgram: () => {},
    deleteBuffer: () => {},
    deleteVertexArray: () => {},
    getParameter: () => null,
    canvas: { width: 100, height: 100 } as any
  });
}

// Cleanup after each test
afterEach(() => {
  cleanup();
});
