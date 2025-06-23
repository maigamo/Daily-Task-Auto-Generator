/**
 * DOM操作工具类
 * 提供安全的DOM操作方法，避免使用innerHTML等不安全API
 */

/**
 * 安全地设置元素内容，避免使用innerHTML
 * 将HTML字符串转换为DOM节点并添加到目标元素
 * @param targetEl 目标元素
 * @param htmlContent HTML内容字符串
 */
export function setElementContent(targetEl: HTMLElement, htmlContent: string): void {
    // 清空目标元素
    while (targetEl.firstChild) {
        targetEl.removeChild(targetEl.firstChild);
    }
    
    // 使用DOMParser安全地解析HTML内容
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // 安全地添加解析后的内容
    Array.from(doc.body.childNodes).forEach(node => {
        targetEl.appendChild(document.importNode(node, true));
    });
}

/**
 * 将文本内容按行分割并安全地添加到目标元素
 * @param targetEl 目标元素
 * @param textContent 要添加的文本内容
 */
export function setTextContentByLines(targetEl: HTMLElement, textContent: string): void {
    // 清空目标元素
    while (targetEl.firstChild) {
        targetEl.removeChild(targetEl.firstChild);
    }
    
    // 创建预格式化的div来保持原始格式
    const preEl = document.createElement('div');
    preEl.style.whiteSpace = 'pre-wrap';
    preEl.style.wordWrap = 'break-word';
    preEl.style.textAlign = 'left';
    preEl.style.margin = '0';
    preEl.style.padding = '0';
    preEl.style.fontFamily = 'inherit';
    preEl.style.lineHeight = 'inherit';
    
    // 直接设置文本内容，保持原始格式
    preEl.textContent = textContent;
    
    // 添加到目标元素
    targetEl.appendChild(preEl);
}

/**
 * 创建带图标的按钮
 * @param container 父容器
 * @param iconName 图标名称
 * @param buttonText 按钮文本
 * @param cssClasses 附加CSS类名数组
 * @returns 按钮元素
 */
export function createIconButton(
    container: HTMLElement,
    iconName: string,
    buttonText: string,
    cssClasses: string[] = []
): HTMLButtonElement {
    // 创建按钮元素
    const button = document.createElement('button');
    button.textContent = buttonText;
    
    // 添加CSS类
    if (cssClasses.length > 0) {
        button.classList.add('icon-button', ...cssClasses);
    } else {
        button.classList.add('icon-button');
    }
    
    // 添加图标
    const icon = document.createElement('span');
    icon.classList.add('svg-icon', `lucide-${iconName}`);
    button.prepend(icon);
    
    // 添加到容器
    container.appendChild(button);
    
    return button;
}

/**
 * 创建文本标记
 * @param container 父容器
 * @param text 文本内容
 * @param tagType 标签类型，默认为span
 * @param cssClasses 附加CSS类名数组
 * @returns 创建的元素
 */
export function createTextElement(
    container: HTMLElement,
    text: string,
    tagType: 'span' | 'div' | 'p' = 'span',
    cssClasses: string[] = []
): HTMLElement {
    const element = document.createElement(tagType);
    element.textContent = text;
    
    // 添加CSS类
    if (cssClasses.length > 0) {
        element.classList.add(...cssClasses);
    }
    
    container.appendChild(element);
    return element;
}

/**
 * 清除元素中所有内联样式
 * @param element 目标元素
 * @param recursive 是否递归处理子元素
 */
export function removeInlineStyles(element: HTMLElement, recursive: boolean = true): void {
    // 移除当前元素的内联样式
    element.removeAttribute('style');
    
    // 如果需要递归处理
    if (recursive && element.children.length > 0) {
        // 将HTMLCollection转为数组进行处理
        Array.from(element.children).forEach(child => {
            if (child instanceof HTMLElement) {
                removeInlineStyles(child, true);
            }
        });
    }
} 