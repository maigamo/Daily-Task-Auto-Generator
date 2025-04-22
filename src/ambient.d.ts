/**
 * 扩展HTMLElement接口，添加Obsidian特有的方法
 */
interface HTMLElement {
    addClass(cls: string): void;
    removeClass(cls: string): void;
    toggleClass(cls: string): void;
    empty(): void;
    createEl<K extends keyof HTMLElementTagNameMap>(tag: K, attrs?: object): HTMLElementTagNameMap[K];
} 