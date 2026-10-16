import { App } from './core/App.js';
import { StartScreen } from './screens/StartScreen.js';

const app = new App({
  frame: document.getElementById('frame'),
  stage: document.getElementById('stage'),
  background: document.getElementById('background'),
  screen: document.getElementById('screen'),
});

app.start(StartScreen);
