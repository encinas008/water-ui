import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { register as registerSwiperElements } from 'swiper/element/bundle';

// Save original method
// const originalAddEventListener = EventTarget.prototype.addEventListener;

// // Override
// EventTarget.prototype.addEventListener = function (
//   type: string,
//   listener: EventListenerOrEventListenerObject,
//   options?: boolean | AddEventListenerOptions
// ) {
//   // Force passive: false for specific events
//   const needsPassiveFalse = ['touchstart', 'touchmove', 'wheel'].includes(type);

//   if (needsPassiveFalse) {
//     if (typeof options === 'boolean' || options === undefined) {
//       options = { passive: false };
//     } else if (typeof options === 'object') {
//       options.passive = false;
//     }
//   }

//   return originalAddEventListener.call(this, type, listener, options);
// };

registerSwiperElements();

async function loadRuntimeConfig(): Promise<void> {
  try {
    const response = await fetch('config.json', { cache: 'no-store' });
    if (!response.ok) {
      return;
    }
    const config = await response.json();
    Object.assign(environment, config);
  } catch {
    // Sin config.json (p. ej. ng serve) se usa el valor de environment.ts
  }
}

loadRuntimeConfig().then(() =>
  bootstrapApplication(AppComponent, appConfig)
    .catch((err) => console.error(err))
);
