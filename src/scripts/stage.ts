const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;

export interface StageController {
	refresh: () => void;
	enterFullscreen: () => Promise<void>;
	isFullscreenAvailable: boolean;
	destroy: () => void;
}

export function setupStage(): StageController | null {
	const fullscreenTarget = document.querySelector<HTMLElement>('[data-stage-fullscreen]');
	const viewport = document.querySelector<HTMLElement>('[data-stage-viewport]');
	const canvas = document.querySelector<HTMLElement>('[data-stage-canvas]');
	const controls = document.querySelector<HTMLElement>('[data-fullscreen-controls]');
	const controlsHandle = document.querySelector<HTMLButtonElement>('[data-fullscreen-controls-handle]');

	if (!fullscreenTarget || !viewport || !canvas || !controls || !controlsHandle) return null;

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

	let cursorTimer: number | null = null;
	let controlsTimer: number | null = null;
	let closeTimer: number | null = null;
	let handleTimer: number | null = null;

	const clearControlsTimers = () => {
		if (controlsTimer !== null) window.clearTimeout(controlsTimer);
		if (closeTimer !== null) window.clearTimeout(closeTimer);
		if (handleTimer !== null) window.clearTimeout(handleTimer);
		controlsTimer = null;
		closeTimer = null;
		handleTimer = null;
	};

	const showHandleTemporarily = () => {
		fullscreenTarget.classList.remove('is-handle-hidden');
		if (handleTimer !== null) window.clearTimeout(handleTimer);
		handleTimer = window.setTimeout(() => {
			fullscreenTarget.classList.add('is-handle-hidden');
			handleTimer = null;
		}, 650);
	};

	const collapseControls = () => {
		if (document.fullscreenElement !== fullscreenTarget) return;
		fullscreenTarget.classList.remove('is-controls-peek');
		fullscreenTarget.classList.add('is-controls-collapsed');
		showHandleTemporarily();
	};

	const revealControls = () => {
		if (document.fullscreenElement !== fullscreenTarget) return;
		if (closeTimer !== null) window.clearTimeout(closeTimer);
		closeTimer = null;
		fullscreenTarget.classList.add('is-controls-peek');
	};

	const scheduleControlsClose = () => {
		if (!fullscreenTarget.classList.contains('is-controls-collapsed')) return;
		if (closeTimer !== null) window.clearTimeout(closeTimer);
		closeTimer = window.setTimeout(() => {
			fullscreenTarget.classList.remove('is-controls-peek');
			showHandleTemporarily();
			closeTimer = null;
		}, 140);
	};

	const revealControlsTemporarily = () => {
		revealControls();
		if (closeTimer !== null) window.clearTimeout(closeTimer);
		closeTimer = window.setTimeout(() => {
			fullscreenTarget.classList.remove('is-controls-peek');
			showHandleTemporarily();
			closeTimer = null;
		}, 1600);
	};

	const showCursorTemporarily = () => {
		fullscreenTarget.classList.remove('is-cursor-hidden');
		if (cursorTimer !== null) window.clearTimeout(cursorTimer);
		if (document.fullscreenElement === fullscreenTarget) {
			cursorTimer = window.setTimeout(() => {
				if (!fullscreenTarget.classList.contains('is-controls-peek')) {
					fullscreenTarget.classList.add('is-cursor-hidden');
				}
			}, 2000);
		}
	};

	const handleFullscreenChange = () => {
		clearControlsTimers();
		if (document.fullscreenElement === fullscreenTarget) {
			fullscreenTarget.classList.remove('is-controls-collapsed', 'is-controls-peek', 'is-handle-hidden');
			controlsTimer = window.setTimeout(collapseControls, 1300);
		} else {
			fullscreenTarget.classList.remove('is-controls-collapsed', 'is-controls-peek', 'is-handle-hidden', 'is-cursor-hidden');
		}
		showCursorTemporarily();
		window.requestAnimationFrame(refresh);
	};

	fullscreenTarget.addEventListener('pointermove', showCursorTemporarily);
	controlsHandle.addEventListener('pointerenter', revealControls);
	controlsHandle.addEventListener('focus', revealControls);
	controlsHandle.addEventListener('click', revealControlsTemporarily);
	controls.addEventListener('pointerenter', revealControls);
	controls.addEventListener('pointerleave', scheduleControlsClose);
	controls.addEventListener('focusin', revealControls);
	controls.addEventListener('focusout', scheduleControlsClose);
	document.addEventListener('fullscreenchange', handleFullscreenChange);

	return {
		refresh,
		enterFullscreen: async () => {
			if (!document.fullscreenEnabled) throw new Error('La pantalla completa no está disponible.');
			if (document.fullscreenElement === fullscreenTarget) return;
			await fullscreenTarget.requestFullscreen();
		},
		isFullscreenAvailable: document.fullscreenEnabled,
		destroy: () => {
			observer.disconnect();
			fullscreenTarget.removeEventListener('pointermove', showCursorTemporarily);
			controlsHandle.removeEventListener('pointerenter', revealControls);
			controlsHandle.removeEventListener('focus', revealControls);
			controlsHandle.removeEventListener('click', revealControlsTemporarily);
			controls.removeEventListener('pointerenter', revealControls);
			controls.removeEventListener('pointerleave', scheduleControlsClose);
			controls.removeEventListener('focusin', revealControls);
			controls.removeEventListener('focusout', scheduleControlsClose);
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			if (cursorTimer !== null) window.clearTimeout(cursorTimer);
			clearControlsTimers();
		},
	};
}
