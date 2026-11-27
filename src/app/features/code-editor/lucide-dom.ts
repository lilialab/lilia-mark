import { createElement, type IconNode } from 'lucide';

/** lucide IconNode → SVG 元素（CM 面板等原生 DOM） */
export function lucideSvg(icon: IconNode, size = 16, strokeWidth = 2): SVGElement {
  return createElement(icon, {
    width: size,
    height: size,
    'stroke-width': strokeWidth,
    'aria-hidden': 'true',
  });
}

/** 把按钮内容换成 lucide 图标 */
export function setButtonIcon(
  button: HTMLButtonElement,
  icon: IconNode,
  size = 16,
): void {
  button.replaceChildren(lucideSvg(icon, size));
}
