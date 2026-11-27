import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { startupMark } from './app/utils/startup-timing';

startupMark('script-start');

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
