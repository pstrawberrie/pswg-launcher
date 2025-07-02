export async function downloadFiles(missingFiles) {
  const downloadUrlBase = 'https://swg.pstraw.net/files'

  let totalMissingFiles = missingFiles.length
  const successfulDownloads = []
  const failedDownloads = []
  let downloadedFiles = 0

  try {
    for (let i = 0; i < totalMissingFiles; i++) {
      const missingFile = missingFiles[i]
      const downloadUrl = `${downloadUrlBase}/${missingFile}`

      // do downloads here
      downloadedFiles++

      // return success or failure after all are finished
      if (downloadedFiles === totalMissingFiles)
        return {
          success: successfulDownloads === totalMissingFiles,
          totalMissingFiles,
          successfulDownloads,
          failedDownloads
        }
    }
  } catch (err) {
    console.error('Error downloading files', err)
  }
}
