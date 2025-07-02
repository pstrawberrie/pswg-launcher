import { join } from 'path'
import { createReadStream, readdirSync, mkdirSync } from 'node:fs'
import crypto from 'node:crypto'
import { directoryList, fileList } from './files.js'

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
export const makeDirectories = (installDir) =>
  new Promise((resolve, reject) => {
    let totalDirs = directoryList.length
    let created = 0

    for (let i = 0; i < totalDirs; i++) {
      const dirPath = join(installDir, directoryList[i])

      try {
        mkdirSync(dirPath, { recursive: true })
        created++
        console.log(`(${created}/${totalDirs}) created ${dirPath}`)
        resolve()
      } catch (err) {
        console.error(`Error creating directory: ${dirPath}`, err)
        reject(err)
      }
    }
  })

// Verify files and return an object containing verified files, missing files, and mismatched hash files
export async function verifyFiles(installDir) {
  const totalFiles = fileList.length
  const verifiedFiles = []
  const missingFiles = []
  const badHashFiles = []
  let processedCount = 0

  function getPercentComplete() {
    return Math.floor((processedCount / totalFiles) * 100)
  }

  for (let i = 0; i < totalFiles; i++) {
    const file = fileList[i]

    try {
      const hash = crypto.createHash('md5')
      const stream = createReadStream(join(installDir, file.filePath))

      stream.on('data', (chunk) => {
        hash.update(chunk)
      })

      await new Promise((resolve, reject) => {
        stream.on('end', () => {
          const fileHash = hash.digest('hex')
          console.log(`hash for ${file.filePath}: ${fileHash}`)

          if (fileHash === file.fileHash) {
            console.log(`verified hash: ${file.filePath}`)
            verifiedFiles.push(file)
          } else {
            console.log(`bad hash: ${file.filePath}`)
            badHashFiles.push(file)
          }

          processedCount++
          console.log(`${getPercentComplete()}% (${processedCount}/${totalFiles})`)
          resolve()
        })

        stream.on('error', (err) => {
          if (err.code === 'ENOENT') {
            console.log(`missing file: ${file.filePath}`)
            missingFiles.push(file)

            processedCount++
            resolve()
          } else {
            console.error(`Error processing file: ${file.filePath}`, err)
            reject(err)
          }
        })
      })
    } catch (err) {
      console.error(`Failed to verify file: ${file.filePath}`, err)
    }

    console.log(`${processedCount}/${totalFiles}`)
    if (processedCount === totalFiles)
      return { totalFiles, verifiedFiles, missingFiles, badHashFiles }
  }
}

async function run() {
  const isEmpty = await isInstallDirEmpty()

  if (isEmpty) {
    console.log(
      'install dir is empty - inform user and ask if they want to download client files to this dir'
    )
    // // if client says yes
  } else {
  }
  await makeDirectories('E:/test_1')
  const result = await verifyFiles('E:/test_1')
  console.log('----------------')
  console.log('----------------')
  console.log(`Verified Files: ${result.verifiedFiles.length}/${result.totalFiles}`)
  console.log(`Bad Hash Files: ${result.badHashFiles.length}/${result.totalFiles}`)
  console.log(`Missing Files: ${result.missingFiles.length}/${result.totalFiles}`)
  console.log('----------------')
  console.log('----------------')
}

run()
