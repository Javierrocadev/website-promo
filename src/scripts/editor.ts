import { setupPromoAnimation, type PromoAnimationController } from './animation';
import { setupStage } from './stage';

export interface PromoConfig {
	url: string;
	backgroundColor: string;
	textColor: string;
	presenting: string;
	title: string;
	brandMode: 'text' | 'logo';
	brand: string;
	brandLogo: string;
	brandLogoName: string;
	animationEnabled: boolean;
	countdownEnabled: boolean;
}

const STORAGE_KEY = 'website-promo:config:v1';
const HEX_COLOR = /^#[0-9A-F]{6}$/i;
const LOGO_DATA_URL = /^data:image\/(?:png|jpeg|webp|svg\+xml);base64,/i;
const LOGO_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
const MAX_LOGO_SIZE = 1024 * 1024;

export const DEFAULT_CONFIG: PromoConfig = {
	url: '',
	backgroundColor: '#121212',
	textColor: '#FFFFFF',
	presenting: 'Presenting',
	title: 'Website\nPromo',
	brandMode: 'text',
	brand: 'Tu marca',
	brandLogo: '',
	brandLogoName: '',
	animationEnabled: true,
	countdownEnabled: true,
};

function getElement<T extends Element>(selector: string): T | null {
	return document.querySelector<T>(selector);
}

function readStoredConfig(): PromoConfig {
	try {
		const rawConfig = localStorage.getItem(STORAGE_KEY);
		if (!rawConfig) {
			return {
				...DEFAULT_CONFIG,
				animationEnabled: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
			};
		}

		const parsed: unknown = JSON.parse(rawConfig);
		if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_CONFIG };
		const candidate = parsed as Partial<PromoConfig>;
		const storedLogo =
			typeof candidate.brandLogo === 'string' && LOGO_DATA_URL.test(candidate.brandLogo)
				? candidate.brandLogo
				: DEFAULT_CONFIG.brandLogo;

		return {
			url:
				typeof candidate.url === 'string'
					? (normalizeUrl(candidate.url) ?? DEFAULT_CONFIG.url)
					: DEFAULT_CONFIG.url,
			backgroundColor:
				typeof candidate.backgroundColor === 'string' && HEX_COLOR.test(candidate.backgroundColor)
					? candidate.backgroundColor.toUpperCase()
					: DEFAULT_CONFIG.backgroundColor,
			textColor:
				typeof candidate.textColor === 'string' && HEX_COLOR.test(candidate.textColor)
					? candidate.textColor.toUpperCase()
					: DEFAULT_CONFIG.textColor,
			presenting:
				typeof candidate.presenting === 'string'
					? candidate.presenting.slice(0, 28)
					: DEFAULT_CONFIG.presenting,
			title: typeof candidate.title === 'string' ? candidate.title.slice(0, 48) : DEFAULT_CONFIG.title,
			brandMode: candidate.brandMode === 'logo' ? 'logo' : DEFAULT_CONFIG.brandMode,
			brand: typeof candidate.brand === 'string' ? candidate.brand.slice(0, 32) : DEFAULT_CONFIG.brand,
			brandLogo: storedLogo,
			brandLogoName:
				typeof candidate.brandLogoName === 'string'
					? candidate.brandLogoName.slice(0, 120)
					: DEFAULT_CONFIG.brandLogoName,
			animationEnabled:
				typeof candidate.animationEnabled === 'boolean'
					? candidate.animationEnabled
					: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
			countdownEnabled:
				typeof candidate.countdownEnabled === 'boolean'
					? candidate.countdownEnabled
					: DEFAULT_CONFIG.countdownEnabled,
		};
	} catch (error) {
		console.warn('No se pudo leer la configuración guardada.', error);
		return {
			...DEFAULT_CONFIG,
			animationEnabled: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
		};
	}
}

function saveConfig(config: PromoConfig): boolean {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
		return true;
	} catch (error) {
		console.warn('No se pudo guardar la configuración.', error);
		return false;
	}
}

