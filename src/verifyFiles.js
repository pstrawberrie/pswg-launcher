import { join } from 'path'
import { createReadStream, mkdirSync } from 'node:fs'
import crypto from 'node:crypto'
import { directoryList, fileList } from './files.js'

export function makeDirectories(installDir) {
  let totalDirs = directoryList.length
  let created = 0

  for (const dir of directoryList) {
    const dirPath = join(installDir, dir)

    try {
      mkdirSync(dirPath, { recursive: true })
      created++
      console.log(`(${created}/${totalDirs}) created ${dirPath}`)
    } catch (err) {
      console.error(`Error creating directory: ${dirPath}`, err)
    }
  }
}

export async function verifyFiles(installDir) {
  const totalFiles = fileList.length
  let verifiedCount = 0

  function getPercentComplete() {
    return Math.floor((verifiedCount / totalFiles) * 100)
  }

  for (const file of fileList) {
    try {
      const hash = crypto.createHash('md5')
      const stream = createReadStream(join(installDir, file.filePath))

      stream.on('data', (chunk) => {
        hash.update(chunk)
      })

      await new Promise((resolve, reject) => {
        stream.on('end', () => {
          const fileHash = hash.digest('hex')
          if (fileHash === file.fileHash) {
            verifiedCount++
            console.log(
              `${getPercentComplete()}% (${verifiedCount}/${totalFiles}) hash for ${file.filePath}: ${fileHash}`
            )
            resolve()
          } else {
            reject(`Hash does not match for ${file.filePath}`)
          }
        })

        stream.on('error', (err) => {
          console.error(`Error processing file: ${file.filePath}`, err)
          reject(err)
        })
      })
    } catch (err) {
      console.error(`Failed to verify file: ${file.filePath}`, err)
    }
  }
}

makeDirectories('E:/_test1')
verifyFiles('E:/pSWG_test')
