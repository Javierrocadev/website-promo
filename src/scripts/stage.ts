const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;

export interface StageController {
	refresh: () => void;
	destroy: () => void;
}

export function setupStage(): StageController | null {
	const viewport = document.querySelector<HTMLElement>('[data-stage-viewport]');
	const canvas = document.querySelector<HTMLElement>('[data-stage-canvas]');

	if (!viewport || !canvas) return null;

	const refresh = () => {
		const viewportWidth = viewport.clientWidth;
		const viewportHeight = viewport.clientHeight;
		if (viewportWidth === 0 || viewportHeight === 0) return;

		const scale = Math.min(viewportWidth / DESIGN_WIDTH, viewportHeight / DESIGN_HEIGHT);
		const renderedWidth = DESIGN_WIDTH * scale;
		const renderedHeight = DESIGN_HEIGHT * scale;

		canvas.style.transform = `scale(${scale})`;
		canvas.style.left = `${(viewportWidth - renderedWidth) / 2}px`;
		canvas.style.top = `${(viewportHeight - renderedHeight) / 2}px`;
	};

	const observer = new ResizeObserver(refresh);
	observer.observe(viewport);
	refresh();

	return {
		refresh,
		destroy: () => observer.disconnect(),
	};
}