function normalizeUrl(value: string): string | null {
	const trimmed = value.trim();
	if (!trimmed) return null;

	try {
		const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
		const url = new URL(candidate);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
		return url.toString();
	} catch {
		return null;
	}
}

function readFileAsDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.addEventListener('load', () => {
			if (typeof reader.result === 'string') resolve(reader.result);
			else reject(new Error('El archivo no se pudo convertir en una imagen.'));
		});
		reader.addEventListener('error', () => reject(reader.error ?? new Error('No se pudo leer el archivo.')));
		reader.readAsDataURL(file);
	});
}

function initializeEditor(): void {
	const stageController = setupStage();
	const stage = getElement<HTMLElement>('[data-stage-canvas]');
	const presentingPreview = getElement<HTMLElement>('[data-stage-presenting]');
	const titlePreview = getElement<HTMLElement>('[data-stage-title]');
	const brandPreview = getElement<HTMLElement>('[data-stage-brand]');
	const brandTextPreview = getElement<HTMLElement>('[data-stage-brand-text]');
	const brandLogoPreview = getElement<HTMLImageElement>('[data-stage-brand-logo]');
	const presentingInput = getElement<HTMLInputElement>('[data-presenting-input]');
	const titleInput = getElement<HTMLTextAreaElement>('[data-title-input]');
	const brandInput = getElement<HTMLInputElement>('[data-brand-input]');
	const brandModeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-brand-mode]'));
	const brandTextPanel = getElement<HTMLElement>('[data-brand-text-panel]');
	const brandLogoPanel = getElement<HTMLElement>('[data-brand-logo-panel]');
	const logoInput = getElement<HTMLInputElement>('[data-logo-input]');
	const logoPreview = getElement<HTMLImageElement>('[data-logo-preview]');
	const logoPlaceholder = getElement<SVGElement>('[data-logo-placeholder]');
	const logoName = getElement<HTMLElement>('[data-logo-name]');
	const logoError = getElement<HTMLElement>('[data-logo-error]');
	const logoRemoveButton = getElement<HTMLButtonElement>('[data-logo-remove]');
	const titleCount = getElement<HTMLElement>('[data-title-count]');
	const urlForm = getElement<HTMLFormElement>('[data-url-form]');
	const urlInput = getElement<HTMLInputElement>('[data-url-input]');
	const urlError = getElement<HTMLElement>('[data-url-error]');
	const iframe = getElement<HTMLIFrameElement>('[data-browser-iframe]');
	const emptyState = getElement<HTMLElement>('[data-browser-empty]');
	const browserAddress = getElement<HTMLElement>('[data-browser-address]');
	const backgroundPicker = getElement<HTMLInputElement>('[data-background-picker]');
	const backgroundHex = getElement<HTMLInputElement>('[data-background-hex]');
	const textPicker = getElement<HTMLInputElement>('[data-text-picker]');
	const textHex = getElement<HTMLInputElement>('[data-text-hex]');
	const colorPresetButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-color-background][data-color-text]'));
	const staticToggle = getElement<HTMLInputElement>('[data-static-toggle]');
	const countdownToggle = getElement<HTMLInputElement>('[data-countdown-toggle]');
	const playButton = getElement<HTMLButtonElement>('[data-action="play"]');
	const pauseButton = getElement<HTMLButtonElement>('[data-action="pause"]');
	const restartButton = getElement<HTMLButtonElement>('[data-action="restart"]');
	const fullscreenButton = getElement<HTMLButtonElement>('[data-action="fullscreen"]');
	const resetButton = getElement<HTMLButtonElement>('[data-action="reset"]');
	const countdown = getElement<HTMLElement>('[data-stage-countdown]');
	const status = getElement<HTMLElement>('[data-stage-status]');

	if (!stage || !presentingPreview || !titlePreview || !brandPreview || !brandTextPreview || !brandLogoPreview || !presentingInput || !titleInput || !brandInput || brandModeButtons.length !== 2 || !brandTextPanel || !brandLogoPanel || !logoInput || !logoPreview || !logoPlaceholder || !logoName || !logoError || !logoRemoveButton || !urlForm || !urlInput || !urlError || !iframe || !emptyState || !browserAddress || !backgroundPicker || !backgroundHex || !textPicker || !textHex || !staticToggle || !countdownToggle || !playButton || !pauseButton || !restartButton || !fullscreenButton || !resetButton || !countdown) {
		console.warn('No se pudo inicializar el editor: faltan elementos de la interfaz.');
		stageController?.destroy();
		return;
	}

	let config = readStoredConfig();
	let animationController: PromoAnimationController | null = null;
	let countdownTimer: number | null = null;
	let countdownRunning = false;

	const setStatus = (message: string) => {
		if (status) status.textContent = message;
	};

	const updatePlaybackButtons = () => {
		const animationUnavailable = !config.animationEnabled || !animationController;
		playButton.disabled = animationUnavailable || countdownRunning || Boolean(animationController?.isPlaying());
		pauseButton.disabled = animationUnavailable || (!countdownRunning && !animationController?.isPlaying());
		restartButton.disabled = animationUnavailable;
		fullscreenButton.disabled = !stageController?.isFullscreenAvailable;
	};

	const cancelCountdown = () => {
		if (countdownTimer !== null) window.clearInterval(countdownTimer);
		countdownTimer = null;
		countdownRunning = false;
		countdown.hidden = true;
		countdown.textContent = '';
		updatePlaybackButtons();
	};

	const playTimeline = () => {
		if (!animationController || !config.animationEnabled) return;
		animationController.play();
		setStatus('Reproduciendo');
		updatePlaybackButtons();
	};

	const startCountdown = () => {
		if (countdownRunning) return;
		let remaining = 3;
		countdownRunning = true;
		countdown.hidden = false;
		countdown.textContent = String(remaining);
		setStatus('Cuenta atrás');
		updatePlaybackButtons();

		countdownTimer = window.setInterval(() => {
			remaining -= 1;
			if (remaining <= 0) {
				cancelCountdown();
				playTimeline();
				return;
			}
			countdown.textContent = String(remaining);
		}, 1000);
	};

	const showEmptyState = () => {
		iframe.hidden = true;
		iframe.removeAttribute('src');
		emptyState.hidden = false;
		browserAddress.textContent = 'tuportfolio.com';
	};

	const loadWebsite = (url: string) => {
		iframe.src = url;
		iframe.hidden = false;
		emptyState.hidden = true;
		browserAddress.textContent = new URL(url).hostname.replace(/^www\./, '');
	};

	const applyConfig = (nextConfig: PromoConfig, loadSavedUrl = false) => {
		config = nextConfig;
		stage.style.setProperty('--stage-background', config.backgroundColor);
		stage.style.setProperty('--stage-text', config.textColor);
		stage.style.setProperty(
			'--stage-title-size',
			config.title.length > 32 ? '82px' : config.title.length > 20 ? '96px' : '112px',
		);
		presentingPreview.textContent = config.presenting || ' ';
		titlePreview.textContent = config.title || ' ';
		const showingLogo = config.brandMode === 'logo';
		brandTextPreview.textContent = config.brand.trim();
		brandTextPreview.hidden = showingLogo;
		brandLogoPreview.hidden = !showingLogo || !config.brandLogo;
		if (config.brandLogo) brandLogoPreview.src = config.brandLogo;
		else brandLogoPreview.removeAttribute('src');
		brandPreview.hidden = showingLogo ? !config.brandLogo : config.brand.trim().length === 0;
		presentingInput.value = config.presenting;
		titleInput.value = config.title;
		brandInput.value = config.brand;
		brandModeButtons.forEach((button) => {
			button.setAttribute('aria-pressed', String(button.dataset.brandMode === config.brandMode));
		});
		brandTextPanel.hidden = showingLogo;
		brandLogoPanel.hidden = !showingLogo;
		logoPreview.hidden = !config.brandLogo;
		logoPlaceholder.toggleAttribute('hidden', Boolean(config.brandLogo));
		if (config.brandLogo) logoPreview.src = config.brandLogo;
		else logoPreview.removeAttribute('src');
		logoName.textContent = config.brandLogoName || 'Seleccionar logo';
		logoRemoveButton.hidden = !config.brandLogo;
		urlInput.value = config.url;
		backgroundPicker.value = config.backgroundColor.toLowerCase();
		backgroundHex.value = config.backgroundColor;
		textPicker.value = config.textColor.toLowerCase();
		textHex.value = config.textColor;
		colorPresetButtons.forEach((button) => {
			const isSelected =
				button.dataset.colorBackground === config.backgroundColor &&
				button.dataset.colorText === config.textColor;
			button.setAttribute('aria-pressed', String(isSelected));
		});
		staticToggle.checked = !config.animationEnabled;
		countdownToggle.checked = config.countdownEnabled;
		countdownToggle.disabled = !config.animationEnabled;
		if (titleCount) titleCount.textContent = String(config.title.length);
		if (loadSavedUrl && config.url) loadWebsite(config.url);
		updatePlaybackButtons();
	};

	const updateConfig = (partial: Partial<PromoConfig>): boolean => {
		applyConfig({ ...config, ...partial });
		return saveConfig(config);
	};

	const bindColorControls = (picker: HTMLInputElement, hexInput: HTMLInputElement, property: 'backgroundColor' | 'textColor') => {
		picker.addEventListener('input', () => updateConfig({ [property]: picker.value.toUpperCase() }));

		hexInput.addEventListener('input', () => {
			const color = hexInput.value.toUpperCase();
			hexInput.setAttribute('aria-invalid', String(!HEX_COLOR.test(color)));
			if (HEX_COLOR.test(color)) updateConfig({ [property]: color });
		});

		hexInput.addEventListener('blur', () => {
			if (!HEX_COLOR.test(hexInput.value)) applyConfig(config);
		});
	};

	urlForm.addEventListener('submit', (event) => {
		event.preventDefault();
		const normalizedUrl = normalizeUrl(urlInput.value);
		if (!normalizedUrl) {
			urlInput.setAttribute('aria-invalid', 'true');
			urlError.textContent = 'Introduce una dirección web válida con protocolo HTTP o HTTPS.';
			urlInput.focus();
			return;
		}

		urlInput.removeAttribute('aria-invalid');
		urlError.textContent = '';
		urlInput.value = normalizedUrl;
		loadWebsite(normalizedUrl);
		updateConfig({ url: normalizedUrl });
		if (animationController?.isAtStart()) animationController.showFinal();
		setStatus('Web cargada');
		updatePlaybackButtons();
	});

	presentingInput.addEventListener('input', () => updateConfig({ presenting: presentingInput.value.slice(0, 28) }));
	titleInput.addEventListener('input', () => updateConfig({ title: titleInput.value.slice(0, 48) }));
	brandInput.addEventListener('input', () => updateConfig({ brand: brandInput.value.slice(0, 32) }));

	brandModeButtons.forEach((button) => {
		button.addEventListener('click', () => {
			const mode = button.dataset.brandMode;
			if (mode !== 'text' && mode !== 'logo') return;
			updateConfig({ brandMode: mode });
			setStatus(mode === 'logo' ? 'Modo logo activo' : 'Modo texto activo');
		});
	});

	logoInput.addEventListener('change', async () => {
		logoError.textContent = '';
		const file = logoInput.files?.[0];
		if (!file) return;

		if (!LOGO_MIME_TYPES.has(file.type)) {
			logoError.textContent = 'Usa un archivo PNG, JPG, WebP o SVG.';
			logoInput.value = '';
			return;
		}
		if (file.size > MAX_LOGO_SIZE) {
			logoError.textContent = 'El logo supera el límite de 1 MB.';
			logoInput.value = '';
			return;
		}

		try {
			const dataUrl = await readFileAsDataUrl(file);
			if (!LOGO_DATA_URL.test(dataUrl)) throw new Error('El formato del logo no es válido.');
			const persisted = updateConfig({
				brandMode: 'logo',
				brandLogo: dataUrl,
				brandLogoName: file.name,
			});
			if (!persisted) logoError.textContent = 'El logo se muestra, pero no se pudo guardar para la próxima visita.';
			setStatus('Logo cargado');
		} catch (error) {
			console.warn('No se pudo cargar el logo.', error);
			logoError.textContent = 'No se pudo leer este archivo como logo.';
		} finally {
			logoInput.value = '';
		}
	});

	logoRemoveButton.addEventListener('click', () => {
		logoError.textContent = '';
		updateConfig({ brandLogo: '', brandLogoName: '' });
		setStatus('Logo eliminado');
	});

	staticToggle.addEventListener('change', () => {
		cancelCountdown();
		updateConfig({ animationEnabled: !staticToggle.checked });
		if (staticToggle.checked) animationController?.showFinal();
		else animationController?.showFinal();
		setStatus(staticToggle.checked ? 'Composición fija' : 'Animación preparada');
		updatePlaybackButtons();
	});

	countdownToggle.addEventListener('change', () => updateConfig({ countdownEnabled: countdownToggle.checked }));

	resetButton.addEventListener('click', () => {
		cancelCountdown();
		animationController?.reset();
		config = { ...DEFAULT_CONFIG };
		applyConfig(config);
		animationController?.showFinal();
		showEmptyState();
		urlError.textContent = '';
		urlInput.removeAttribute('aria-invalid');
		saveConfig(config);
		setStatus('Diseño restablecido');
	});

	playButton.addEventListener('click', () => {
		if (!animationController || !config.animationEnabled) return;
		if (animationController.isComplete()) animationController.reset();
		if (config.countdownEnabled && animationController.isAtStart()) startCountdown();
		else playTimeline();
	});

	pauseButton.addEventListener('click', () => {
		if (countdownRunning) {
			cancelCountdown();
			setStatus('Animación preparada');
		} else {
			animationController?.pause();
			setStatus('En pausa');
		}
		updatePlaybackButtons();
	});

	restartButton.addEventListener('click', () => {
		cancelCountdown();
		animationController?.reset();
		setStatus('Animación preparada');
		updatePlaybackButtons();
	});

	fullscreenButton.addEventListener('click', async () => {
		try {
			await stageController?.enterFullscreen();
			setStatus('Pantalla completa');
		} catch (error) {
			console.warn('No se pudo activar la pantalla completa.', error);
			setStatus('Pantalla completa no disponible');
		}
	});

	const handleFullscreenChange = () => {
		if (document.fullscreenElement) return;
		if (!config.animationEnabled) setStatus('Composición fija');
		else if (animationController?.isComplete()) setStatus('Animación completada');
		else if (animationController?.isPlaying()) setStatus('Reproduciendo');
		else setStatus('Vista previa lista');
	};
	document.addEventListener('fullscreenchange', handleFullscreenChange);

	bindColorControls(backgroundPicker, backgroundHex, 'backgroundColor');
	bindColorControls(textPicker, textHex, 'textColor');
	colorPresetButtons.forEach((button) => {
		button.addEventListener('click', () => {
			const backgroundColor = button.dataset.colorBackground;
			const textColor = button.dataset.colorText;
			if (!backgroundColor || !textColor || !HEX_COLOR.test(backgroundColor) || !HEX_COLOR.test(textColor)) return;
			updateConfig({ backgroundColor, textColor });
			setStatus('Combinación de color aplicada');
		});
	});
	applyConfig(config, true);
	animationController = setupPromoAnimation({
		onComplete: () => {
			setStatus('Animación completada');
			updatePlaybackButtons();
		},
	});
	animationController?.showFinal();
	updatePlaybackButtons();
	setStatus(config.animationEnabled ? 'Vista previa lista' : 'Composición fija');

	window.addEventListener('pagehide', () => {
		cancelCountdown();
		document.removeEventListener('fullscreenchange', handleFullscreenChange);
		animationController?.destroy();
		stageController?.destroy();
	}, { once: true });
}

initializeEditor();
