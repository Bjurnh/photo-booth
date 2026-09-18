import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SAVE_DIR = path.join(__dirname, 'saved-photos')
const PORT = 4000

if (!fs.existsSync(SAVE_DIR)) {
  fs.mkdirSync(SAVE_DIR, { recursive: true })
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '15mb' })) // photos as base64 can be a few MB

app.post('/api/save', (req, res) => {
  const { image } = req.body
  if (!image || !image.startsWith('data:image/')) {
    return res.status(400).json({ ok: false, error: 'Missing or invalid image data' })
  }

  const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
  const filename = `photobooth-${Date.now()}.png`
  const filePath = path.join(SAVE_DIR, filename)

  fs.writeFile(filePath, base64Data, 'base64', (err) => {
    if (err) {
      console.error('Failed to save photo:', err)
      return res.status(500).json({ ok: false, error: 'Failed to save file' })
    }
    console.log('Saved photo:', filename)
    res.json({ ok: true, filename })
  })
})

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Photobooth save server running on http://0.0.0.0:${PORT}`)
  console.log(`Photos will be saved to: ${SAVE_DIR}`)
  console.log(`On the iPad, set the save server URL to: http://<this-laptop-ip>:${PORT}`)
})
