export const taskMessages = {
  starting: 'Starting Checks...',
  directoryCreationError: 'Error creating directories',
  fileVerificationError: 'Error verifying files',
  fileDownloadError: 'Error downloading files',
  selectInstallDir: 'Select client folder to continue',
  readyToPlay: 'Ready'
}

export const dialogMessages = {
  confirmEmptyInstallDir_title: 'Download all pSWG files?',
  confirmEmptyInstallDir: (dir) =>
    `The selected directory ${dir} is empty - all client files will be downloaded. This will take about 3Gb of hard drive space. Proceed?`,
  confirmExistingInstallDir_title: 'Install pSWG in existing directory?',
  confirmExistingInstallDir: (dir) =>
    `There are already files in ${dir} - if this is another SWG server client, it may break the installation. Cancel and install the pSWG client in a new empty folder if you're unsure.`,
  confirmFileRepair_title: 'Repair pSWG files?',
  confirmFileRepair: (dir, numFiles) =>
    `${numFiles} invalid files found in ${dir} - do you want to download new copies? This may break your client mods. Cancel and install the pSWG client in a new empty folder if you're unsure.`
}

const errorPrepend = 'Error: '
const errorAppend = ' - please re-select your client folder'
export const errorMessages = {
  general: `${errorPrepend}something went wrong${errorAppend}`,
  createDirs: (dir) => `${errorPrepend}could not create directories in ${dir}${errorAppend}`,
  installDir: (dir) => `${errorPrepend}folder ${dir} does not exist${errorAppend}`,
  download: `${errorPrepend}download failed${errorAppend}`,
  verify: `${errorPrepend}file verification failed${errorAppend}`
}
