import { gsap } from 'gsap';

export interface PromoAnimationCallbacks {
	onComplete?: () => void;
}

export interface PromoAnimationController {
	play: () => void;
	pause: () => void;
	reset: () => void;
	showFinal: () => void;
	isPlaying: () => boolean;
	isComplete: () => boolean;
	isAtStart: () => boolean;
	destroy: () => void;
}

export function setupPromoAnimation(
	callbacks: PromoAnimationCallbacks = {},
): PromoAnimationController | null {
	const stage = document.querySelector<HTMLElement>('[data-stage-canvas]');
	const browser = document.querySelector<HTMLElement>('[data-browser-perspective]');
	const mobile = document.querySelector<HTMLElement>('[data-mobile-perspective]');
	const copy = document.querySelector<HTMLElement>('[data-stage-copy]');
	const copyLabel = copy?.querySelector<HTMLElement>('.stage-copy__label');
	const title = document.querySelector<HTMLElement>('[data-stage-title]');
	const line = copy?.querySelector<HTMLElement>('.stage-copy__line');
	const brand = document.querySelector<HTMLElement>('[data-stage-brand]');

	if (!stage || !browser || !mobile || !copy || !copyLabel || !title || !line || !brand) {
		console.warn('No se pudo crear la animación: faltan elementos de la escena.');
		return null;
	}

	let timeline: ReturnType<typeof gsap.timeline> | undefined;
	const context = gsap.context(() => {
		timeline = gsap.timeline({
			paused: true,
			defaults: { ease: 'power3.out' },
			onComplete: callbacks.onComplete,
		});

		timeline
			.fromTo(
				browser,
				{ autoAlpha: 0, x: -145, y: 72, scale: 0.94, rotation: -1.8 },
				{ autoAlpha: 1, x: 0, y: 0, scale: 1, rotation: 0, duration: 1.35 },
				0,
			)
			.fromTo(
				mobile,
				{ autoAlpha: 0, x: -70, y: 110, scale: 0.88, rotation: -4 },
				{ autoAlpha: 1, x: 0, y: 0, scale: 1, rotation: 0, duration: 1.05 },
				0.32,
			)
			.fromTo(copyLabel, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 0.48)
			.fromTo(title, { autoAlpha: 0, y: 64 }, { autoAlpha: 1, y: 0, duration: 1.05 }, 0.7)
			.fromTo(line, { autoAlpha: 0, scaleX: 0 }, { autoAlpha: 0.85, scaleX: 1, duration: 0.75, transformOrigin: 'left center' }, 1.08)
			.fromTo(brand, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 1.2)
			.to(browser, { x: 24, y: -8, scale: 1.035, duration: 6.2, ease: 'sine.inOut' }, 1.55)
			.to(mobile, { x: 10, y: -18, scale: 1.025, duration: 6.2, ease: 'sine.inOut' }, 1.55)
			.to(stage, { duration: 2.1 });
	}, stage);

	if (!timeline) {
		context.revert();
		return null;
	}
	const promoTimeline = timeline;

	return {
		play: () => {
			if (promoTimeline.progress() >= 1) promoTimeline.restart();
			else promoTimeline.play();
		},
		pause: () => promoTimeline.pause(),
		reset: () => promoTimeline.pause(0, true),
		showFinal: () => promoTimeline.pause().progress(1, true),
		isPlaying: () => promoTimeline.isActive(),
		isComplete: () => promoTimeline.progress() >= 1,
		isAtStart: () => promoTimeline.time() === 0,
		destroy: () => context.revert(),
	};
}
