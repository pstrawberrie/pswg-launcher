/**
 * Elements
 */
const el = {
  displayTitle: document.querySelectorAll('.DISPLAY_TITLE'),
  versions: document.getElementById('versions'),
  installDirButton: document.getElementById('install-dir'),
};

/**
 * IPC Startup
 */
let settings;
const ipcStartup = async () => {
  settings = await window.app.getSettings();
  console.log('got settings:', settings);

  // Inject text from settings
  [...el.displayTitle].map(t => t.innerText = settings.constants.DISPLAY_TITLE);
  el.installDirButton.innerText = settings.constants.SELECT_INSTALL_DIR;
  el.versions.innerText = `Chrome (v${app.chromeVersion()}), Node.js (v${app.nodeVersion()}), Electron (v${app.electronVersion()})`;
}
ipcStartup();

/**
 * Install Dir Functionality
 */
el.installDirButton.addEventListener('click', async () => {
  try {
    const response = await window.app.selectInstallDir();
    console.log(response);
  } catch (err) {
    console.error(err);
  }
});