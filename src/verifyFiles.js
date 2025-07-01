import { join } from 'path'
import { createReadStream } from 'node:fs'
import crypto from 'node:crypto'

export const treFileList = [
  { filePath: 'pswg.tre', fileHash: '54fb28f60030fc8b439199c7ffd7b12b' },
  { filePath: 'default_patch.tre', fileHash: '907194cd54efd6820c84db37c47dfe2d' },
  { filePath: 'patch_sku1_14_00.tre', fileHash: '3170521a8e7e0547e9117bc092cbd021' },
  { filePath: 'patch_14_00.tre', fileHash: '0649bd5305dd18cd5378cf542647e543' },
  { filePath: 'patch_sku1_13_00.tre', fileHash: '0792dac181188afed8776a742b64bcde' },
  { filePath: 'patch_13_00.tre', fileHash: '69650433d897167d74c0e352c4be9d8e' },
  { filePath: 'patch_sku1_12_00.tre', fileHash: '74b60af869237a07fa18dc65f80e7ed2' },
  { filePath: 'patch_12_00.tre', fileHash: '39ac219e16ad81c78075cf326886365d' },
  { filePath: 'patch_11_03.tre', fileHash: 'deb4626249c2b9c42dba8e4226dbd030' },
  { filePath: 'data_sku1_07.tre', fileHash: '7511e70cfd04fa20e796fc826fbe0fcf' },
  { filePath: 'patch_11_02.tre', fileHash: '2b63328b66db99f2d7d8858242a8bc4b' },
  { filePath: 'data_sku1_06.tre', fileHash: '88f986a7de3bd5617a7e16042bd368ce' },
  { filePath: 'patch_11_01.tre', fileHash: 'b7e13f12d157187212ed0cc7d5a71f87' },
  { filePath: 'patch_11_00.tre', fileHash: 'eb6289b9162851f2ee1adf00a9394df5' },
  { filePath: 'data_sku1_05.tre', fileHash: '9101b7bf19bd225854e84e42565f8bd6' },
  { filePath: 'data_sku1_04.tre', fileHash: '4d2734716afcb4f8607bb47243acb15f' },
  { filePath: 'data_sku1_03.tre', fileHash: 'caf586e0b039c79ff2197ceaf2a747b1' },
  { filePath: 'data_sku1_02.tre', fileHash: '15787e9235df1bd8031b5076558e68e0' },
  { filePath: 'data_sku1_01.tre', fileHash: 'eba6980265b5d742a3ff8897c6cb2ab5' },
  { filePath: 'data_sku1_00.tre', fileHash: '218bb19915380a12b74238a1d74ab27e' },
  { filePath: 'patch_10.tre', fileHash: 'a9b46686be046e866344e79d5515f236' },
  { filePath: 'patch_09.tre', fileHash: '021a722867d01fb7bc6b134a26b2df38' },
  { filePath: 'patch_08.tre', fileHash: '775454fc68755ad45c1e1d09ff06d645' },
  { filePath: 'patch_07.tre', fileHash: '17509e1d6f4fc09ab780dfeb7398cf9c' },
  { filePath: 'patch_06.tre', fileHash: '1102bbdf4628d9ee09fbe87d323017f9' },
  { filePath: 'patch_05.tre', fileHash: '207b70e873a73361efdfc9d1703fc16d' },
  { filePath: 'patch_04.tre', fileHash: '4a3604d48f2301341326e0b101280968' },
  { filePath: 'patch_03.tre', fileHash: 'bfdca07c64d3d8f706889eafa5e8b666' },
  { filePath: 'patch_02.tre', fileHash: '2324adad81158de1e938db603287ac50' },
  { filePath: 'patch_01.tre', fileHash: '36fd18e8342b23ae2df51b916324f348' },
  { filePath: 'patch_00.tre', fileHash: '1517a0a0e7e11c5d1afc43c1b404a045' },
  { filePath: 'data_other_00.tre', fileHash: '59cb600a9af908b98d8d1c8934ec932b' },
  { filePath: 'data_static_mesh_01.tre', fileHash: 'd453b7f6f562368a4d06a3f9fd4e8339' },
  { filePath: 'data_static_mesh_00.tre', fileHash: 'ec1fa71af211fcf1cd86f5aa8752283a' },
  { filePath: 'data_texture_07.tre', fileHash: 'c77f34ffa2c15663679f1aa86c43a3d5' },
  { filePath: 'data_texture_06.tre', fileHash: '968d2cafba5a4c5fcedbeeba7a8c4d20' },
  { filePath: 'data_texture_05.tre', fileHash: 'fe62a811e86f38a21080b02782c9e662' },
  { filePath: 'data_texture_04.tre', fileHash: '80057e761dc219250b9319e61f10ba91' },
  { filePath: 'data_texture_03.tre', fileHash: '636c5d29046f354c8a118b3c96285084' },
  { filePath: 'data_texture_02.tre', fileHash: '9d5dda098c258bb5caa84a610715d834' },
  { filePath: 'data_texture_01.tre', fileHash: '740124b213b92a16907a0fbaad0fa130' },
  { filePath: 'data_texture_00.tre', fileHash: '6c8c538d209f5bd428bc9da194ebd30d' },
  { filePath: 'data_skeletal_mesh_01.tre', fileHash: 'f39551ae0bda6b2ee0bc4c954fcd3699' },
  { filePath: 'data_skeletal_mesh_00.tre', fileHash: 'ecdaefc123971d167159698f0f47aca4' },
  { filePath: 'data_animation_00.tre', fileHash: '1ae26649af2c30efe317850c4cb1a4bd' },
  { filePath: 'data_sample_04.tre', fileHash: 'a22f0c8c8f4b6104647af628579cc0e3' },
  { filePath: 'data_sample_03.tre', fileHash: '2947689850819a256171547af1a300d1' },
  { filePath: 'data_sample_02.tre', fileHash: '52a3cc6829df957c9d72eccc1b23cad2' },
  { filePath: 'data_sample_01.tre', fileHash: '9c0c272400dd2780addd9a8e25334fbf' },
  { filePath: 'data_sample_00.tre', fileHash: 'c96a2eb77f27b6453053f0820b38ab7c' },
  { filePath: 'data_music_00.tre', fileHash: '88ee64f7e334616fbf688b09022e81df' },
  { filePath: 'bottom.tre', fileHash: '63c2d21719ed56d96b70373d99cc94d6' }
].reverse()

export async function verifyFiles(installDir) {
  console.log('verifyFiles() starting...')

  const totalFiles = treFileList.length
  let verifiedCount = 0

  function getPercentComplete() {
    return Math.floor((verifiedCount / totalFiles) * 100)
  }

  for (const file of treFileList) {
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

verifyFiles('E:/pSWG_test')
