import { join } from 'path'
import { createReadStream, readdirSync, mkdirSync } from 'node:fs'
import crypto from 'node:crypto'
import { directoryList, fileList } from './files.js'
import { errorMessages } from './strings.js'

// Get Percent Complete Util
function getPercentComplete(count, total) {
  return Math.floor((count / total) * 100)
}

// Check if chosen install directory is empty
export const isInstallDirEmpty = (installDir) =>
  new Promise((resolve, reject) => {
    try {
      const contents = readdirSync(installDir)
      resolve(contents.length === 0)
    } catch (err) {
      console.error('Error in isInstallDirEmpty: ', err)
      reject(err)
    }
  })

// Make directories for files before downloading them
// - this will not error out if the directories already exist, so we will run it every time we need to download
export const makeDirectories = (installDir, eventEmitter) =>
  new Promise((resolve, reject) => {
    let totalDirs = directoryList.length
    let created = 0

    for (let i = 0; i < totalDirs; i++) {
      const dirPath = join(installDir, directoryList[i])

      try {
        mkdirSync(dirPath, { recursive: true })
        created++
        console.log(`(${created}/${totalDirs}) created ${dirPath}`)
        eventEmitter({
          message: `${created}/${totalDirs} directories created`,
          progress: getPercentComplete(created, totalDirs)
        })

        if (created === totalDirs) resolve({ success: true })
      } catch (err) {
        console.error(`Error creating directory: ${dirPath}`, err)
        eventEmitter({ error: true, message: errorMessages.createDirs(dirPath) })
        reject(err)
      }
    }
  })

// Verify files and return an object containing verified files, missing files, and mismatched hash files
export async function verifyFiles(installDir, eventEmitter) {
  const totalFiles = fileList.length
  const verifiedFiles = []
  const missingFiles = []
  const badHashFiles = []
  let processedCount = 0

  for (let i = 0; i < totalFiles; i++) {
    const file = fileList[i]

    try {
      const hash = crypto.createHash('md5')
      const stream = createReadStream(join(installDir, file.filePath))

      stream.on('data', (chunk) => {
        hash.update(chunk)
      })

      await new Promise((resolve, reject) => {
        eventEmitter({
          downloading: true,
          message: `Verifying ${file.filePath}...`,
          progress: getPercentComplete(processedCount, totalFiles)
        })

        stream.on('end', () => {
          const fileHash = hash.digest('hex')
          console.log(`hash for ${file.filePath}: ${fileHash}`)

          if (fileHash === file.fileHash || file?.skipHash) {
            if (fileHash === file.fileHash) console.log(`verified hash: ${file.filePath}`)
            if (file?.skipHash) console.log(`skipped hash for user file: ${file.filePath}`)
            verifiedFiles.push(file)
          } else {
            console.log(`bad hash: ${file.filePath}`)
            badHashFiles.push(file)
          }

          processedCount++
          eventEmitter({
            message: `${processedCount}/${totalFiles} files verified`,
            progress: getPercentComplete(processedCount, totalFiles)
          })
          resolve()
        })

        stream.on('error', (err) => {
          if (err.code === 'ENOENT') {
            console.log(`missing file: ${file.filePath}`)
            missingFiles.push(file)

            processedCount++

            eventEmitter({
              message: `${processedCount}/${totalFiles} files verified`,
              progress: getPercentComplete(processedCount, totalFiles)
            })
            resolve()
          } else {
            console.error(`Error processing file: ${file.filePath}`, err)
            eventEmitter({ error: true, message: errorMessages.verify })
            reject(err)
          }
        })
      })
    } catch (err) {
      console.error(`Failed to verify file: ${file.filePath}`, err)
      eventEmitter({ error: true, downloading: false, message: errorMessages.verify })
    }

    if (processedCount === totalFiles) {
      eventEmitter({ success: true, downloading: false })
      return { totalFiles, verifiedFiles, missingFiles, badHashFiles }
    }
  }
}

export async function downloadFiles(files, installDir, session, eventEmitter) {
  const downloadUrlBase = 'https://swg.pstraw.net/files'
  const filesToDownload = files === null ? fileList : files

  const totalFiles = filesToDownload.length
  const successfulDownloads = []
  const failedDownloads = []

  let completedCount = 0

  eventEmitter({ downloading: true })

  for (const file of filesToDownload) {
    await new Promise((res) => {
      const downloadUrl = `${downloadUrlBase}/${file.filePath}`
      const filename = file.filePath.split('/').pop()
      const savePath = join(installDir, file.filePath)

      const onDownload = (event, item) => {
        // only handle our file (not other downloads)
        if (!item.getURL().endsWith(file.filePath)) {
          console.log('issue with the file name in downloadFiles -> handleDownload')
          return
        }

        // remove listener after match
        session.defaultSession.removeListener('will-download', onDownload)

        // set save path of file
        item.setSavePath(savePath)

        // Progress tracking
        item.on('updated', () => {
          const received = item.getReceivedBytes()
          const total = item.getTotalBytes()

          // Emit individual file progress
          eventEmitter({
            message: `${getPercentComplete(completedCount, totalFiles)}% Complete:  Downloading ${filename} (${completedCount + 1}/${totalFiles})`,
            progress: Math.floor((received / total) * 100)
          })
        })

        item.once('done', (event, state) => {
          completedCount++

          if (state === 'completed') {
            console.log(`Download completed: ${filename}`)
            successfulDownloads.push(file)
          } else {
            console.error(`Download failed: ${filename} - ${state}`)
            failedDownloads.push(file)
          }

          eventEmitter({
            message: `${getPercentComplete(completedCount, totalFiles)}% Complete`,
            progress: getPercentComplete(completedCount, totalFiles)
          })

          res()
        })
      }

      session.defaultSession.on('will-download', onDownload)
      session.defaultSession.downloadURL(downloadUrl)
    })
  }

  const success = failedDownloads.length === 0
  if (success) {
    eventEmitter({ success, downloading: false })
  } else {
    eventEmitter({ error: true, downloading: false, message: errorMessages.download })
  }

  return {
    success,
    totalFiles,
    successfulDownloads,
    failedDownloads
  }
}
